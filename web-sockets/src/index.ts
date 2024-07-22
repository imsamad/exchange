require("dotenv").config();
import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "./types";
import { createClient, RedisClientType } from "redis";

const wss = new WebSocketServer({ port: 5000 });

const user_to_sockets: Record<string, WebSocket> = {};

const subscriptions: Record<string, string[]> = {};

const reverseSubscriptions: Record<string, string[]> = {};

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient
  .connect()
  .then(() => {
    console.log("conneted to redis");
    handleWS();
  })
  .catch((err) => {
    console.error("error while conecting to redis in ws");
    console.error(err);
  });

function handleWS() {
  wss.on("connection", (ws) => {
    const userId = getRandomId();
    user_to_sockets[userId] = ws;

    ws.on("message", (_message: string) => {
      const message: IncomingMessage = JSON.parse(_message);
      if (message.method == "SUBSCRIBE") {
        handleSubcriptions(message);
      } else if (message.method == "UNSUBSCRIBE") {
        handleUnsubscription(message);
      }
    });
    ws.addEventListener("close", () => {
      handleCloseEvent();
    });

    function handleSubcriptions(message: IncomingMessage) {
      message.params.forEach((_sub) => {
        let sub = _sub.toLowerCase();

        if (!subscriptions[userId]) subscriptions[userId] = [];

        if (!subscriptions[userId].includes(sub)) {
          subscriptions[userId].push(sub);

          if (!reverseSubscriptions[sub]) {
            redisClient.subscribe(sub.toLowerCase(), (message) => {
              reverseSubscriptions[sub].forEach((userId) => {
                console.log("userId");
                user_to_sockets[userId].send(message);
              });
            });
            reverseSubscriptions[sub] = [];
          }

          reverseSubscriptions[sub].push(userId);
        }
      });
    }

    function handleUnsubscription(message: IncomingMessage) {
      message.params.forEach((_sub) => {
        let sub = _sub.toLowerCase();

        subscriptions[userId] = subscriptions[userId].filter?.((p) => p != sub);

        reverseSubscriptions[sub] = reverseSubscriptions[sub].filter(
          (u) => u != userId
        );
      });
    }

    function handleCloseEvent() {
      subscriptions[userId].length &&
        subscriptions[userId]?.forEach?.((sub) => {
          reverseSubscriptions[sub] = reverseSubscriptions[sub].filter(
            (user) => user != userId
          );

          if (reverseSubscriptions[sub].length == 0) {
            delete reverseSubscriptions[sub];
            redisClient.unsubscribe(sub);
          }
        });

      delete subscriptions[userId];

      delete user_to_sockets[userId];
    }
  });
}

function getRandomId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

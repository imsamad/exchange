import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { CustomeError } from './libs/CustomError';
import { ErrorHandler } from './middlewares/ErrorHandler';
import { createClient } from 'redis';
import { MessageFromEngine, MessageToEngine, MessageToStore } from './types';
import { authMiddleware } from './middlewares/auth';

const appInstance = express();

appInstance.use(express.json()).use(cors()).use(morgan('dev'));

const client = createClient({
  url: process.env.REDIS_URL!,
});

const publish = createClient({
  url: process.env.REDIS_URL!,
});

publish.connect();

client
  .connect()
  .then(() => {
    console.log('connected redis');
  })
  .catch((err) => {
    console.log('err: ', err);
  });

const sendAndWait = (
  message: MessageToEngine | MessageToStore
): Promise<MessageFromEngine> =>
  new Promise((resolve) => {
    const clientId =
      Math.random().toString().slice(2, 10) +
      Math.random().toString().slice(2, 10);

    client.lPush(
      'messages',
      JSON.stringify({
        clientId,
        message,
      })
    );

    publish.subscribe(clientId, (message: any) => {
      resolve(message);
    });
  });

appInstance.post('/limitorder', async (req, res) => {
  const message = await sendAndWait(req.body);

  res.json({
    message: message,
  });
});

appInstance.post('/onramp', async (req, res) => {
  console.log('req.body: ', req.body);
  if (!req.body.amount)
    throw new CustomeError(404, {
      message: 'provide amount!',
    });

  client.lPush(
    'messages',
    JSON.stringify({
      message: {
        type: 'ON_RAMP',
        payload: {
          userId: req.body.userId,
          amount: req.body.amount,
          txnId: req.body.txnId,
          quoteAsset: req.body.quoteAsset,
        },
      },
    })
  );

  res.json({
    ok: 1,
  });
});

appInstance.use(() => {
  throw new CustomeError(404, 'Not Found!');
});

appInstance.use(ErrorHandler);

export { appInstance };

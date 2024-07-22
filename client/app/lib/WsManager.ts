export class WsManager {
  private static instance: WsManager;
  private ws: WebSocket;
  private bufferedMessages: any[] = [];
  private intialised: boolean;
  private callbacks: any = {};
  private id: number;

  constructor() {
    // @ts-ignore
    this.ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL as string);
    this.bufferedMessages = [];
    this.intialised = false;
    this.init();
    this.id = 1;
  }
  public static getInstance() {
    if (!WsManager.instance) WsManager.instance = new WsManager();

    return WsManager.instance;
  }

  init() {
    this.ws.addEventListener("open", () => {
      this.intialised = true;
      this.bufferedMessages.forEach((msg) => {
        this.ws.send(JSON.stringify(msg));
      });

      this.bufferedMessages = [];
    });

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      const type = message.data.type;
      if (this.callbacks[type]) {
        this.callbacks[type].forEach(({ callback }: any) => {
          const { tradeId, price, quantity, timestamp } = message.data;

          if (type == "trade") {
            callback({ tradeId, price, quantity, timestamp });
          } else if (type === "depth") {
            const updatedBids = message.data.updatedBids;
            const updatedAsks = message.data.updatedAsks;
            callback({
              bids: updatedBids,
              asks: updatedAsks,
              currentPrice: message.data.currentPrice,
            });
          }
        });
      }
    };
  }

  sendMessage(message: any) {
    if (!this.intialised) {
      this.bufferedMessages.push({ ...message, id: this.id++ });
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  async registerCallback(type: string, callback: any, id: string) {
    this.callbacks[type] = this.callbacks[type] || [];
    this.callbacks[type].push({ callback, id });
    // "ticker" => callback
  }

  async deRegisterCallback(type: string, id: string) {
    if (this.callbacks[type]) {
      const index = this.callbacks[type].findIndex(
        (callback: any) => callback.id === id
      );
      if (index !== -1) {
        this.callbacks[type].splice(index, 1);
      }
    }
  }
}

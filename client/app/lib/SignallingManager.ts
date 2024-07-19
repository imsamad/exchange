export class SignallingManager {
  private static instance: SignallingManager;
  private ws: WebSocket;
  private bufferedMessages: any[] = [];
  private intialised: boolean;

  constructor() {
    this.ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL as string);
    this.bufferedMessages = [];
    this.intialised = false;
    this.init();
  }
  public static getInstance() {
    if (!SignallingManager.instance)
      SignallingManager.instance = new SignallingManager();

    return SignallingManager.instance;
  }

  init() {
    this.ws.addEventListener("open", () => {
      this.intialised = true;
      this.bufferedMessages.forEach((msg) => {
        console.log("from buffer");
        this.ws.send(JSON.stringify(msg));
      });

      this.bufferedMessages = [];
    });

    this.ws.addEventListener("message", (event) => {
      console.log("event: ", JSON.parse(event.data));
    });
  }

  sendMessage(message: any) {
    if (!this.intialised) {
      console.log("pushed it");
      this.bufferedMessages.push(message);
      return;
    }
    console.log("sending actually");
    this.ws.send(JSON.stringify(message));
  }
}

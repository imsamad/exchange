export class CustomeError extends Error {
  public statusCode: number;

  public msg: any;

  constructor(statusCode: number, msg: any) {
    super('Hello from custom error');
    this.statusCode = statusCode;
    this.msg = msg;
  }
}

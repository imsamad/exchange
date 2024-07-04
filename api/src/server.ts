import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { CustomeError } from './libs/CustomError';
import { ErrorHandler } from './middlewares/ErrorHandler';

const appInstance = express();

appInstance.use(express.json()).use(cors()).use(morgan('dev'));

appInstance.get('/', (req, res) => {
  console.log('first');
  res.json({
    message: 1,
  });
});

appInstance.use(() => {
  throw new CustomeError(404, 'Not Found!');
});

appInstance.use(ErrorHandler);

export { appInstance };

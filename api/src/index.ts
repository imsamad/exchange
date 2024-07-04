import { appInstance } from './server';

const PORT = process.env.PORT! || 4000;

appInstance.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});

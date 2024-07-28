require("dotenv").config();
import { appInstance } from "./server";

const PORT = process.env.PORT! || 4000;
console.log('process.env.PORT',process.env.REDIS_URL)

appInstance.listen(PORT, async () => {
  console.log(`Listening on ${PORT}`);
});

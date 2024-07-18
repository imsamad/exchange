require("dotenv").config();
import { appInstance } from "./server";

const PORT = process.env.PORT! || 4000;

appInstance.listen(PORT, async () => {
  console.log(`Listening on ${PORT}`);
});

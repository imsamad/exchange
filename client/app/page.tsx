import { Box } from "@radix-ui/themes";
import Navbar from "./Components/Navbar";
import LimitOrder from "./Components/OrderForm/LimitOrder";
import Temp from "./Temp";

const HomePage = () => {
  return (
    <div>
      <Navbar />

      <div className="flex ">
        <Box className="flex-[0.75]">Chart</Box>
        <Box className="flex-[0.25]">
          <LimitOrder />
        </Box>
      </div>
    </div>
  );
};

export default HomePage;

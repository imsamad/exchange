import { Box } from "@radix-ui/themes";
import Navbar from "../../Components/Navbar";
import LimitOrder from "../../Components/OrderForm/LimitOrder";

const HomePage = () => {
  return (
    <>
      <Navbar />

      <div className="flex ">
        <Box className="flex-[0.75]">Chart</Box>
        <Box className="flex-[0.25]">
          <LimitOrder currentPrice={1000} />
        </Box>
      </div>
    </>
  );
};

export default HomePage;

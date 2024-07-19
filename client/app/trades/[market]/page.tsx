"use client";
import { Box } from "@radix-ui/themes";
import Navbar from "../../Components/Navbar";
import LimitOrder from "../../Components/OrderForm/LimitOrder";
import DepthTab from "@/app/Components/Depth";
import { useParams } from "next/navigation";

const HomePage = () => {
  const params = useParams<{ market: string }>();

  return (
    <>
      <Navbar />

      <div className="flex ">
        <Box className="flex-[0.75]">
          <DepthTab market={params.market} />
        </Box>
        <Box className="flex-[0.25]">
          <LimitOrder market={params.market} currentPrice={1000} />
        </Box>
      </div>
    </>
  );
};

export default HomePage;

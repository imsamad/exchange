'use client';
import { Box } from '@radix-ui/themes';
import Navbar from '../../Components/Navbar';
import LimitOrder from '../../Components/OrderForm/LimitOrder';
import DepthTab from '@/app/Components/Depth';
import TradesTab from '@/app/Components/Trades';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const HomePage = () => {
  const params = useParams<{ market: string }>();
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  const market = params.market.split('_');
  const base_asset = market[0].toUpperCase();
  const quote_asset = market[1].toUpperCase();

  return (
    <>
      <Navbar />

      <div className='flex'>
        <Box className='flex-[0.75]'>
          <p className='p-4 font-semibold text-lg italic '>
            Current Price: {currentPrice} {quote_asset} / {base_asset}
          </p>
          <div className='flex'>
            <div className='w-[50%] p-4'>
              <DepthTab market={params.market} />
            </div>
            <div className='w-[50%] p-4'>
              <TradesTab
                market={params.market}
                setCurrentPrice={setCurrentPrice}
              />
            </div>
          </div>
        </Box>
        <Box className='flex-[0.25]'>
          <LimitOrder market={params.market} currentPrice={currentPrice} />
        </Box>
      </div>
    </>
  );
};

export default HomePage;

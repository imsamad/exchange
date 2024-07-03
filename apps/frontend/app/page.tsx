import React from 'react';
import LimitOrder from './Components/OrderForm/LimitOrder';
import { hello } from 'utils/src/index';
const HomePage = () => {
  hello('csdhcnjk');
  console.log('first');

  return (
    <div>
      <h1>{JSON.stringify(hello('csdjkbncjhb'))}</h1> <LimitOrder />
    </div>
  );
};

export default HomePage;

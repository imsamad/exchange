'use client';
import { what } from '@/app/action';
import React, { ChangeEvent, FormEvent, useState } from 'react';

const LimitOrder = () => {
  const [formBody, setFormBody] = useState({
    qty: 0,
    price: 0,
  });

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    setFormBody((pre) => ({ ...pre, [target.name]: target.value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(JSON.stringify(formBody));
    await what(formBody);
  };

  return (
    <form
      onSubmit={onSubmit}
      className='flex flex-col max-w-lg m-auto mt-24 border-4 border-black p-4 rounded-lg'
    >
      <h1 className='text-2xl'>Limit Order</h1>
      <label htmlFor='qty'>Quantity</label>
      <input
        type='number'
        name='qty'
        onChange={onChange}
        value={formBody.qty}
        className='border-black-400 border-4 my-4'
      />
      <label htmlFor='qty'>Price per Quantity</label>
      <input
        type='number'
        name='price'
        onChange={onChange}
        value={formBody.price}
        className='border-black-400 border-4 my-4'
      />
      <br />
      <input type='submit' value='Submit' />
    </form>
  );
};

export default LimitOrder;

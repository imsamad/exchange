"use client";
import React, { ChangeEvent, FormEvent, useState } from "react";

const LimitOrder = () => {
  const [formBody, setFormBody] = useState({
    userId: "123",
    market: "TATA_INR",
    side: "ask",
    quantity: 0,
    price: 0,
  });

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    setFormBody((pre) => ({ ...pre, [target.name]: target.value }));
  };

  const onSubmit = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/limitorder`, {
      method: "POST",
      body: JSON.stringify(formBody),
      headers: {
        "Content-type": "application/json",
      },
    });
    const data = await res.json();

    console.log("data: ", data);
  };

  return (
    <div className="flex flex-col max-w-lg m-auto mt-24 border-4 border-black p-4 rounded-lg">
      <h1 className="text-2xl">Limit Order</h1>
      <label htmlFor="quantity">Quantity</label>
      <input
        type="number"
        name="quantity"
        onChange={onChange}
        value={formBody.quantity}
        className="border-black-400 border-4 my-4"
      />
      <label htmlFor="quantity">Price per Quantity</label>
      <input
        type="number"
        name="price"
        onChange={onChange}
        value={formBody.price}
        className="border-black-400 border-4 my-4"
      />
      <div className="flex space-x-4 border-0 border-cyan-400">
        <button
          className="flex-1  border-2 border-cyan-400"
          onClick={(e) => {
            setFormBody((p) => ({ ...p, side: "buy" }));
          }}
        >
          Buy
        </button>
        <button
          className="flex-1 border-2 border-cyan-400"
          onClick={(e) => {
            setFormBody((p) => ({ ...p, side: "ask" }));
          }}
        >
          Ask
        </button>
      </div>
      <br />
      <button
        onClick={() => {
          onSubmit();
        }}
      >
        Submit
      </button>
    </div>
  );
};

export default LimitOrder;

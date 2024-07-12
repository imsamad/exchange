"use client";
import { Button, Flex, TextField } from "@radix-ui/themes";
import Image from "next/image";
import React, { ChangeEvent, useState } from "react";

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
  };
  const [side, setSide] = useState<"buy" | "ask">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [priceOrQty, setPriceOrQty] = useState<"price" | "volume">("price");

  return (
    <div className="self-stretch">
      <Flex className="border-b-2 border-gray-800 text-lg">
        <button
          onClick={() => setSide("buy")}
          className={`transition flex-1 py-4 text-green-500 border-b-2 border-b-transparent ${
            side == "buy" ? "  border-b-green-900" : "hover:border-b-white"
          } `}
        >
          Buy
        </button>
        <button
          className={`transition flex-1 py-4 text-pink-300   border-b-2 border-b-transparent ${
            side == "ask" ? "border-b-pink-600" : "hover:border-b-white"
          }`}
          onClick={() => setSide("ask")}
        >
          Sell
        </button>
      </Flex>

      <div className="p-2">
        <Flex className="gap-4 ">
          <button
            onClick={() => setOrderType("limit")}
            className={`py-[1px] px-2 border-b-2 border-b-transparent  text-gray-400 transition ${
              orderType == "limit"
                ? "border-b-gray-300"
                : "hover:border-b-gray-300"
            }`}
          >
            Limit
          </button>
          <button
            onClick={() => setOrderType("market")}
            className={`py-[1px] px-2 border-b-2 border-b-transparent  text-gray-400 transition ${
              orderType == "market"
                ? "border-b-gray-300"
                : "hover:border-b-gray-300"
            }`}
          >
            Market
          </button>
        </Flex>

        <Flex className="p-2 pb-0 pt-4 text-sm text-gray-500" justify="between">
          <p>Available Balance</p>
          <p className="text-gray-200">0.0 USDC</p>
        </Flex>

        <button
          className="p-2 pt-3 pb-0 text-sm text-gray-500 flex justify-between items-center gap-1 select-none"
          onClick={() =>
            setPriceOrQty((p) => (p != "price" ? "price" : "volume"))
          }
        >
          <p>{priceOrQty == "price" ? "Order Value" : "Volume"}</p>

          <SwapSvgIcon />
        </button>
        <div className="px-2 mt-2 flex flex-col gap-2">
          <TextField.Root size="3" type="number" className="text-right" />
          <Button color="gray" variant="solid" highContrast radius="full">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LimitOrder;

const SwapSvgIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-arrow-left-right ml-1 h-4 w-4 text-baseTextMedEmphasis"
  >
    <path d="M8 3 4 7l4 4" />
    <path d="M4 7h16" />
    <path d="m16 21 4-4-4-4" />
    <path d="M20 17H4" />
  </svg>
);

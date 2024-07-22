"use client";
import { TIncomingOrder } from "@/app/lib/types";
import { Button, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useSession } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";

const LimitOrder = ({ market }: { market: string; currentPrice: number }) => {
  const { data, status } = useSession();
  const [myBalance, setMyBalance] = useState(0);

  const getAndSetBalance = async () => {
    if (status != "authenticated") return;

    try {
      const res: any = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mybalance`,
        {
          headers: {
            // @ts-ignore
            authorization: `Bearer ${data.jwtToken!}`,
          },
        }
      );

      const rowData = await res.json();

      const quote_asset = market.split("_")[1];

      setMyBalance(rowData.find((b: any) => b.asset == quote_asset).available);
    } catch (error) {
      console.log("err in fetching balance: ", error);
    }
  };

  useEffect(() => {
    (async () => {
      await getAndSetBalance();
    })();
  }, []);

  const pathname = usePathname();

  const [formBody, setFormBody] = useState<{
    side: "bid" | "ask";
    quantity: number;
    price: number;
    orderType: "limit" | "market";
    orderInVolume: boolean;
  }>({
    side: "bid",
    quantity: 10,
    price: 10,
    orderType: "limit",
    orderInVolume: true,
  });

  const [postPlace, setPostPlace] = useState({
    fills: 0,
  });

  const onSubmit = async () => {
    const order: Omit<TIncomingOrder, "userId"> = {
      side: formBody.side,
      market: market,
      price: formBody.price,
      quantity: formBody.quantity,
    };

    // return;
    // if (formBody.orderInVolume) order.quantity = formBody.quantity;
    // else order.price = formBody.price;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/limitorder`, {
        method: "POST",
        body: JSON.stringify(order),
        headers: {
          "Content-type": "application/json",
          // @ts-ignore
          authorization: `Bearer ${data.jwtToken!}`,
        },
      });
      setPostPlace((await res.json()).payload.filledQty);
      setTimeout(() => {
        setPostPlace({ fills: 0 });
      });
      await getAndSetBalance();
    } catch (err) {
      console.log("er");
    }
  };

  return (
    <div className="self-stretch">
      <Flex className="border-b-2 border-gray-800 text-lg">
        <button
          onClick={() => setFormBody((p) => ({ ...p, side: "bid" }))}
          className={`transition flex-1 py-4 text-green-500 border-b-2 border-b-transparent ${
            formBody.side == "bid"
              ? "  border-b-green-800"
              : "hover:border-b-white"
          } `}
        >
          Buy
        </button>
        <button
          className={`transition flex-1 py-4 text-pink-300   border-b-2 border-b-transparent ${
            formBody.side == "ask"
              ? "border-b-pink-800"
              : "hover:border-b-white"
          }`}
          onClick={() => setFormBody((p) => ({ ...p, side: "ask" }))}
        >
          Sell
        </button>
      </Flex>

      <div className="p-2">
        <Flex className="gap-4 ">
          <button
            onClick={() => setFormBody((p) => ({ ...p, orderType: "limit" }))}
            className={`py-[1px] px-2 border-b-2 border-b-transparent  text-gray-400 transition ${
              formBody.orderType == "limit"
                ? "border-b-gray-400 text-white"
                : "hover:border-b-gray-300"
            }`}
          >
            Limit
          </button>
          <button
            onClick={() => setFormBody((p) => ({ ...p, orderType: "market" }))}
            className={`py-[1px] px-2 border-b-2 border-b-transparent  text-gray-400 transition ${
              formBody.orderType == "market"
                ? "border-b-gray-400 text-white"
                : "hover:border-b-gray-300"
            }`}
          >
            Market
          </button>
        </Flex>

        <Flex className="p-2 pb-0 pt-4 text-sm text-gray-500" justify="between">
          <p>Available Balance</p>
          <p className="text-gray-200">{myBalance}</p>
        </Flex>
        {formBody.orderType == "market" && (
          <button
            className="p-2 pt-3 pb-0 text-sm text-gray-500 flex justify-between items-center gap-1 select-none"
            onClick={() =>
              setFormBody((p) => ({ ...p, orderInVolume: !p.orderInVolume }))
            }
          >
            <p>{!formBody.orderInVolume ? "Order Value" : "Volume"}</p>

            <SwapSvgIcon />
          </button>
        )}

        <div className="px-2 mt-2 flex flex-col gap-2">
          {formBody.orderType == "market" ? null : (
            <>
              <Text size="2" color="gray">
                Price
              </Text>
              <TextField.Root
                size="3"
                type="number"
                className="text-right"
                value={formBody.price}
                name="price"
                onChange={(e: any) => {
                  setFormBody((p) => ({ ...p, price: Number(e.target.value) }));
                }}
              />
              <Text size="2" color="gray">
                Quantity
              </Text>
              <TextField.Root
                size="3"
                type="number"
                name="quantity"
                className="text-right"
                value={formBody.quantity}
                onChange={(e: any) => {
                  setFormBody((p) => ({
                    ...p,
                    quantity: Number(e.target.value),
                  }));
                }}
              />
            </>
          )}
          <Button
            color="gray"
            variant="solid"
            highContrast
            radius="full"
            disabled={
              status == "authenticated" &&
              formBody.price == 0 &&
              formBody.quantity == 0
            }
            onClick={() => {
              if (status == "authenticated") onSubmit();
              else redirect("/signin?redirectTo=" + pathname);
            }}
          >
            {status == "authenticated" ? `Save` : "Signin"}
          </Button>
          {postPlace.fills && true ? (
            <Text className="bg-green-600 p-4 rounded-md">postPlace.fills</Text>
          ) : null}
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

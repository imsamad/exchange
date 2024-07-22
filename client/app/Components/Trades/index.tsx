import { Heading, Table } from "@radix-ui/themes";
import React, { useEffect, useState } from "react";
import { WsManager } from "../../lib/WsManager";
import { checkboxGroupRootPropDefs } from "@radix-ui/themes/props";

const now = new Date();

const getTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;

  // const tradeDate = new Date(timestamp);
  // const diffMs = now - tradeDate; // Difference in milliseconds
  // const diffSec = Math.floor(diffMs / 1000); // Difference in seconds
  // const diffMin = Math.floor(diffSec / 60); // Difference in minutes
  // const diffHour = Math.floor(diffMin / 60); // Difference in hours

  // return {
  //   tradeId: trade.tradeId,
  //   secondsAgo: diffSec,
  //   minutesAgo: diffMin,
  //   hoursAgo: diffHour
  // };
};

const TradesTab = ({ market }: { market: string }) => {
  const [trades, setTrades] = useState<
    {
      tradeId: number;
      price: number;
      quantity: number;
      time: number;
    }[]
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/trades/${market}`
        );
        const data = await res.json();
        setTrades(data);
      } catch (error) {}
    })();
  }, [market]);

  useEffect(() => {
    WsManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`trade@${market}`],
    });

    WsManager.getInstance().registerCallback(
      "trade",
      (data: any) => {
        setTrades((p) => [...p, data]);
      },
      `TRADE-${market}`
    );

    return () => {
      WsManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`trade@${market}`.toLowerCase()],
      });

      WsManager.getInstance().deRegisterCallback("trade", `TRADE-${market}`);
    };
  }, [market]);
  return (
    <Table.Root size="3" variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell align="center" colSpan={3}>
            <Heading>Trade Tab</Heading>
          </Table.ColumnHeaderCell>
        </Table.Row>

        <Table.Row>
          <Table.ColumnHeaderCell align="center">Price</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">
            Quantity
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Time</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {!trades.length
          ? null
          : trades
              .sort((a, b) => b.tradeId - a.tradeId)
              .map(({ tradeId, price, quantity, timestamp }: any) => (
                <Table.Row key={tradeId} className="bg-blue-600">
                  <Table.Cell align="center">{price}</Table.Cell>
                  <Table.Cell align="center">{quantity}</Table.Cell>
                  <Table.Cell align="center">{getTime(timestamp)}</Table.Cell>
                </Table.Row>
              ))}
      </Table.Body>
    </Table.Root>
  );
};

export default TradesTab;

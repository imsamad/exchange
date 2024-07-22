import { WsManager } from "../../lib/WsManager";
import { Heading, Table } from "@radix-ui/themes";
import React, { useEffect, useState } from "react";

const DepthTab = ({ market }: { market: string }) => {
  const [orderbooks, setOrderbooks] = useState<any>({
    asks: [],
    bids: [],
    currentPrice: 0,
  });
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/depth/${market}`
        );
        const data = await res.json();
        setOrderbooks(data);
      } catch (error) {}
    })();
  }, [market]);

  useEffect(() => {
    WsManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`depth@${market}`],
    });

    WsManager.getInstance().registerCallback(
      "depth",
      (data: any) => {
        setOrderbooks((p: any) => ({
          bids: [...data.bids.sort((a: any, b: any) => b[0] - a[0])],
          asks: [...data.asks.sort((a: any, b: any) => b[0] - a[0])],
          currentPrice: data.currentPrice,
        }));
      },
      `DEPTH-${market}`
    );

    return () => {
      WsManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth@${market}`.toLowerCase()],
      });
      WsManager.getInstance().deRegisterCallback("depth", `DEPTH-${market}`);
    };
  }, [market]);

  return (
    <Table.Root size="3" variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell align="center" colSpan={2}>
            <Heading>Dapth Tab</Heading>
          </Table.ColumnHeaderCell>
        </Table.Row>
        <Table.Row>
          <Table.ColumnHeaderCell align="center">Price</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">
            Quantity
          </Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {/* <Table.Row className="bg-red-800">
          <Table.Cell colSpan={2} align="center">
            Asks
          </Table.Cell>
        </Table.Row> */}
        {orderbooks.asks.map((ask: any) => (
          <Table.Row key={ask[0] + Math.random()} className="bg-red-900">
            <Table.Cell align="center">{ask[0]}</Table.Cell>
            <Table.Cell align="center">{ask[1]}</Table.Cell>
          </Table.Row>
        ))}

        <Table.Row>
          <Table.Cell colSpan={2} align="center">
            {orderbooks.currentPrice}
          </Table.Cell>
        </Table.Row>

        {orderbooks.bids.map((bid: any) => (
          <Table.Row key={bid[0] + Math.random()} className="bg-green-900">
            <Table.Cell align="center">{bid[0]}</Table.Cell>
            <Table.Cell align="center">{bid[1]}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default DepthTab;

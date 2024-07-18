import { Heading, Table } from "@radix-ui/themes";
import Navbar from "./Components/Navbar";

import Link from "next/link";

const HomePage = async () => {
  const res = await fetch(`${process.env.API_URL}/markets`);
  const data = await res.json();

  return (
    <>
      <Navbar />
      <div className="p-12">
        <Heading>Markets</Heading>
        <hr className="my-2" />
        <Table.Root size="3">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Symbol</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {data.markets.map((market: any) => {
              const link = `/trades/${market.base_asset.toUpperCase()}_${market.quote_asset.toUpperCase()}`;
              return (
                <Table.Row key={market.base_asset}>
                  <Table.RowHeaderCell>
                    <Link href={link}>{market.base_asset.toUpperCase()} </Link>
                  </Table.RowHeaderCell>

                  <Table.Cell>
                    <Link href={link} className="block">
                      {`${market.base_asset.toUpperCase()} ${market.quote_asset.toUpperCase()}`}{" "}
                    </Link>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </div>
    </>
  );
};

export default HomePage;

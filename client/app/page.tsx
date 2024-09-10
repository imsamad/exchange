'use client';
import { Heading, Table } from '@radix-ui/themes';
import Navbar from './Components/Navbar';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const HomePage = () => {
  const [markets, setMarkets] = useState<any>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/markets`);
        const data = await res.json();
        setMarkets(data.markets);
      } catch (error) {}
    })();
  }, []);

  return (
    <>
      <Navbar />
      <div className='p-12'>
        <Heading>Markets</Heading>
        <hr className='my-2' />
        <Table.Root size='3'>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Symbol</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {markets.map((market: any) => {
              const link = `/trades/${market.base_asset.toLowerCase()}_${market.quote_asset.toLowerCase()}`;
              return (
                <Table.Row key={market.base_asset}>
                  <Table.RowHeaderCell>
                    <Link href={link}>{market.base_asset.toLowerCase()} </Link>
                  </Table.RowHeaderCell>

                  <Table.Cell>
                    <Link href={link} className='block'>
                      {`${market.base_asset.toLowerCase()} ${market.quote_asset.toLowerCase()}`}{' '}
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

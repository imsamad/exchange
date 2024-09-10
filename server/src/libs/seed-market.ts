require('dotenv').config();

import { Client } from 'pg';
import { createTables } from './createTable';
import { RedisManager } from './RedisManager';
import { migrateUserAndBalance } from './migrate';

/**
 * 1. Migrate users table, balances table
 * 2. markets table and related market_trade table
 * 3. add balances for all market
 */

RedisManager.getInstance();

const pgClient = new Client(process.env.DATABASE_URL);

pgClient
  .connect()
  .then(async () => {
    await migrateUserAndBalance(pgClient);

    let promised: any = [];
    for (
      let i = 0;
      i < Math.min(base_assets.length, Math.min(10, quote_assets.length));
      i++
    ) {
      promised.push(
        new Promise(async (resolve, reject) => {
          try {
            await createTables(pgClient, base_assets[i], quote_assets[i]);

            const res = await RedisManager.getInstance().sendAndWait({
              type: 'ADD_ORDERBOOK',
              payload: {
                baseAsset: base_assets[i],
                quoteAsset: quote_assets[i],
              },
            });
            console.log('rees: ', res);
            resolve(true);
          } catch (error) {
            console.log(error);
            reject(false);
          }
        })
      );
    }

    await Promise.allSettled(promised)
      .then((res) => {
        console.log('res: ', res);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        console.log('migrated and seeded!');
        process.exit();
      });
  })
  .catch((err) => {
    console.log('err: ', err);
  })
  .finally(() => {
    console.log('finally from outer branch');
    process.exit();
  });

export const quote_assets = [
  'USDT',
  'USDC',
  'EUR',
  'JPY',
  'GBP',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'KRW',
  'INR',
  'BRL',
  'RUB',
  'MXN',
  'ZAR',
  'SGD',
  'HKD',
  'NZD',
  'NOK',
  'SEK',
  'DKK',
  'PLN',
  'TRY',
  'AED',
  'SAR',
  'TWD',
  'THB',
  'IDR',
  'VND',
  'MYR',
  'PHP',
  'CZK',
  'HUF',
  'RON',
  'BGN',
  'HRK',
  'ISK',
  'UAH',
  'GEL',
  'KZT',
  'AMD',
  'AZN',
  'BYN',
  'KGS',
  'MDL',
  'MKD',
  'RSD',
  'ALL',
  'BAM',
  'JOD',
  'ILS',
  'EGP',
  'LBP',
  'MAD',
  'DZD',
  'TND',
  'LYD',
  'SYP',
  'IQD',
  'YER',
  'OMR',
  'QAR',
  'BHD',
  'KWD',
  'MZN',
  'ANG',
  'AWG',
  'BBD',
  'BSD',
  'BZD',
  'BTN',
  'CLP',
  'COP',
  'CRC',
  'CUP',
  'DOP',
  'EEK',
  'FJD',
  'GYD',
  'HTG',
  'JMD',
  'KPW',
  'LAK',
  'LRD',
  'MNT',
  'NAD',
  'NGN',
  'PAB',
  'PEN',
  'PGK',
  'PYG',
  'SBD',
  'SLL',
  'SRD',
  'SZL',
  'TOP',
  'TTD',
  'UZS',
  'WST',
  'XOF',
];
export const base_assets = [
  'BTC',
  'ETH',
  'XRP',
  'LTC',
  'BCH',
  'EOS',
  'XLM',
  'ADA',
  'TRX',
  'DASH',
  'XMR',
  'MIOTA',
  'NEO',
  'ETC',
  'XEM',
  'ZEC',
  'QTUM',
  'LSK',
  'OMG',
  'BTG',
  'DCR',
  'VET',
  'MKR',
  'ZRX',
  'DOGE',
  'BAT',
  'ICX',
  'REP',
  'GNT',
  'SNT',
  'BNT',
  'KNC',
  'CVC',
  'REN',
  'LRC',
  'SNX',
  'ANT',
  'QSP',
  'STORJ',
  'MANA',
  'MTL',
  'FUN',
  'RLC',
  'POWR',
  'DNT',
  'STMX',
  'KAVA',
  'BAND',
  'BAL',
  'COMP',
  'CRV',
  'YFI',
  'SRM',
  'FTT',
  'UNI',
  'AAVE',
  'ALGO',
  'FIL',
  'GRT',
  'RUNE',
  'AVAX',
  'SUSHI',
  'SOL',
  'CAKE',
  'LUNA',
  'FTM',
  'MATIC',
  'HNT',
  'KSM',
  'MINA',
  'RAY',
  'AUDIO',
  'SAND',
  'CHZ',
  'ENS',
  'AXS',
  'DYDX',
  'GALA',
  'RGT',
  'IMX',
  'ILV',
  'YGG',
  'FLOW',
  'CELO',
  'AR',
  'ROSE',
  'MOVR',
  'GNO',
  'SUPER',
  'RARI',
  'UOS',
  'LPT',
  'MPL',
  'KP3R',
  'OGN',
  'UMA',
  'TRB',
  'POLY',
  'FET',
  'CTK',
];

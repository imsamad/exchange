'use server';

import { hello } from 'utils';

export const what = async (params: any) => {
  return hello(JSON.stringify(params));
};

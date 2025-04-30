import type { App } from './index'
import { hc } from 'hono/client'

// this is a trick to calculate the type when compiling
const honoClient = hc<App>('');
export type Client = typeof honoClient;

export const client = (...args: Parameters<typeof hc>): Client =>
  hc<App>(...args);

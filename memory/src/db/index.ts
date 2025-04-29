import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/chats';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL!,
});

pool.connect();

const db = drizzle(pool, { schema });

export default db;

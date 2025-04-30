import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as chatsSchema from './schema/chats';
import * as postsSchema from './schema/posts';
import * as memorySchema from './schema/memory';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL!,
});

pool.connect();

const db = drizzle(pool, { schema: {
  ...chatsSchema,
  ...postsSchema,
  ...memorySchema,
} });

export default db;

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (!_db) {
    const client = postgres(process.env.DATABASE_URL!, { prepare: false })
    _db = drizzle(client, { schema })
  }
  return _db
}

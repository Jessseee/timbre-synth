import { drizzle as drizzleLibSQL, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle as drizzleD1, type DrizzleD1Database } from 'drizzle-orm/d1';
import { createClient } from '@libsql/client';
import * as schema from './schema';


export function createLibSqlClient(url: string): LibSQLDatabase<typeof schema> {
	const client = createClient({ url });
	return drizzleLibSQL(client, { schema });
}

export function createD1Client(database: D1Database): DrizzleD1Database<typeof schema> {
	return drizzleD1(database, { schema });
}

export type DrizzleClient =
	| ReturnType<typeof createLibSqlClient>
	| ReturnType<typeof createD1Client>;

export const table = schema;

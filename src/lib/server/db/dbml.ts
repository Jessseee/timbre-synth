import * as schema from './schema';
import { sqliteGenerate } from 'drizzle-dbml-generator';

const out = './schema.dbml';
const relational = true;

sqliteGenerate({ schema, out, relational });

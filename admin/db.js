import pg from 'pg';
import { PG_LINK } from './config.js';

const { Pool } = pg;

const pool = new Pool({ connectionString: PG_LINK });

export default pool;

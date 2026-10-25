import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

// pg treats sslmode=require as verify-full today and warns about it; say so explicitly
export const pool = new pg.Pool({
  connectionString: url.replace(/sslmode=(require|prefer|verify-ca)\b/, 'sslmode=verify-full'),
  max: 5,
  idleTimeoutMillis: 10_000,
});

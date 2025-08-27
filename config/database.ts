import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'firewall_db',
  password: '123456', // הסיסמה שלך
  port: 5432,
});

export default pool;
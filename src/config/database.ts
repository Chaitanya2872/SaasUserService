import { Pool } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Required by Render
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'user_service_db',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(dbConfig);

// Test the connection
pool.on('connect', () => {
  logger.info('Database connection established', {
    db: {
      host: (dbConfig as any).host || 'via connection string',
      port: (dbConfig as any).port || 'default',
      database: (dbConfig as any).database || 'from connection string',
      user: (dbConfig as any).user || 'from connection string',
    },
  });
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Validate connection
const validateConnection = async () => {
  try {
    const client = await pool.connect();
    client.release();
    logger.info('Database connection validated successfully');
  } catch (err) {
    logger.error('Error connecting to the database:', err);
    throw err;
  }
};

validateConnection();

export default pool;

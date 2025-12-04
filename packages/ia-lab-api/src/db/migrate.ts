import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../..', '.env') });

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const connectionString = process.env.DATABASE_URL ||
    'postgresql://ialab:ialab_password@localhost:5432/ialab';

  const client = new pg.Client({ connectionString });

  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Running migrations...');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

    await client.query(schema);

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();

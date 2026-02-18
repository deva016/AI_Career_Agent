import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listAccounts() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Listing all accounts in database...\n');
    
    // Join users and accounts
    const result = await pool.query(`
      SELECT u.email as user_email, a.provider, a."providerAccountId"
      FROM users u
      JOIN accounts a ON u.id = a."userId"
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No accounts found!');
    } else {
      console.log(`✅ Found ${result.rows.length} linked accounts:`);
      result.rows.forEach(acc => {
        console.log(`- User: ${acc.user_email} | Provider: ${acc.provider} | ID: ${acc.providerAccountId}`);
      });
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

listAccounts();

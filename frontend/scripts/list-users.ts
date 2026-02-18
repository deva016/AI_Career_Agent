import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Listing all users in database...\n');
    
    // Query without createdAt/updatedAt
    const result = await pool.query(`
      SELECT id, name, email 
      FROM users;
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No users found!');
    } else {
      console.log(`✅ Found ${result.rows.length} users:`);
      result.rows.forEach(u => {
        console.log(`- [${u.id}] ${u.name} (${u.email})`);
      });
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

listUsers();

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking users table schema...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Users table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}${row.column_default ? ` (default: ${row.column_default})` : ''} ${row.is_nullable === 'NO' ? '[NOT NULL]' : ''}`);
    });
    
    console.log('\n🔍 Checking if we can insert user...\n');
    
    // Test insert
    const testInsert = await pool.query(`
      INSERT INTO users (name, email, image)
      VALUES ('Test User', 'test@example.com', 'https://example.com/image.jpg')
      RETURNING *;
    `);
    
    console.log('✅ Test user created:', testInsert.rows[0]);
    
    // Clean up
    await pool.query(`DELETE FROM users WHERE email = 'test@example.com'`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Connecting to Neon database...');
    
    // Read the migration SQL file
    const migrationSQL = readFileSync(
      join(process.cwd(), '..', 'migrations', 'exact_nextauth_schema.sql'),
      'utf-8'
    );

    console.log('📝 Running migration: fix_users_id.sql');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('\nCreated tables:');
    console.log('  - accounts (OAuth providers)');
    console.log('  - sessions (active sessions)');
    console.log('  - verification_tokens (email verification)');
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('accounts', 'sessions', 'verification_tokens')
      ORDER BY table_name;
    `);
    
    console.log('\n✅ Verified tables in database:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

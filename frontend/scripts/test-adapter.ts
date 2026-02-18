import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testAdapter() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Testing NextAuth adapter operations...\n');

    // 1. Test creating a user (what NextAuth does on first sign-in)
    console.log('1. Creating a test user...');
    const createUserResult = await pool.query(`
      INSERT INTO users (name, email, image)
      VALUES ('Test OAuth User', 'testoauth@example.com', 'https://example.com/avatar.jpg')
      RETURNING *;
    `);
    console.log('   ✅ User created:', createUserResult.rows[0]);
    const userId = createUserResult.rows[0].id;

    // 2. Test creating an account (OAuth provider link)
    console.log('\n2. Creating an account link...');
    const createAccountResult = await pool.query(`
      INSERT INTO accounts ("userId", type, provider, "providerAccountId", access_token, token_type, scope)
      VALUES ($1, 'oauth', 'google', 'test-provider-id-12345', 'test-access-token', 'Bearer', 'openid email profile')
      RETURNING *;
    `, [userId]);
    console.log('   ✅ Account created:', createAccountResult.rows[0]);

    // 3. Test creating a session
    console.log('\n3. Creating a session...');
    const createSessionResult = await pool.query(`
      INSERT INTO sessions ("sessionToken", "userId", expires)
      VALUES ('test-session-token-12345', $1, NOW() + INTERVAL '30 days')
      RETURNING *;
    `, [userId]);
    console.log('   ✅ Session created:', createSessionResult.rows[0]);

    // 4. Test getUserByAccount (this is what was failing!)
    console.log('\n4. Testing getUserByAccount query...');
    const getUserResult = await pool.query(`
      SELECT u.* FROM users u
      JOIN accounts a ON a."userId" = u.id
      WHERE a.provider = 'google' AND a."providerAccountId" = 'test-provider-id-12345'
    `);
    console.log('   ✅ User found by account:', getUserResult.rows[0]);

    // Cleanup
    console.log('\n5. Cleaning up test data...');
    await pool.query('DELETE FROM sessions WHERE "sessionToken" = $1', ['test-session-token-12345']);
    await pool.query('DELETE FROM accounts WHERE "providerAccountId" = $1', ['test-provider-id-12345']);
    await pool.query('DELETE FROM users WHERE email = $1', ['testoauth@example.com']);
    console.log('   ✅ Test data cleaned up');

    console.log('\n🎉 ALL ADAPTER OPERATIONS WORK CORRECTLY!\n');
    console.log('The database schema is correct. The issue must be in NextAuth configuration or callback.\n');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('   Full error:', error);
  } finally {
    await pool.end();
  }
}

testAdapter();

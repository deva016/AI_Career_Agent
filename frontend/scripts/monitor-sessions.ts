import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';

dotenv.config({ path: '.env.local' });

async function monitorSessions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log('👀 Monitoring active sessions (Ctrl+C to stop)...\n');

  try {
    while (true) {
      const result = await pool.query(`
        SELECT s.id, u.email, s.expires
        FROM sessions s
        JOIN users u ON s."userId" = u.id
        ORDER BY s.expires DESC
      `);

      console.clear();
      console.log('--- Active Sessions --- ' + new Date().toLocaleTimeString());
      if (result.rows.length === 0) {
        console.log('❌ NO ACTIVE SESSIONS');
      } else {
        result.rows.forEach(s => {
          console.log(`User: ${s.email.padEnd(30)} | Expires: ${s.expires.toLocaleTimeString()}`);
        });
      }
      
      await setTimeout(2000); // Check every 2 seconds
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

monitorSessions();

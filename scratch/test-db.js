// scratch/test-db.js
// Run this to test your database connection: node scratch/test-db.js
import pool from '../lib/mysql.js';

async function testConnection() {
  console.log('🔍 Testing database connection...');
  try {
    const [rows] = await pool.execute('SELECT 1 + 1 AS solution');
    console.log('✅ Connection successful! Solution:', rows[0].solution);
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:');
    console.error(err.message);
    process.exit(1);
  }
}

testConnection();

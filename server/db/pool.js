const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ashutoshrai@localhost:5432/sprintos_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
})

pool.on('error', (err) => {
  console.error('[SprintOS DB] Unexpected error on idle client:', err)
})

async function checkDatabaseConnection() {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW() as current_time, current_database() as db_name')
    client.release()
    return {
      connected: true,
      database: result.rows[0].db_name,
      serverTime: result.rows[0].current_time
    }
  } catch (err) {
    return {
      connected: false,
      error: err.message
    }
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  checkDatabaseConnection
}

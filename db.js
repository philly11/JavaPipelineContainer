// db.js
// Handles the SQL Server connection pool used by server.js to store and
// verify user accounts.
require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'JavaPipelineDB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  options: {
    // Set DB_ENCRYPT=true when connecting to Azure SQL or any server that
    // requires an encrypted connection.
    encrypt: process.env.DB_ENCRYPT === 'true',
    // Set to 'false' only when using a trusted/valid certificate (e.g. Azure SQL).
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
  },
};

let poolPromise = null;

/**
 * Returns a shared, lazily-created connection pool.
 * Reuses the same pool across requests instead of opening a new
 * connection every time.
 */
function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        console.log(`Connected to SQL Server database "${config.database}"`);
        return pool;
      })
      .catch((err) => {
        // Allow a future request to retry the connection instead of
        // permanently caching a rejected promise.
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

module.exports = { sql, getPool };

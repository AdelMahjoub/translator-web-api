const mysql = require('mysql');

const dbConnectionPool = mysql.createPool({
  charset: 'utf8',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  user: process.env.DB_USER
});

module.exports = dbConnectionPool;
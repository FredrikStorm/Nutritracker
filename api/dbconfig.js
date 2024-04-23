require('dotenv').config({ path: './DBnutri.env' });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: false // For produksjonsmiljøer bør dette være false
  }
};

module.exports = config;
console.log('Database server:', process.env.DB_SERVER);
console.log('Database name:', process.env.DB_DATABASE);
console.log('Database user:', process.env.DB_USER);
console.log('Database password:', process.env.DB_PASSWORD);
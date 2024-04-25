const sql = require('mssql');
const dbConfig = require('./dbconfig');

async function connect() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to the Azure SQL database.');
    } catch (err) {
        console.error('Failed to connect to the database:', err);
        process.exit(1); // Avslutter programmet ved feil
    }
}

module.exports = { connect, sql };

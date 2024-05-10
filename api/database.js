const sql = require('mssql');
const dbConfig = {
    user: 'Niklas@nutritionserver',
    password: 'Sykkeldelisk0355',
    server: 'nutritionserver.database.windows.net', // f.eks., 'yourserver.database.windows.net'
    database: 'nutritionDB',
    options: {
        encrypt: true, // For Azure SQL
        enableArithAbort: true
    }
};

async function getDbConnection() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log("Connected to SQL database successfully.");
        return pool; // This pool will be used to run queries
    } catch (err) {
        console.error('Failed to connect to the database:', err);
        throw err; // Rethrow the error for caller to handle
    }
}

module.exports = { getDbConnection};












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

async function getIngredients(searchString) {
    try {
        await sql.connect(dbConfig); // Sørger for at det refererer til riktig konfigurasjon
        const result = await sql.query`SELECT FoodName FROM foodbank.food WHERE FoodName LIKE '%' + ${searchString} + '%'`;
        return result.recordset;
    } catch (err) {
        console.error('Database connection error:', err);
        return [];
    }
}

// Kombiner alle eksporter i en enkelt module.exports
module.exports = { connect, getIngredients };

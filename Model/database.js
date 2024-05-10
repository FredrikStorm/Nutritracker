const sql = require('mssql'); // Importerer 'mssql'-modulet for at kunne arbejde med Microsoft SQL Server

// Definerer konfigurationsobjektet for databaseforbindelsen
const dbConfig = {
    user: 'Niklas@nutritionserver', 
    password: 'Sykkeldelisk0355', 
    server: 'nutritionserver.database.windows.net', 
    database: 'nutritionDB', 
    options: {
        encrypt: true, 
        enableArithAbort: true 
    }
};

// Asynkron funktion for at oprette forbindelse til databasen
async function getDbConnection() {
    try {
        const pool = await sql.connect(dbConfig); // Forsøger at oprette forbindelse til databasen
        console.log("Connected to SQL database successfully."); 
        return pool; // Returnerer en forbindelsespool, der kan bruges til at udføre forespørgsler
    } catch (err) {
        console.error('Failed to connect to the database:', err); // Logger fejl ved mislykket forbindelse
        throw err; 
    }
}

module.exports = { getDbConnection}; // Eksporterer funktionen, så den kan bruges andre steder i applikationen












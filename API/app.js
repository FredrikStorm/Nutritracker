// Importer nødvendige moduler
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Importer SQL og databasekonfigurasjon
const sql = require('mssql');
const dbConfig = require('./dbconfig');

// Bruk JSON middleware for å parse JSON-bodies
app.use(express.json());

// Databaseforbindelsesfunksjon
async function connectToDatabase() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to the Azure SQL database.');
    } catch (err) {
        console.error('Failed to connect to the database:', err);
        process.exit(1); // Avslutter programmet ved kritisk feil
    }
}

// Koble til databasen ved oppstart
connectToDatabase();

app.get('/', async (req, res) => {
    try {
        // Oppdatert for å hente alle data fra 'Address' tabellen i 'User' skjemaet
        const result = await sql.query('SELECT * FROM [User].Address');
        if (result.recordset.length > 0) {
            res.json(result.recordset);
        } else {
            res.send('No address data found.');
        }
    } catch (err) {
        res.status(500).send('Error while fetching data: ' + err.message);
    }
});

// Start serveren og lytt på angitt port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Importer nødvendige moduler
const express = require('express');
const app = express();
const port = process.env.PORT || 3100;

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

// Definer en GET-rute for å håndtere søk av ingredienser
app.get('/api/user/activityTable', async (req, res) => {
    const searchString = req.query.search || '';
    try {
        const ingredients = await getIngredients(searchString);
        res.json(ingredients);
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).send('Error fetching ingredients');
    }
});
// Start serveren og lytt på angitt port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

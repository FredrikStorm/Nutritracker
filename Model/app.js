const express = require('express');
const cors = require('cors');

const app = express(); // Opretter en ny Express-applikation
const port = process.env.PORT || 3000; // Definerer porten, applikationen skal køre på

// Konfigurerer CORS (Cross-Origin Resource Sharing) indstillinger
const corsOptions = { 
    origin: '*', // Tillader forespørgsler fra alle domæner
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Tillader disse HTTP-metoder
    allowedHeaders: ['Content-Type', 'Authorization'] 
};

app.use(cors(corsOptions)); // Anvender CORS-middleware med de specificerede indstillinger

const userRoutes = require('../routes/user.js'); // Importerer brugerruter fra vores routers

app.use(express.json()); // Middleware til at parse JSON-formaterede forespørgsler
app.use(express.urlencoded({ extended: true })); // Middleware til at parse URL-encoded bodies (vigtigt for POST og PUT requests)

app.use('/api', userRoutes); // Brugerruter under '/api' sti

// Start serveren
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


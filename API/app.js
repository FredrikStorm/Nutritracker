const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = { 
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

const userRoutes = require('./routes/user.js');

//app.use(cors());
app.use(express.json());
// For å parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use('/api', userRoutes);

app.use(express.json()); // Middleware to parse JSON bodies

// Start serveren og lytt på angitt port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


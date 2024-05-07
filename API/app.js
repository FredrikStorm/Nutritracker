const session = require('express-session');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { getIngredients, getNutritionalInfo, saveRecipe, getRecipes, getRecipeNutrition, saveMeal, getMealsByUserId, updateMeal } = require('./database'); // Oppdatert for å inkludere de nye funksjonene
const app = express();
const port = process.env.PORT || 3000;


const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

const sql = require('mssql');
const dbConfig = require('./dbconfig');


//app.use(cors());
app.use(express.json());
// For å parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));



//nytt fra niklas: 


//session gjør så brukeren kan forbli innlogget
app.use(session({
    secret: 'UserID',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));



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


// Post User 
app.post('/api/user/profile/save_user/', async (req, res) => {
    let sqlRequest = new sql.Request();
    let sqlQuery = `INSERT INTO [user].profile (firstname, lastname, weight, age, gender, email, password)
                    OUTPUT inserted.userID 
                    VALUES ( @firstname, @lastname, @weight, @age, @gender, @email, @password)`;


    sqlRequest.input('firstname', sql.VarChar, req.body.firstname);
    sqlRequest.input('lastname', sql.VarChar, req.body.lastname);
    sqlRequest.input('weight', sql.Int, req.body.weight);
    sqlRequest.input('age', sql.Int, req.body.age);
    sqlRequest.input('gender', sql.VarChar, req.body.gender);
    sqlRequest.input('email', sql.VarChar, req.body.email);
    sqlRequest.input('password', sql.VarChar, req.body.password);

    try {
        const result = await sqlRequest.query(sqlQuery);
        const userID = result.recordset[0].userID;
        //userID lagres i Session
        req.session.userID = userID;

        if(req.session.userID){
            res.status(201).json({ userID });
        }
        
    } catch (err) {
        console.log(err);
        res.status(500).send('Error while inserting data: ' + err.message);
    }
});


// GET-rute for profildata
app.get('/api/user/profile/', async (req, res) => {
    let sqlRequest = new sql.Request();
    let sqlQuery = `SELECT * FROM [user].profile WHERE email = @email;`;

    // Her bruker vi en query-parameter fra URLen
    const userEmail = req.query.email;

    sqlRequest.input('email', sql.VarChar, userEmail);

    try {
        const result = await sqlRequest.query(sqlQuery);

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.log(err);
        res.status(500).send('Error while retrieving data: ' + err.message);
    }
});




// gammel kode: 

// Definer en GET-rute for å håndtere søk av ingredienser
app.get('/api/foodbank/food', async (req, res) => {
    const searchString = req.query.search || '';
    try {
        const ingredients = await getIngredients(searchString);
        res.json(ingredients);
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).send('Error fetching ingredients');
    }
});

// Ny rute for å hente ernæringsinformasjon basert på FoodID og ParameterID
app.get('/api/foodbank/foodParameter', async (req, res) => {
    const { foodID, parameterID } = req.query;
    console.log("Received foodID from client:", foodID);
    console.log("Received parameterID from client:", parameterID);
    try {
        const nutrition = await getNutritionalInfo(foodID, parameterID);
        res.json(nutrition);
    } catch (error) {
        console.error('Error fetching nutritional information:', error);
        res.status(500).send('Error fetching nutritional information');
    }
});


app.post('/api/user/recipe', async (req, res) => {
    const { recipeName, userID, protein, kcal, fat, fiber } = req.body;

    if (!recipeName || typeof recipeName !== 'string' || recipeName.trim() === '') {
        return res.status(400).json({ error: 'Invalid recipe name' });
    }
    if (isNaN(userID) || userID <= 0) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (isNaN(protein) || isNaN(kcal) || isNaN(fat) || isNaN(fiber) || protein < 0 || kcal < 0 || fat < 0 || fiber < 0) {
        return res.status(400).json({ error: 'Invalid nutritional values' });
    }

    try {
        const recipe = await saveRecipe(req.body); // Antar at denne funksjonen håndterer all logikk for lagring
        res.status(201).json(recipe);
    } catch (error) {
        console.error('Error saving recipe:', error);
        res.status(500).send('Server error');
    }
});


app.get('/api/user/recipe', async (req, res) => {
    const { userID } = req.query;
    try {
        const recipes = await getRecipes(userID);
        res.json(recipes);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).send('Error fetching recipes');
    }
});




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





//kode for TRACKER -----------------------------------------------------------------


// Importer funksjonen om den finnes i database.js
//const { getRecipeNutrition } = require('./database');

app.get('/api/user/recipe/:recipeId', async (req, res) => {
    const recipeId = req.params.recipeId;
    try {
        const nutrition = await getRecipeNutrition(recipeId);
        res.json(nutrition);
    } catch (error) {
        console.error('Error fetching recipe nutrition:', error);
        res.status(500).send('Error fetching recipe nutrition');
    }
});


app.post('/api/user/meal', async (req, res) => {
    const { date, time, location, weight, userID, recipeID } = req.body;
    try {
        let result = await saveMeal(date, time, location, weight, userID, recipeID);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error saving meal:', error);
        res.status(500).send('Error saving meal');
    }
});

app.get('/api/user/meal', async (req, res) => {
    const { userID } = req.query;  // Anta at du sender userID som en query parameter

    try {
        const meals = await getMealsByUserId(userID);
        res.json(meals);
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).send('Error fetching meals');
    }
});

/*
app.post('/api/user/meal/update', async (req, res) => {
    try {
        const result = await updateMeal(req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating meal:', error);
        res.status(500).send('Error updating meal');
    }
});

*/

app.put('/api/user/meal/:mealId', async (req, res) => {
    const { mealId, date, time, location, weight, kcal, protein, fat, fiber } = req.body;
    try {
        const result = await updateMeal(mealId, date, time, location, weight, kcal, protein, fat, fiber);
        res.status(200).json({ message: "Meal updated successfully", result });
    } catch (error) {
        console.error('Error updating meal:', error);
        res.status(500).send('Error updating meal');
    }
});


// Start serveren og lytt på angitt port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});



const express = require('express');
const cors = require('cors');
const session = require('express-session');

const { createActivity, getActivity, getProfile, createMetabolism, seeEnergi } = require('./controllers/user.js')
const { getIngredients, getNutritionalInfo, saveRecipe, getRecipes, getRecipeNutrition, saveMeal, getMealsByUserId, deleteMeal, updateMealWeight, getUserInfo, changeUserInfo,deleteUser, logWater } = require('./database'); // Oppdatert for å inkludere de nye funksjonene
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


app.get('/api/user/Activitytable/:activityid', getActivity);

app.post('/api/user/Activities', createActivity);

//Stofskifte beregner
app.get('/api/user/profile/:userId', getProfile);

app.post('/api/user/metabolism', createMetabolism);

//Dailynutri energi
app.get('/api/user/meals/:userId', seeEnergi);


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
        const userID = result.recordset[0];
        //req.session.userID = userID; // Lagre userID i session
        //console.log("Session UserID:", req.session.userID);
        
        res.status(201).json({ userID });

        
    } catch (err) {
        console.log(err);
        res.status(500).send('Error while inserting data: ' + err.message);
    }
});


// GET-rute for henting av profildata
app.get('/api/user/profile', async (req, res) => {
    let sqlRequest = new sql.Request();
    let sqlQuery = `SELECT * FROM [user].profile WHERE email = @email;`;

    // Her bruker vi en query-parameter fra URLen
    const userEmail = req.query.email;
    console.log('Email received:', userEmail);


    sqlRequest.input('email', sql.VarChar, userEmail);

    try {
        const result = await sqlRequest.query(sqlQuery);

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Error while retrieving data: ' + error.message);
    }
});

// hente data til profilsiden:
app.get('/api/user/profile/edit', async (req, res) => {
    const userID=req.query.userID;

    try {
        const userInfo = await getUserInfo(userID);
        console.log(userInfo)
        res.json(userInfo);
    } catch (error) {
        console.error('Error fething userInfo:', error);
        res.status(500).send('Error fetching recipe userInfo');
    }
});

// endre profil-data i databasen
app.put('/api/user/profile/edit/save_changes',async(req,res)=> {

    const { userID, age, gender, weight } = req.body;
    console.log({userID, age, gender, weight})
    console.log(req.body);

    try {
        const result = await changeUserInfo(userID, age, gender, weight);
        res.status(200).json({ message: "User updated successfully", result });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Error updating user');
    }

});

// slette 
app.delete('/api/user/profile/delete',async(req,res)=>{
    let { userID } = req.body; 
    try{
        await deleteUser(userID);
        res.status(200).json({ message: "User updated successfully"});

    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Error deleting user');
    }

})



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
        const userInfo = await getNutritionalInfo(foodID, parameterID);
        res.json(userInfo);
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
        const result = await saveRecipe(req.body);
        if(result.success) {
            res.status(201).json({ recipeID: result.recipeID, message: result.message });
        } else {
            res.status(500).send('Error in saving recipe');
        }
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
        const userInfo = await getRecipeNutrition(recipeId);
        res.json(userInfo);
    } catch (error) {
        console.error('Error fetching recipe userInfo:', error);
        res.status(500).send('Error fetching recipe userInfo');
    }
});



app.post('/api/user/meal', async (req, res) => {
    const { date, time, location, weight, userID, recipeID } = req.body;
    try {
        const result = await saveMeal(date, time, location, weight, userID, recipeID);
        if (result.success) {
            res.json({ success: true, mealID: result.mealID });
        } else {
            res.status(400).json({ success: false, message: "Unable to save meal" });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
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






//redeigere måltider 
// Eksempel på et Express.js rutehåndterer
app.put('/api/user/meal/:mealID', async (req, res) => {
    const { weight } = req.body;
    const { mealID } = req.params;

    if (!weight || isNaN(weight)) {
        return res.status(400).json({ error: 'Invalid weight provided' });
    }

    try {
        const rowsAffected = await updateMealWeight(mealID, weight);
        if (rowsAffected === 0) {
            return res.status(404).json({ message: 'Meal not found' });
        }
        res.status(200).json({ message: 'Meal updated successfully', weight: weight });
    } catch (error) {
        console.error('Server error updating meal:', error);
        res.status(500).json({ error: 'Server error' });
    }
});




//slette måltider 
app.delete('/api/user/meal/:mealID', async (req, res) => {
    const { mealID } = req.params;
    if (!mealID || isNaN(parseInt(mealID, 10))) {
        return res.status(400).send('Invalid meal ID');
    }

    try {
        // Anta at du har en funksjon `deleteMeal` som håndterer slettingen
        await deleteMeal(mealID);
        res.send('Meal deleted successfully');
    } catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).send('Failed to delete meal');
    }
});

// Use it before any route or middleware that needs to handle cross-origin requests
app.use(cors());

app.get('/api/user/Activitytable/:activityid', getActivity);

app.post('/api/user/Activities', createActivity);

//Stofskifte beregner
app.get('/api/user/profile/:userId', getProfile);

app.post('/api/user/metabolism', createMetabolism);

//Dailynutri energi
app.get('/api/user/meals/:userId', seeEnergi);

//legge til vann 
app.post('/api/user/water', async (req, res) => {
    const { userID } = req.body;
    try {
        const result = await logWater(userID);
        res.status(201).json({ message: "Water intake logged successfully", id: result.insertId });
    } catch (error) {
        console.error('Error logging water intake:', error);
        res.status(500).send('Server error');
    }
});




// Start serveren og lytt på angitt port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});





const express = require('express');
const cors = require('cors');
const { getIngredients, getNutritionalInfo, saveRecipe, getRecipes } = require('./database'); // Oppdatert for å inkludere de nye funksjonene
const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
    origin: '*',  // For sikkerhetsformål bør dette begrenses i produksjonsmiljøer
    methods: ['GET', 'POST', 'PUT', 'DELETE']
};
app.use(cors(corsOptions));



//app.use(cors());
app.use(express.json());

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
    // Anta at du mottar ernæringsverdier i forespørselskroppen
    const { recipeName, userID, protein, kcal, fat, fiber } = req.body;
    
    // Du bør validerer input dataene her

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
        // Pass disse verdiene til saveRecipe funksjonen
        const recipe = await saveRecipe(recipeName, userID, { protein, kcal, fat, fiber });
        res.status(201).json(recipe);
    } catch (error) {
        console.error('Error saving recipe:', error);
        res.status(500).send('Server error');
    }
});





// Hent oppskrifter for en spesifikk bruker
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




app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


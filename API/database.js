


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

async function getIngredients(searchString) {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT FoodID, FoodName FROM foodbank.food WHERE FoodName LIKE '%' + ${searchString} + '%'`; // Oppdatert for å returnere FoodID også
        return result.recordset;
    } catch (err) {
        console.error('Database connection error:', err);
        throw err; // Kast feilen videre for å håndtere den i API-ruten
    }
}

async function getNutritionalInfo(foodID, parameterID) {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`
            SELECT ResVal
            FROM foodbank.foodParameter
            WHERE FoodID = ${foodID} AND ParameterID = ${parameterID}
        `);
        return result.recordset[0];
    } catch (err) {
        console.error('Error fetching nutritional information:', err);
        throw err;
    }
}




async function saveRecipe(recipeData) {
    let transaction = new sql.Transaction();
    try {
        await transaction.begin();
        let request = new sql.Request(transaction);
        request.input('recipeName', sql.VarChar, recipeData.recipeName);
        request.input('userID', sql.Int, recipeData.userID);
        request.input('protein', sql.Decimal(18, 2), recipeData.protein);
        request.input('kcal', sql.Decimal(18, 2), recipeData.kcal);
        request.input('fat', sql.Decimal(18, 2), recipeData.fat);
        request.input('fiber', sql.Decimal(18, 2), recipeData.fiber);

        await request.query(`
            INSERT INTO [user].recipe (recipeName, userID, protein, kcal, fat, fiber)
            VALUES (@recipeName, @userID, @protein, @kcal, @fat, @fiber);
        `);
        await transaction.commit();
        return { success: true, message: "Recipe saved successfully" };
    } catch (err) {
        await transaction.rollback();
        console.error('Error saving recipe:', err);
        throw err;  // Forward the error to be handled by the caller
    }
}


// Henter alle oppskrifter for en gitt bruker
async function getRecipes(userID) {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`
            SELECT r.recipeID, r.recipeName, r.protein, r.kcal, r.fat, r.fiber
            FROM [user].recipe r
            WHERE r.userID = ${userID};
        `;
        return result.recordset;
    } catch (err) {
        console.error('Error fetching recipes:', err);
        throw err;
    }
}




// kode for tracker ___----------------------------------------------------------------


async function getRecipeNutrition(recipeId) {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`
            SELECT protein, kcal, fat, fiber, recipeName
            FROM [user].recipe
            WHERE recipeID = ${recipeId}
        `);
        return result.recordset[0]; // Anta at spørringen returnerer nøyaktig én rad
    } catch (err) {
        console.error('Error fetching recipe nutrition:', err);
        throw err;  // Kast feilen videre for å håndteres av kalleren
    }
}


async function saveMeal(date, time, location, weight, userID, recipeID) {
    try {
        await sql.connect(dbConfig);
        let request = new sql.Request();
        request.input('date', sql.Date, date); // Forsikre deg om at dato er korrekt formatert
        request.input('time', sql.VarChar(10), time); // Spesifiser skalaen for time-typen
        request.input('location', sql.VarChar, location);
        request.input('weight', sql.Int, weight);
        request.input('userID', sql.Int, userID);
        request.input('recipeID', sql.Int, recipeID);

        const result = await request.query(`
            INSERT INTO [user].meal (date, time, location, weight, userID, recipeID)
            VALUES (@date, @time, @location, @weight, @userID, @recipeID);
        `);
        return { success: true, message: "Meal saved successfully" };
    } catch (err) {
        console.error('Database operation error:', err);
        throw err;  // Rethrow the error to handle it in the calling context
    }
}



async function getMealsByUserId(userID) {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`
            SELECT * FROM [user].meal WHERE userID = ${userID};
        `;
        return result.recordset;  // Returnerer alle måltider for gitt brukerID
    } catch (err) {
        console.error('Database query error:', err);
        throw err;
    }
}

//module.exports = { getIngredients, getNutritionalInfo, saveRecipe, getRecipes, saveMeal };




async function updateMeal(mealId, date, time, location, weight, kcal, protein, fat, fiber) {
    await sql.connect(dbConfig);
    let request = new sql.Request();
    request.input('mealId', sql.Int, mealId);
    request.input('date', sql.Date, new Date(date));
    request.input('time', sql.VarChar(10), time);
    request.input('location', sql.VarChar, location);
    request.input('weight', sql.Int, weight);
    request.input('kcal', sql.Decimal(18, 2), kcal);
    request.input('protein', sql.Decimal(18, 2), protein);
    request.input('fat', sql.Decimal(18, 2), fat);
    request.input('fiber', sql.Decimal(18, 2), fiber);

    const result = await request.query(`
        UPDATE [user].meal SET
        date = @date,
        time = @time,
        location = @location,
        weight = @weight,
        kcal = @kcal,
        protein = @protein,
        fat = @fat,
        fiber = @fiber
        WHERE mealId = @mealId;
    `);
    return result.recordset;
}








module.exports = { getIngredients, getNutritionalInfo, saveRecipe, getRecipes, getRecipeNutrition, saveMeal, getMealsByUserId, updateMeal };












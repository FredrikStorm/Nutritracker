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

async function getDbConnection() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log("Connected to SQL database successfully.");
        return pool; // This pool will be used to run queries
    } catch (err) {
        console.error('Failed to connect to the database:', err);
        throw err; // Rethrow the error for caller to handle
    }
}

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

        // Endret for å inkludere OUTPUT for å få tilbake ID'en
        const result = await request.query(`
            INSERT INTO [user].recipe (recipeName, userID, protein, kcal, fat, fiber)
            OUTPUT INSERTED.recipeID  
            VALUES (@recipeName, @userID, @protein, @kcal, @fat, @fiber);
        `);
        await transaction.commit();
        return { success: true, recipeID: result.recordset[0].recipeID, message: "Recipe saved successfully" };
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

//Kode for user information---------------------------------------------------------------------
/*
async function getUserInfo(userID) {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`
            SELECT firstname, lastname, age, gender, weight
            FROM [user].profile
            WHERE userID = ${userID}
        `);
        return result.recordset[0];
    } catch (err) {
        console.error('Error fetching user info:', err);
        throw err; // Rethrow the error so the catch block in the API can handle it
    }
}
*/

async function changeUserInfo(userID, age, gender, weight) {
    let sqlRequest = new sql.Request(); 

    sqlRequest.input('userID', sql.Int, userID);
    sqlRequest.input('age', sql.Int, age);
    sqlRequest.input('weight', sql.Int, weight); 
    sqlRequest.input('gender', sql.VarChar, gender);

    const result = await sqlRequest.query(`
        UPDATE [user].profile 
        SET
        weight = @weight,
        age = @age,
        gender = @gender
        WHERE userID = @userID;
    `); 
    return result.recordset; 
}

async function deleteUser(userID){
    let sqlRequest = new sql.Request(); 

    sqlRequest.input('userID', sql.Int, userID);

    const result = await sqlRequest.query(`
    DELETE [user].profile where userID = @userID;
    `);
    return result;

}

// kode for tracker---------------------------------------------------------------------------


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
        request.input('date', sql.Date, date);
        request.input('time', sql.VarChar(10), time);
        request.input('location', sql.VarChar, location);
        request.input('weight', sql.Int, weight);
        request.input('userID', sql.Int, userID);
        request.input('recipeID', sql.Int, recipeID);

        // Bruk OUTPUT klause for å få den genererte mealID tilbake etter innsetting
        const result = await request.query(`
            INSERT INTO [user].meal (date, time, location, weight, userID, recipeID)
            OUTPUT INSERTED.mealID
            VALUES (@date, @time, @location, @weight, @userID, @recipeID);
        `);
        // Anta at en ID alltid genereres og returneres
        const mealID = result.recordset[0].mealID;
        return { success: true, message: "Meal saved successfully", mealID };
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






async function updateMealWeight(mealID, weight) {
    try {
        let pool = await sql.connect(/* din database konfigurasjon */);
        let result = await pool.request()
            .input('mealID', sql.Int, mealID)
            .input('weight', sql.Int, weight)
            .query('UPDATE [user].meal SET weight = @weight WHERE mealID = @mealID');
        return result.rowsAffected;
    } catch (err) {
        console.error('Error updating meal weight:', err);
        throw err;
    }
}


async function deleteMeal(mealID) {
    let transaction = new sql.Transaction();
    try {
        await transaction.begin();
        let request = new sql.Request(transaction);
        request.input('mealID', sql.Int, mealID); // Pass på at du bruker riktig datatype

        await request.query(`
            DELETE FROM [user].meal WHERE mealID = @mealID;
        `);
        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        console.error('Error deleting meal:', err);
        throw err;
    }
}


//legge til vann 
async function logWater(userID) {
    try {
        await sql.connect(dbConfig);  // Sørg for at dette fungerer som forventet
        let request = new sql.Request();
        request.input('userID', sql.Int, userID);
        // Bruker nå korrekt tabellnavn og kolonnenavn som i din database
        const result = await request.query('INSERT INTO [user].water (userID) VALUES (@userID)');
        return { success: true, recordset: result.recordset };
    } catch (error) {
        console.error('Failed to log water intake:', error);
        throw error; // Kaster feilen videre slik at den kan håndteres av kalleren
    }
}

module.exports = { getIngredients, getNutritionalInfo, saveRecipe, getRecipes, getRecipeNutrition, saveMeal, getMealsByUserId, updateMealWeight,  deleteMeal, /*etUserInfo*/ changeUserInfo, logWater, getDbConnection,deleteUser };












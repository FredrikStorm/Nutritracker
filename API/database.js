


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


/*
async function saveRecipe(recipeName, userID, nutrientsPer100g) {
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('recipeName', sql.VarChar, recipeName);
        request.input('userID', sql.Int, userID);
        request.input('protein', sql.Decimal(18, 0), nutrientsPer100g.protein);
        request.input('kcal', sql.Decimal(18, 0), nutrientsPer100g.kcal);
        request.input('fat', sql.Decimal(18, 0), nutrientsPer100g.fat);
        request.input('fiber', sql.Decimal(18, 0), nutrientsPer100g.fiber);

        await request.query(`
            INSERT INTO [user].recipe (recipeName, userID, protein, kcal, fat, fiber) 
            VALUES (@recipeName, @userID, @protein, @kcal, @fat, @fiber);
        `);
        const result = await request.query(`SELECT SCOPE_IDENTITY() AS NewRecipeID;`);
        
        return { recipeID: result.recordset[0].NewRecipeID };
    } catch (err) {
        console.error('Error saving recipe:', err);
        throw err;
    }
}

*/

async function saveRecipe(recipeName, userID, nutrientsPer100g) {
    let transaction; // Variabel for å holde styr på transaksjonen

    try {
        // Åpne en transaksjon
        transaction = new sql.Transaction();
        await transaction.begin();

        // Sett opp SQL-spørringen med parametre
        const request = new sql.Request(transaction);
        request.input('recipeName', sql.VarChar, recipeName);
        request.input('userID', sql.Int, userID);
        request.input('protein', sql.Decimal(18, 0), nutrientsPer100g.protein);
        request.input('kcal', sql.Decimal(18, 0), nutrientsPer100g.kcal);
        request.input('fat', sql.Decimal(18, 0), nutrientsPer100g.fat);
        request.input('fiber', sql.Decimal(18, 0), nutrientsPer100g.fiber);

        // Utfør SQL-insert
        await request.query(`
            INSERT INTO [user].recipe (recipeName, userID, protein, kcal, fat, fiber) 
            VALUES (@recipeName, @userID, @protein, @kcal, @fat, @fiber);
        `);

        // Utfør SQL-select for å hente ut ID-en til den nye oppskriften
        const result = await request.query(`SELECT SCOPE_IDENTITY() AS NewRecipeID;`);
        
        // Commit transaksjonen
        await transaction.commit();

        // Returner oppskriftens ID
        return { recipeID: result.recordset[0].NewRecipeID };
    } catch (err) {
        // Rull tilbake transaksjonen hvis det oppstår en feil
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackErr) {
                console.error('Error rolling back transaction:', rollbackErr);
            }
        }
        // Logg feilen
        console.error('Error saving recipe:', err);
        // Kast feilen videre
        throw err;
    } finally {
        // Lukk transaksjonen hvis den ikke er lukket
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackErr) {
                console.error('Error rolling back transaction:', rollbackErr);
            }
        }
    }
}





// Henter alle oppskrifter for en gitt bruker
async function getRecipes(userID) {
    try {
        await sql.connect(dbConfig);
        const recipes = await sql.query`SELECT r.recipeID, r.recipeName, ri.ingredientID, ri.weight FROM recipe r JOIN recipeingredient ri ON r.recipeID = ri.recipeID WHERE r.userID = ${userID};`;
        return recipes.recordset;
    } catch (err) {
        console.error('Error fetching recipes:', err);
        throw err;
    }
}

module.exports = { getIngredients, getNutritionalInfo, saveRecipe, getRecipes };


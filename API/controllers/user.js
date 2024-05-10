const { getDbConnection } = require('../database.js');
const sql = require('mssql');
const cors = require('cors');

//aktivitetsberegner
const getActivity = (cors(), async (req, res) => {
    const { activityid } = req.params;
    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('activityid', sql.Int, parseInt(activityid))
            .query('SELECT activityid, activityname, kcal FROM [user].Activitytable WHERE activityid = @activityid');

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);  // Send back the first (and should be only) result
        } else {
            res.status(404).send('Activity not found');
        }
    } catch (err) {
        res.status(500).send('Database error: ' + err.message);
    }
})

//aktivitetsberegner
const createActivity = (cors(), async (req, res) => {
    const { activityid, activityname, totalKcalBurned, hours, userId } = req.body;  // Capture userId from the body
    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('activityid', sql.Int, activityid)
            .input('activityname', sql.NVarChar, activityname)
            .input('kcal', sql.Float, totalKcalBurned)
            .input('hours', sql.Float, hours)
            .input('userId', sql.Int, userId)
            .query('INSERT INTO [user].Activities (activityId, activityName, kcal, hours, userId, timestamp) VALUES (@activityid, @activityname, @kcal, @hours, @userId, DEFAULT)');
        
        res.status(201).send('Activity logged successfully');
    } catch (err) {
        console.error(err);
        res.status(500). send('Database error: ' + err.message);
    }
});

//stofskifte beregner
const getProfile = (cors(), async (req, res) => {
    const { userId } = req.params;
    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT age, weight, gender FROM [user].profile WHERE userId = @userId');

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send('User profile not found');
        }
    } catch (err) {
        res.status(500).send('Database error: ' + err.message);
    }
})

//stofskifte beregner
const createMetabolism = (cors(), async (req, res) => {
    const { userId, metabolism } = req.body;
    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('metabolism', sql.Float, metabolism)  // Assuming metabolism is a float; adjust as needed.
            .query('INSERT INTO [user].metabolism (userId, stofskifte) VALUES (@userId, @metabolism)');

        res.status(201).send('Metabolism data saved successfully');
    } catch (err) {
        res.status(500).send('Database error: ' + err.message);
    }
})

//daily nutri
const seeEnergi = async (req, res) => {
    const { userId } = req.params;
    const viewType = req.query.viewType || 'daily'; // 'daily' or 'monthly'

    try {
        const pool = await getDbConnection();
        let timeGroup = viewType === 'monthly' ? 'day' : 'hour'; // Determines grouping level

        const mealsQuery = `
            SELECT 
                DATEPART(${timeGroup}, DanishTime) AS TimeGroup,
                SUM((weight / 100.0) * r.kcal) as TotalKcal
            FROM [user].meal m
            JOIN [user].recipe r ON m.recipeID = r.recipeID
            WHERE m.userID = @userId
            GROUP BY DATEPART(${timeGroup}, DanishTime)
        `;
        
        const waterQuery = `
            SELECT 
                DATEPART(${timeGroup}, DanishTime) AS TimeGroup,
                COUNT(*) * 250 AS WaterIntake
            FROM [user].water
            WHERE userId = @userId
            GROUP BY DATEPART(${timeGroup}, Danishtime)
        `;

        const metabolismQuery = `
            SELECT m.stofskifte
            FROM [user].metabolism m
            WHERE m.userId = @userId
        `;

        const activitiesQuery = `
            SELECT 
                DATEPART(${timeGroup}, a.DanishTime) AS TimeGroup,
                SUM(a.kcal) AS TotalActivityKcal
            FROM [user].Activities a
            WHERE a.userId = @userId
            GROUP BY DATEPART(${timeGroup}, a.DanishTime)
        `;

        const [mealsResult, waterResult, metabolismResult, activitiesResult] = await Promise.all([
            pool.request().input('userId', sql.Int, parseInt(userId)).query(mealsQuery),
            pool.request().input('userId', sql.Int, parseInt(userId)).query(waterQuery),
            pool.request().input('userId', sql.Int, parseInt(userId)).query(metabolismQuery),
            pool.request().input('userId', sql.Int, parseInt(userId)).query(activitiesQuery)
        ]);

        const metabolismRate = metabolismResult.recordset.length ? metabolismResult.recordset[0].stofskifte : 0;
        const metabolismPerHour = viewType === 'monthly' ? metabolismRate : metabolismRate / 24;

        const responseData = Array.from({ length: viewType === 'monthly' ? 31 : 24 }, (_, i) => ({
            timeGroup: i,
            totalKcal: 0,
            waterIntake: 0,
            hourlyBurn: metabolismPerHour, // Adjusted based on view type
            totalActivityKcal: 0
        }));

        mealsResult.recordset.forEach(meal => {
            const index = responseData.findIndex(h => h.timeGroup === meal.TimeGroup);
            if (index !== -1) {
                responseData[index].totalKcal += meal.TotalKcal;
            }
        });

        waterResult.recordset.forEach(water => {
            const index = responseData.findIndex(h => h.timeGroup === water.TimeGroup);
            if (index !== -1) {
                responseData[index].waterIntake += water.WaterIntake;
            }
        });

        activitiesResult.recordset.forEach(activity => {
            const index = responseData.findIndex(h => h.timeGroup === activity.TimeGroup);
            if (index !== -1) {
                responseData[index].totalActivityKcal += activity.TotalActivityKcal;
            }
        });

        res.json(responseData);
    } catch (err) {
        console.error('Error executing database queries:', err);
        res.status(500).send('Database error: ' + err.message);
    }
};

//bruger styring
const profile = async (req, res) => {
    const { userId } = req.params;
    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT age, weight, gender FROM [user].profile WHERE userId = @userId');

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send('User profile not found');
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Database error: ' + err.message);
    }
}

//bruger styring
const saveUser = async (req, res) => {
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

        
        res.status(201).json({ userID });

        
    } catch (err) {
        console.log(err);
        res.status(500).send('Error while inserting data: ' + err.message);
    }
};

//bruger styring
const checkProfile = async (req, res) => {
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
}

//bruger styring
const saveChanges = async (req, res) => {
    const { userID, age, gender, weight } = req.body;

    let sqlRequest = new sql.Request(); 

    sqlRequest.input('userID', sql.Int, userID);
    sqlRequest.input('age', sql.Int, age);
    sqlRequest.input('weight', sql.Int, weight); 
    sqlRequest.input('gender', sql.VarChar, gender);

    try {
        const result = await sqlRequest.query(`
            UPDATE [user].profile 
            SET
            weight = @weight,
            age = @age,
            gender = @gender
            WHERE userID = @userID;
        `);

        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: "User updated successfully", result });
        } else {
            res.status(404).send('User not found or no changes made.');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Error updating user');
    }
};

//Bruger styring
const deleteThisProfile = async (req, res) => {
    const { userID } = req.body;

    const sqlRequest = new sql.Request();
    
    try {
        // Define user ID input only once
        sqlRequest.input('userID', sql.Int, userID);

        // First, delete user activities
        await sqlRequest.query(`DELETE FROM [user].Activities WHERE userId = @userID;`);

        await sqlRequest.query(`DELETE FROM [user].meal WHERE userID = @userID;`);

        await sqlRequest.query(`DELETE FROM [user].metabolism WHERE userId = @userID;`);

        await sqlRequest.query(`DELETE FROM [user].recipe WHERE userID = @userID;`);

        await sqlRequest.query(`DELETE FROM [user].water WHERE userId = @userID;`); // This seems redundant as it's repeated.

        // Then, delete the user profile
        await sqlRequest.query(`DELETE FROM [user].profile WHERE userID = @userID;`);

        res.status(200).json({ message: "User and related activities deleted successfully"});
    } catch (error) {
        console.error('Error deleting user and activities:', error);
        res.status(500).send('Error deleting user and activities');
    }
};

//Meal creator
const getIngredients = async (req, res) => {
    const searchString = req.query.search || '';

    try {
        // Use the existing connection pool
        const pool = await getDbConnection();
        const request = new sql.Request(pool);
        request.input('searchString', sql.NVarChar, searchString);
        const query = "SELECT FoodID, FoodName FROM foodbank.food WHERE FoodName LIKE '%' + @searchString + '%'";

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).send('Error fetching ingredients');
    }
};

//Meal creator
const getNutritionalInfo = async (req, res) => {
    const { foodID, parameterID } = req.query;
    console.log("Received foodID from client:", foodID);
    console.log("Received parameterID from client:", parameterID);

    try {
        const pool = await getDbConnection();
        const request = pool.request();
        request.input('FoodID', sql.Int, foodID);
        request.input('ParameterID', sql.Int, parameterID);
        const query = `
            SELECT ResVal
            FROM foodbank.foodParameter
            WHERE FoodID = @FoodID AND ParameterID = @ParameterID
        `;
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]); // Send first result to client
        } else {
            res.status(404).send('No data found');
        }
    } catch (error) {
        console.error('Error fetching nutritional information:', error);
        res.status(500).send('Error fetching nutritional information');
    }
};

//Meal creator
const saveRecipe = async (req, res) => {
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
        const pool = await getDbConnection();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction);
        request.input('recipeName', sql.VarChar, recipeName);
        request.input('userID', sql.Int, userID);
        request.input('protein', sql.Decimal(18, 2), protein);
        request.input('kcal', sql.Decimal(18, 2), kcal);
        request.input('fat', sql.Decimal(18, 2), fat);
        request.input('fiber', sql.Decimal(18, 2), fiber);

        const result = await request.query(`
            INSERT INTO [user].recipe (recipeName, userID, protein, kcal, fat, fiber)
            OUTPUT INSERTED.recipeID  
            VALUES (@recipeName, @userID, @protein, @kcal, @fat, @fiber);
        `);

        await transaction.commit();
        res.status(201).json({ recipeID: result.recordset[0].recipeID, message: "Recipe saved successfully" });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error saving recipe:', error);
        res.status(500).send('Server error');
    }
};

// Henter alle oppskrifter for en gitt bruker
//Meal creator
const getRecipes = async (req, res) => {
    const { userID } = req.query;

    if (isNaN(userID) || userID <= 0) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const pool = await getDbConnection();
        const request = pool.request();
        request.input('userID', sql.Int, userID);
        const result = await request.query(`
            SELECT r.recipeID, r.recipeName, r.protein, r.kcal, r.fat, r.fiber
            FROM [user].recipe r
            WHERE r.userID = @userID;
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).send('Error fetching recipes');
    }
};

//Meal tracker
const getRecipeNutrition = async (req, res) => {
    const recipeId = parseInt(req.params.recipeId);

    if (isNaN(recipeId) || recipeId <= 0) {
        return res.status(400).json({ error: 'Invalid recipe ID' });
    }

    try {
        const pool = await getDbConnection();
        const request = pool.request();
        request.input('recipeId', sql.Int, recipeId);
        const result = await request.query(`
            SELECT protein, kcal, fat, fiber, recipeName
            FROM [user].recipe
            WHERE recipeID = @recipeId;
        `);

        const recipeInfo = result.recordset[0];
        if (recipeInfo) {
            res.json(recipeInfo);
        } else {
            res.status(404).send('Recipe not found');
        }
    } catch (error) {
        console.error('Error fetching recipe nutrition:', error);
        res.status(500).send('Error fetching recipe nutrition');
    }
};

//Meal tracker
const saveMeal = async (req, res) => {
    const { date, time, location, weight, userID, recipeID } = req.body;

    // Obtain a database connection
    try {
        const pool = await getDbConnection();  // This function must be defined or available in your code
        const request = pool.request();

        // Prepare input parameters
        request.input('date', sql.Date, date);
        request.input('time', sql.VarChar(10), time);
        request.input('location', sql.VarChar, location);
        request.input('weight', sql.Int, weight);
        request.input('userID', sql.Int, userID);
        request.input('recipeID', sql.Int, recipeID);

        // Execute the query with an OUTPUT clause to get the newly inserted mealID
        const result = await request.query(`
            INSERT INTO [user].meal (date, time, location, weight, userID, recipeID)
            OUTPUT INSERTED.mealID
            VALUES (@date, @time, @location, @weight, @userID, @recipeID);
        `);

        // Check if a mealID was generated and return the response
        if (result.recordset.length > 0) {
            const mealID = result.recordset[0].mealID;
            res.json({ success: true, mealID: mealID, message: "Meal saved successfully" });
        } else {
            res.status(400).json({ success: false, message: "Unable to save meal" });
        }

        pool.close(); // It's important to close the pool connection
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

//Meal tracker
const getMealsByUserId = async (req, res) => {
    const { userID } = req.query;  // Assuming userID is sent as a query parameter

    if (!userID) {
        return res.status(400).send('User ID is required');
    }

    try {
        const pool = await getDbConnection();
        const request = pool.request();
        
        // Utilize parameterized queries for better security and performance
        request.input('userID', sql.Int, userID);
        const result = await request.query(`
            SELECT * FROM [user].meal WHERE userID = @userID;
        `);

        // Assuming that pool does not need to be closed manually in this context as it should be managed by the pool itself
        res.json(result.recordset); // Send all meals for the given userID
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).send('Error fetching meals');
    }
};

//Meal tracker
const updateMealWeight = async (req, res) => {
    const { weight } = req.body;
    const { mealID } = req.params;

    if (!weight || isNaN(weight)) {
        return res.status(400).json({ error: 'Invalid weight provided' });
    }

    try {
        const pool = await getDbConnection();
        const request = pool.request();
        request.input('mealID', sql.Int, mealID);
        request.input('weight', sql.Int, weight);

        const result = await request.query(`
            UPDATE [user].meal SET weight = @weight WHERE mealID = @mealID
        `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Meal not found' });
        }
        
        res.status(200).json({ message: 'Meal updated successfully', weight: weight });
    } catch (error) {
        console.error('Server error updating meal:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

//Meal tracker
const deleteMeal = async (req, res) => {
    const { mealID } = req.params;
    if (!mealID || isNaN(parseInt(mealID, 10))) {
        return res.status(400).send('Invalid meal ID');
    }

    try {
        const pool = await getDbConnection(); // Assume getDbConnection is an async function that handles SQL connection
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();
        const request = new sql.Request(transaction);
        request.input('mealID', sql.Int, mealID);

        const result = await request.query('DELETE FROM [user].meal WHERE mealID = @mealID;');
        await transaction.commit();

        if (result.rowsAffected[0] === 0) {
            res.status(404).send('Meal not found');
        } else {
            res.send('Meal deleted successfully');
        }
    } catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).send('Failed to delete meal');
    }
};

//Meal tracker
const logWater = async (req, res) => {
    const { userID } = req.body;

    if (!userID) {
        return res.status(400).json({ error: "Invalid or missing user ID" });
    }

    try {
        const pool = await getDbConnection();  // Assume getDbConnection handles connection pooling
        const request = pool.request();
        request.input('userID', sql.Int, userID);

        const result = await request.query('INSERT INTO [user].water (userID) VALUES (@userID); SELECT SCOPE_IDENTITY() as insertId');
        const insertId = result.recordset[0].insertId;  // Get the ID of the newly inserted record

        res.status(201).json({ message: "Water intake logged successfully", id: insertId });
    } catch (error) {
        console.error('Error logging water intake:', error);
        res.status(500).send('Server error');
    }
};

module.exports = { getActivity, createActivity, getProfile, createMetabolism, seeEnergi, profile, saveUser, checkProfile, saveChanges, deleteThisProfile, getIngredients, getNutritionalInfo, saveRecipe, getRecipes, getRecipeNutrition, saveMeal, getMealsByUserId, updateMealWeight, deleteMeal, logWater }
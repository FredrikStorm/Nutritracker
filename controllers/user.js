// Importere funktionen, som gør at vi kan connecte til databasen
const { getDbConnection } = require('../Model/database.js');
const sql = require('mssql'); // SQL-modul til at udføre forespørgsler
const cors = require('cors'); // CORS-modul til at tillade anmodninger

// Henter aktiviteter
const getActivity = (cors(), async (req, res) => {
    const { activityid } = req.params; // Uddrag aktivitets-ID fra URL-parametre
    try {
        const pool = await getDbConnection(); // Opret en databaseforbindelse
        const result = await pool.request() // Opret en ny forespørgsel til databasen
            .input('activityid', sql.Int, parseInt(activityid)) // forbinder aktivitets-ID'et til forespørgslen
            .query('SELECT activityid, activityname, kcal FROM [user].Activitytable WHERE activityid = @activityid'); // SQL-forespørgsel for at hente aktivitet

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]); // Sender fundne aktivitetsdata som en JSON-respons
        } else {
            res.status(404).send('Aktivitet ikke fundet'); // Send en fejl, hvis ingen aktivitet findes
        }
    } catch (err) {
        res.status(500).send('Databasefejl: ' + err.message);
    }
});

// Logger nye aktiviteter i databasen
const createActivity = (cors(), async (req, res) => {
    const { activityid, activityname, totalKcalBurned, hours, userId } = req.body;
    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('activityid', sql.Int, activityid)
            .input('activityname', sql.NVarChar, activityname)
            .input('kcal', sql.Float, totalKcalBurned)
            .input('hours', sql.Float, hours)
            .input('userId', sql.Int, userId)
            .query('INSERT INTO [user].Activities (activityId, activityName, kcal, hours, userId, timestamp) VALUES (@activityid, @activityname, @kcal, @hours, @userId, DEFAULT)');

        res.status(201).send('Aktivitet logget med succes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Databasefejl: ' + err.message); // Håndter potentielle fejl ved brug af databasen
    }
});

// Henter bruger oplysninger på baggrund af userID
const getProfile = (cors(), async (req, res) => {
    const { userId } = req.params;
    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT age, weight, gender FROM [user].profile WHERE userId = @userId');

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]); // Returner profildata som JSON
        } else {
            res.status(404).send('Brugerprofil ikke fundet'); // Returner en fejl, hvis profilen ikke findes
        }
    } catch (err) {
        res.status(500).send('Databasefejl: ' + err.message); // Håndter fejl ved databaseforbindelse
    }
});

// Gemmer brugerens stofskifte i databasen
const createMetabolism = (cors(), async (req, res) => {
    const { userId, metabolism } = req.body; // Uddrag stofskifte og bruger-ID fra anmodningens krop
    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('metabolism', sql.Float, metabolism)
            .query('INSERT INTO [user].metabolism (userId, stofskifte) VALUES (@userId, @metabolism)');

        res.status(201).send('Data om stofskifte gemt med succes');
    } catch (err) {
        res.status(500).send('Databasefejl: ' + err.message);
    }
});

///daily nutri 
const seeEnergi = async (req, res) => {
    const { userId } = req.params;
    const viewType = req.query.viewType || 'daily'; // Den starter i viewtype daily

    try {
        const pool = await getDbConnection(); //skaber en connection til databasen ved at kalde denne function
        let timeGroup = viewType === 'monthly' ? 'day' : 'hour'; // Definere hvilken view den skal vise

        //Her er der 4 sql forespørgsler som henter data fra databasen
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

        // Udføre alle forespørgsler samtidigt ved brug af Promise.all for effektivitet
        const [mealsResult, waterResult, metabolismResult, activitiesResult] = await Promise.all([
            pool.request().input('userId', sql.Int, parseInt(userId)).query(mealsQuery),
            pool.request().input('userId', sql.Int, parseInt(userId)).query(waterQuery),
            pool.request().input('userId', sql.Int, parseInt(userId)).query(metabolismQuery),
            pool.request().input('userId', sql.Int, parseInt(userId)).query(activitiesQuery)
        ]);

        // Behandler resultaterne for at kombinere alt dataen i en enkel responsobjekt
        const metabolismRate = metabolismResult.recordset.length ? metabolismResult.recordset[0].stofskifte : 0;
        const metabolismPerHour = viewType === 'monthly' ? metabolismRate : metabolismRate / 24;

        const responseData = Array.from({ length: viewType === 'monthly' ? 31 : 24 }, (_, i) => ({
            timeGroup: i,
            totalKcal: 0,
            waterIntake: 0,
            hourlyBurn: metabolismPerHour, // justere for view type
            totalActivityKcal: 0
        }));

        // Gennemgår hver post i måltidsresultatet
        mealsResult.recordset.forEach(meal => {
            // Finder indekset i responseData, hvor tidsgruppen matcher måltidets tidsgruppe
            const index = responseData.findIndex(h => h.timeGroup === meal.TimeGroup);
            // Hvis der findes en matchende tidsgruppe i responseData
            if (index !== -1) {
                // Tilføj kaloriværdien fra det aktuelle måltid til den samlede kaloriværdi for den tidsgruppe
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

// Bruger styring
// Funktion til at hente en brugers profiloplysninger fra databasen
const profile = async (req, res) => {
    const { userId } = req.params;  // Henter brugerens ID fra URL-parametrene
    try {
        const pool = await getDbConnection();  // Etablerer databaseforbindelse
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT age, weight, gender FROM [user].profile WHERE userId = @userId');  // Udfører SQL-forespørgsel

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);  // Sender brugerprofilen som respons, hvis fundet
        } else {
            res.status(404).send('User profile not found');  // Sender fejl, hvis ingen profil er fundet
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Database error: ' + err.message);
    }
}

// Bruger styring
// Funktion til at oprette og gemme en ny brugerprofil i databasen
const saveUser = async (req, res) => {
    let sqlRequest = new sql.Request();  // Opretter et nyt SQL Request objekt
    let sqlQuery = `INSERT INTO [user].profile (firstname, lastname, weight, age, gender, email, password)
                    OUTPUT inserted.userID 
                    VALUES ( @firstname, @lastname, @weight, @age, @gender, @email, @password)`;  // SQL-forespørgsel til at indsætte data

    // Tilføjer inputparametre til SQL-forespørgslen
    sqlRequest.input('firstname', sql.VarChar, req.body.firstname);
    sqlRequest.input('lastname', sql.VarChar, req.body.lastname);
    sqlRequest.input('weight', sql.Int, req.body.weight);
    sqlRequest.input('age', sql.Int, req.body.age);
    sqlRequest.input('gender', sql.VarChar, req.body.gender);
    sqlRequest.input('email', sql.VarChar, req.body.email);
    sqlRequest.input('password', sql.VarChar, req.body.password);

    try {
        const result = await sqlRequest.query(sqlQuery);  // Udfører SQL-forespørgslen og opretter brugeren
        const userID = result.recordset[0];  // Henter det indsatte bruger-ID

        res.status(201).json({ userID });  // Sender det oprettede bruger-ID som respons

    } catch (err) {
        console.log(err);
        res.status(500).send('Error while inserting data: ' + err.message);
    }
};

// Bruger styring
// Funktion til at kontrollere, om en brugerprofil eksisterer baseret på e-mail
const checkProfile = async (req, res) => {
    let sqlRequest = new sql.Request();
    let sqlQuery = `SELECT * FROM [user].profile WHERE email = @email;`;  // SQL-forespørgsel til at finde bruger via e-mail

    const userEmail = req.query.email;  // Henter e-mail fra forespørgselens URL-parametre
    console.log('Email received:', userEmail);

    sqlRequest.input('email', sql.VarChar, userEmail);  // Tilføjer e-mail som inputparameter

    try {
        const result = await sqlRequest.query(sqlQuery);  // Udfører SQL-forespørgslen

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);  // Sender brugerprofilen som respons, hvis fundet
        } else {
            res.status(404).send('User not found');  // Sender fejl, hvis ingen profil er fundet
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Error while retrieving data: ' + error.message);  
    }
}

// Bruger styring
// Funktion til at opdatere eksisterende brugeroplysninger i databasen
const saveChanges = async (req, res) => {
    const { userID, age, gender, weight } = req.body; 

    let sqlRequest = new sql.Request();

    // Tilføjer inputparametre til SQL-forespørgslen
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
        `);  // Udfører opdateringsforespørgsel

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

// Bruger styring
// Funktion til at slette en brugerprofil og alle tilknyttede data fra databasen
const deleteThisProfile = async (req, res) => {
    const { userID } = req.body;  // Henter brugerens ID fra forespørgselskroppen

    const sqlRequest = new sql.Request();

    try {
        sqlRequest.input('userID', sql.Int, userID);  // Tilføjer brugerens ID som inputparameter

        // Sletter brugerens aktiviteter og profil i rækkefølge
        await sqlRequest.query(`DELETE FROM [user].Activities WHERE userId = @userID;`);
        await sqlRequest.query(`DELETE FROM [user].meal WHERE userID = @userID;`);
        await sqlRequest.query(`DELETE FROM [user].metabolism WHERE userId = @userID;`);
        await sqlRequest.query(`DELETE FROM [user].recipe WHERE userID = @userID;`);
        await sqlRequest.query(`DELETE FROM [user].water WHERE userId = @userID;`); 
        await sqlRequest.query(`DELETE FROM [user].profile WHERE userID = @userID;`);

        res.status(200).json({ message: "User and related activities deleted successfully" });  
    } catch (error) {
        console.error('Error deleting user and activities:', error);
        res.status(500).send('Error deleting user and activities');  
    }
};


// Måltidsskaber
// Funktion til at hente ingredienser
const getIngredients = async (req, res) => {
    const searchString = req.query.search || '';  // Henter data fra søge feltet

    try {
        const pool = await getDbConnection();  // Etablerer databaseforbindelse
        const request = new sql.Request(pool);
        request.input('searchString', sql.NVarChar, searchString);  // Tilføjer søge feltet som input til SQL-forespørgsel
        const query = "SELECT FoodID, FoodName FROM foodbank.food WHERE FoodName LIKE '%' + @searchString + '%'";

        const result = await request.query(query);  // Udfører forespørgslen og henter resultater
        res.json(result.recordset);  // Sender resultaterne som JSON-objekt
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).send('Error fetching ingredients');  
    }
};

// Måltidsskaber
// Funktion til at hente ernæringsinformation baseret på fødevare-ID og parameter-ID
const getNutritionalInfo = async (req, res) => {
    const { foodID, parameterID } = req.query;  // Henter fødevare-ID og parameter-ID fra forespørgslen

    try {
        const pool = await getDbConnection();  // Etablerer databaseforbindelse
        const request = pool.request();
        request.input('FoodID', sql.Int, foodID);
        request.input('ParameterID', sql.Int, parameterID);
        const query = `
            SELECT ResVal
            FROM foodbank.foodParameter
            WHERE FoodID = @FoodID AND ParameterID = @ParameterID
        `;
        const result = await request.query(query);  // Udfører SQL-forespørgslen og henter resultater

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]); // Sender det første resultat til klienten
        } else {
            res.status(404).send('No data found'); 
        }
    } catch (error) {
        console.error('Error fetching nutritional information:', error);
        res.status(500).send('Error fetching nutritional information');  // Håndterer og sender fejlbesked
    }
};

// Måltidsskaber
// Funktion til at gemme en opskrift i databasen
const saveRecipe = async (req, res) => {
    const { recipeName, userID, protein, kcal, fat, fiber } = req.body;  // Henter værdier 

    // Validerer de indkomne data for at sikre at de gyldige
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
        const pool = await getDbConnection();  // Etablerer databaseforbindelse
        const transaction = new sql.Transaction(pool);
        await transaction.begin();  // Starter en database transaktion

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
        `);  // Indsætter dataene i databasen og returnerer det nye opskrifts-ID

        await transaction.commit();  // Bekræfter transaktionen
        res.status(201).json({ recipeID: result.recordset[0].recipeID, message: "Recipe saved successfully" });

    } catch (error) {
        if (transaction) await transaction.rollback();  // laver en rollback hvis det er fejl i transaktionen
        console.error('Error saving recipe:', error);
        res.status(500).send('Server error');  
    }
};

// Måltidsskaber
// Funktion til at hente alle opskrifter for en bruger
const getRecipes = async (req, res) => {
    const { userID } = req.query;  // Henter brugerens ID fra forespørgslen

    // Validerer bruger-ID for gyldighed
    if (isNaN(userID) || userID <= 0) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const pool = await getDbConnection();  // Etablerer databaseforbindelse
        const request = pool.request();
        request.input('userID', sql.Int, userID);
        const result = await request.query(`
            SELECT r.recipeID, r.recipeName, r.protein, r.kcal, r.fat, r.fiber
            FROM [user].recipe r
            WHERE r.userID = @userID;
        `);  // Udfører SQL-forespørgslen og henter opskrifter der tilhører brugeren

        res.json(result.recordset);  // Sender resultaterne som JSON
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).send('Error fetching recipes');  // Håndterer og sender fejlbesked
    }
};

// Måltidstracker
// Funktion til at hente næring for en opskrift baseret på opskrifts-ID
const getRecipeNutrition = async (req, res) => {
    const recipeId = parseInt(req.params.recipeId);  // Konverterer recipeId fra URL-parametre til et heltal

    // Validerer at recipeId er et gyldigt heltal og større end 0
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

        const recipeInfo = result.recordset[0];  // Gemmer det første resultat fra forespørgslen
        if (recipeInfo) {
            res.json(recipeInfo);  // Sender næringsoplysningerne som JSON hvis opskriften findes
        } else {
            res.status(404).send('Recipe not found'); 
        }
    } catch (error) {
        console.error('Error fetching recipe nutrition:', error);
        res.status(500).send('Error fetching recipe nutrition');  
    }
};

// Måltidstracker
// Funktion til at gemme et måltid i databasen
const saveMeal = async (req, res) => {
    const { date, time, location, weight, userID, recipeID } = req.body;  // Henter måltidsoplysninger

    try {
        const pool = await getDbConnection();  
        const request = pool.request();

        // Forbereder inputparametre til SQL-forespørgsel
        request.input('date', sql.Date, date);
        request.input('time', sql.VarChar(10), time);
        request.input('location', sql.VarChar, location);
        request.input('weight', sql.Int, weight);
        request.input('userID', sql.Int, userID);
        request.input('recipeID', sql.Int, recipeID);

        // Udfører SQL-forespørgsel for at indsætte det nye måltid og returnerer det nye måltids-ID
        const result = await request.query(`
            INSERT INTO [user].meal (date, time, location, weight, userID, recipeID)
            OUTPUT INSERTED.mealID
            VALUES (@date, @time, @location, @weight, @userID, @recipeID);
        `);

        // Kontrollerer om et måltids-ID blev genereret og returnerer svaret
        if (result.recordset.length > 0) {
            const mealID = result.recordset[0].mealID;
            res.json({ success: true, mealID: mealID, message: "Meal saved successfully" });
        } else {
            res.status(400).json({ success: false, message: "Unable to save meal" });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });  // Håndterer serverfejl
    }
};

// Måltidstracker
// Funktion til at hente alle måltider for en bruger baseret på brugerens ID
const getMealsByUserId = async (req, res) => {
    const { userID } = req.query; 

    if (!userID) {
        return res.status(400).send('User ID is required');  // Validerer at et bruger-ID er angivet
    }

    try {
        const pool = await getDbConnection();  
        const request = pool.request();

        request.input('userID', sql.Int, userID);
        const result = await request.query(`
            SELECT * FROM [user].meal WHERE userID = @userID;
        `);

        res.json(result.recordset);  // Sender alle måltider for det givne bruger-ID
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).send('Error fetching meals'); 
    }
};

// Måltidstracker
// Funktion til at opdatere vægten for et måltid
const updateMealWeight = async (req, res) => {
    const { weight } = req.body;
    const { mealID } = req.params;

    if (!weight || isNaN(weight)) {
        return res.status(400).json({ error: 'Invalid weight provided' });  // Validerer at der er skrevet vægt
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
            return res.status(404).json({ message: 'Meal not found' });  // Kontrollerer, om måltidet findes
        }

        res.status(200).json({ message: 'Meal updated successfully', weight: weight });  // Bekræfter at opdateringen lykkedes
    } catch (error) {
        console.error('Server error updating meal:', error);
        res.status(500).json({ error: 'Server error' }); 
    }
};

// Måltidstracker
// Funktion til at slette et måltid
const deleteMeal = async (req, res) => {
    const { mealID } = req.params;
    if (!mealID || isNaN(parseInt(mealID, 10))) {
        return res.status(400).send('Invalid meal ID');  // Validerer at måltids-ID'et er gyldigt
    }

    try {
        const pool = await getDbConnection(); 
        const transaction = new sql.Transaction(pool);

        await transaction.begin();  // Starter en transaktion
        const request = new sql.Request(transaction);
        request.input('mealID', sql.Int, mealID);

        const result = await request.query('DELETE FROM [user].meal WHERE mealID = @mealID;');
        await transaction.commit();  // Bekræfter transaktionen

        if (result.rowsAffected[0] === 0) {
            res.status(404).send('Meal not found');  // Tjekker om måltidet blev fundet
        } else {
            res.send('Meal deleted successfully');  // Bekræfter at måltidet er slettet
        }
    } catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).send('Failed to delete meal');  
    }
};

// Måltidstracker
// Funktion til at registrere vandindtag for en bruger
const logWater = async (req, res) => {
    const { userID } = req.body;

    if (!userID) {
        return res.status(400).json({ error: "Invalid or missing user ID" });  // Validerer at et bruger-ID er angivet
    }

    try {
        const pool = await getDbConnection();  
        const request = pool.request();
        request.input('userID', sql.Int, userID);

        const result = await request.query('INSERT INTO [user].water (userID) VALUES (@userID); SELECT SCOPE_IDENTITY() as insertId');
        const insertId = result.recordset[0].insertId; 

        res.status(201).json({ message: "Water intake logged successfully", id: insertId });  // Bekræfter at vandindtaget er registreret
    } catch (error) {
        console.error('Error logging water intake:', error);
        res.status(500).send('Server error');  
    }
};


module.exports = { getActivity, createActivity, getProfile, createMetabolism, seeEnergi, profile, saveUser, checkProfile, saveChanges, deleteThisProfile, getIngredients, getNutritionalInfo, saveRecipe, getRecipes, getRecipeNutrition, saveMeal, getMealsByUserId, updateMealWeight, deleteMeal, logWater }
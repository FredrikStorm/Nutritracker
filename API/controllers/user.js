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
            .query('INSERT INTO [user].Activities (activityId, activityName, kcal, hours, userId, tidspunkt) VALUES (@activityid, @activityname, @kcal, @hours, @userId, DEFAULT)');
        
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

module.exports = { getActivity, createActivity, getProfile, createMetabolism, seeEnergi, profile }
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
    const { activityid, activityname, totalKcalBurned, hours } = req.body;
    const userId = parseInt(localStorage.getItem('userID'),10);  
    
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
        res.status(500).send('Database error: ' + err.message);
    }
})

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
    try {
        const pool = await getDbConnection();
        const mealsQuery = `
            SELECT 
                DATEPART(hour, time) AS Hour,
                SUM((weight / 100.0) * r.kcal) as TotalKcal
            FROM [user].meal m
            JOIN [user].recipe r ON m.recipeID = r.recipeID
            WHERE m.userID = @userId
            GROUP BY DATEPART(hour, time)
            ORDER BY DATEPART(hour, time)
        `;
        const metabolismQuery = `
            SELECT stofskifte / 24 AS HourlyBurnRate
            FROM [user].metabolism
            WHERE userId = @userId
        `;

        const [mealsResult, metabolismResult] = await Promise.all([
            pool.request().input('userId', sql.Int, parseInt(userId)).query(mealsQuery),
            pool.request().input('userId', sql.Int, parseInt(userId)).query(metabolismQuery)
        ]);

        const hourlyBurnRate = metabolismResult.recordset[0]?.HourlyBurnRate || 0;

        const hourlyData = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            totalKcal: 0,
            hourlyBurn: hourlyBurnRate
        }));

        mealsResult.recordset.forEach(meal => {
            const index = hourlyData.findIndex(h => h.hour === meal.Hour);
            if (index !== -1) {
                hourlyData[index].totalKcal = meal.TotalKcal;
            }
        });

        res.json(hourlyData);
    } catch (err) {
        console.error('Error executing database queries:', err);
        res.status(500).send('Database error: ' + err.message);
    }
};

module.exports = { getActivity, createActivity, getProfile, createMetabolism, seeEnergi }
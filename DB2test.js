require('dotenv').config({ path: './DB.env' });

const sql = require('mssql');

console.log('Database server:', process.env.DB_SERVER);
console.log('Database name:', process.env.DB_DATABASE);
console.log('Database user:', process.env.DB_USER);
console.log('Database password:', process.env.DB_PASSWORD);

async function fetchData() {
    const config = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        database: process.env.DB_DATABASE,
        options: {
            encrypt: true,
            enableArithAbort: true,
            trustServerCertificate: false
        }
    };

    
    try {
        // Koble til databasen
        await sql.connect(config);
        console.log('Connected to the database');

        // SQL-kommando for å hente informasjon fra tabellen "User.Adress"
        const query = `
            SELECT *
            FROM [User].Address;
        `;

        // Utføre spørringen og få resultatene
        const result = await sql.query(query);

        // Skrive ut resultatene
        console.log('Fetched data:', result.recordset);
    } catch (err) {
        console.error('Error fetching data:', err);
    } finally {
        // Lukk tilkoblingen
        await sql.close();
    }
}

fetchData();


// for å lage tabell 
/*
try {
        await sql.connect(config);
        console.log('Connected to the Azure SQL database');

        
        // SQL-kommando for å opprette en tabell
        const createTableSql = `
        CREATE TABLE "users" (
            UserID INT PRIMARY KEY IDENTITY(1,1),
            Username NVARCHAR(50) NOT NULL UNIQUE,
            Email NVARCHAR(100) NOT NULL UNIQUE,
            CreatedDate DATETIME NOT NULL DEFAULT GETDATE()
        );
        
        `;
        await sql.query(createTableSql);
        console.log('Table `User` created successfully');
    } catch (err) {
        console.error('Error while setting up the database:', err);
    } finally {
        await sql.close();
    }
*/
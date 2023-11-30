require("dotenv").config()

const mysql = require('mysql2')

const client = mysql.createPool({
    host: process.env.API_URL,
    user: process.env.DB_USER,
    password: process.env.DB_DATABASE,
    database: process.env.DB_PASSWORD
});

// const client = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'databot_database'
// });

module.exports = client.promise();
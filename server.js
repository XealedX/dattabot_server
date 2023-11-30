require("dotenv").config()

const bodyParser = require('body-parser');
const client = require('./databasepg.js')
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors =require('cors');


const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());


app.get("/", function(req, res) {
    res.send("Welcome to Pokedex Database");
})

app.get("/api", async (req, res) => {
    const result = await client.execute(`SELECT * FROM pokedex_dataset`);
    console.log(result);
    res.json(result);
})

app.get("/pokemon_list", async (req, res) => {
    const last_id = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const result = await client.execute(`Select id, name from pokedex_dataset WHERE id>${last_id} LIMIT ${limit}`);
    console.log(result[0]);
    res.json(result[0]);
    
})

app.get("/pokemon_details", async (req, res) => {
    const pokemon_name = req.query.name;
    console.log(pokemon_name)

    const result = await client.execute(`Select * from pokedex_dataset WHERE name='${pokemon_name}'`);
    console.log(result[0]);
    res.json(result[0]);
})

app.post("/register", bodyParser.json(), async (req, res) => {
    const username = req.body.user;
    const password = req.body.password;

    console.log(req.body);

    const result = await client.execute(`SELECT * FROM users WHERE username = '${username}'`);
        if (result[0].length > 0) {
            console.log('Username already exists');
            res.status(400).send('User already exists');
        } else {
            const check = await client.execute(`INSERT INTO users (username, password) VALUES ('${username}', '${password}');`);
                res.sendStatus(200);       
        }
})



app.post("/login", bodyParser.json(), async (req, res) => {
    const username = req.body.user;
    const password = req.body.pwd;

    console.log(req.body);
  
    const result = await client.execute(`SELECT * FROM users WHERE username = '${username}'`);
        if (result[0].length > 0){
            console.log('Found User')
            const foundUser = result[0]
            console.log(foundUser)
            const foundPassword = foundUser[0].password
            console.log(password)
            console.log(foundPassword)
            const match = password === foundPassword
            console.log(match)
            if (match) {
                    // create JWTs
                const accessToken = jwt.sign(
                    { "username": foundUser.username },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '1d' }
                );
                const refreshToken = jwt.sign(
                    { "username": foundUser.username },
                    process.env.REFRESH_TOKEN_SECRET,
                    { expiresIn: '1d' }
                );
                res.cookie('login_cookie', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 })
                res.json({ 'success': `User ${username} is logged in!` });
            } else {
                res.sendStatus(401).send('Not Match');;
            }
        } else {
            console.log(err.message);
            res.status(401).send('Failed to Authenticate User');
        }
})


app.get('/check-login', (req, res) => {
    const cookies = req.cookies
    console.log(cookies)
    if(cookies && cookies.login_cookie !== undefined){
        res.status(200).json({ message: 'User is logged in' });
    } else {
        res.status(400).json({ message: 'No Cookie Found' });
    }
});

app.get('/remove_cookie', (req, res) => {
    const cookies = req.cookies
    if(cookies && cookies.login_cookie !== undefined){
        res.clearCookie('login_cookie');
        res.sendStatus(200).send('Successfully Loged Out');;
    } else {
        res.status(401).json({ message: 'No Cookie Found' });
    }
});


app.get("/generation", async (req, res) => {
    const gene = await client.execute(`Select generation, COUNT(generation) from pokedex_dataset GROUP BY generation`);

    console.log(gene[0]);
    res.json(gene[0]);
})

app.get("/type", async (req, res) => {
    const type = await client.execute(`Select type_number, COUNT(type_number) from pokedex_dataset GROUP BY type_number`);

    console.log(type[0]);
    res.json(type[0]);
})

app.get("/highscore", async (req, res) => {
    const score = await client.execute(`Select name, total_points from pokedex_dataset order by total_points desc limit 5`);

    console.log(score[0]);
    res.json(score[0]);
})


app.get("/type_name", async (req, res) => {
    const tname = await client.execute(`SELECT type, COUNT(*) AS count
        FROM (
            SELECT type_1 AS type FROM pokedex_dataset WHERE type_1 IS NOT NULL
            UNION ALL
            SELECT type_2 AS type FROM pokedex_dataset WHERE type_2 IS NOT NULL
        ) subquery
        GROUP BY type`);
    console.log(tname[0]);
    res.json(tname[0]);
})


app.listen(5000, () => { console.log ("Server started at port 5000") })

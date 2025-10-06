require('dotenv').config();
var express = require("express");
var app = express();
var { Client } = require("pg");
var cors = require("cors");
const PORT = 3000;
const createTables = require('./tables.js');
const createOrganizerRoutes = require("./endpoints/organizer");


app.use(express.json());
app.use(
    cors({
        origin: (origin, callback) => callback(null, true),
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
        allowedHeaders: "Content-Type,Authorization",
    })
);


const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
});

client.connect(err => {
    if (err) {
        console.log("Error when connecting to database: ", err);
    }
    console.log("Succesfully connected to PostgreSQL database");
    createTables(client);
})

app.use("/organizer", createOrganizerRoutes(client));

app.listen(PORT, (err) => {
    if (err) {
        console.log("Error in server setup: ", err);
    }
    console.log("Successfully connected to port: ", PORT);
})
const express = require("express");
const app = express.Router();

module.exports = (client) => {
    app.get("/", (req, res) => {
        res.send("LOGIN ENDPOINT HIT");
    })

    app.post("/", async (req, res) => {
        const {username, password} = req.body;

        if (!username || !password) {
            res.status(400).json({
                error: "Username and password are required.",
            })
        }

        let queryOrganizerTable = `SELECT *
                                   FROM public."Organizer"
                                   WHERE "Organizer"."organizerUserName" = $1
                                     and "Organizer"."organizerPassword" = $2;`;


        const values = [username, password];

        const response = await client.query(queryOrganizerTable, values);
        if (response.rows.length >= 1) {
            res.status(200).json({
                message: "Successfully retrieved organizer information",
                data: response.rows,
            })
            return;
        }

        let queryStudentTable = `SELECT *
                                FROM public."Student"
                                WHERE "Student"."studentUserName" = $1
                                  and "Student"."studentPassword" = $2;`;

        const studentResponse = await client.query(queryStudentTable, values);
        if (studentResponse.rows.length >= 1) {
            res.status(200).json({
                message: "Successfully retrieved student information",
                data: studentResponse.rows,
            })
            return;
        }

        res.status(200).json({
            message: "No users have the data entered"
        })


    })

    return app;
}

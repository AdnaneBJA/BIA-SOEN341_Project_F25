const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const result = await req.db.query('SELECT DISTINCT "Organization" FROM "Events" WHERE "Organization" IS NOT NULL');
        const organizations = result.rows.map((row, index) => ({
            id: index + 1,
            name: row.Organization
        }));
        res.status(200).json({ organizations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error reading organizations from Events table' });
    }
});


router.post('/', async (req, res) => {
    const { name } = req.body;

    try {
        // Check if the organization already exists
        const check = await req.db.query('SELECT 1 FROM "Events" WHERE "Organization" = $1 LIMIT 1', [name]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Organization already exists' });
        }

        const insertion = await req.db.query(`
            INSERT INTO "Events" (
                "eventName",
                "organizerID",
                "eventType",
                "startTime",
                "endTime",
                "location",
                "maxParticipants",
                "currentParticipants",
                "eventPrices",
                "eventDescription",
                "organizerUserName",
                "Organization"
            )
            VALUES (
                $1, $2, $3, NOW(), NOW(), $4, 0, 0, 0, $5, $6, $7
            )
            RETURNING *;
        `, [
            `[Placeholder Event for ${name}]`,
            1, // organizerID
            'Other', // eventType
            'Auto-generated organization placeholder', // location
            'Automatically created placeholder event', // eventDescription
            'admin', // organizerUserName
            name // Organization
        ]);

        res.status(201).json({
            message: 'Organization created successfully (via placeholder event)',
            organization: { name }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating the organization' });
    }
});


router.put('/:name', async (req, res) => {
    const { name: newName } = req.body;
    const { name: oldName } = req.params;

    try {
        const update = await req.db.query(
            'UPDATE "Events" SET "Organization" = $1 WHERE "Organization" = $2 RETURNING *',
            [newName, oldName]
        );

        if (update.rowCount === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.status(200).json({ message: 'Organization updated successfully', organization: { name: newName } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating the organization' });
    }
});


router.delete('/:name', async (req, res) => {
    const { name } = req.params;

    try {
        const deletion = await req.db.query('DELETE FROM "Events" WHERE "Organization" = $1', [name]);

        if (deletion.rowCount === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.status(200).json({ message: 'Organization and its events deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting the organization' });
    }
});

module.exports = router;


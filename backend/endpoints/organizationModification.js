const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const result = await req.db.query('SELECT * FROM "Organizations" ORDER BY "organizationName" ASC');
        const organizations = result.rows.map(row => ({
            id: row.organizationID,
            name: row.organizationName,
            description: row.description || '',
            createdAt: row.createdAt ? new Date(row.createdAt).toISOString().slice(0, 19).replace('T', ' ') : null
        }));
        res.status(200).json({ organizations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error reading organizations' });
    }
});


router.post('/', async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Organization name is required' });
    }

    try {
        const insertion = await req.db.query(`
            INSERT INTO "Organizations" ("organizationName", "description")
            VALUES ($1, $2)
            RETURNING *;
        `, [name, description || '']);

        res.status(201).json({
            message: 'Organization created successfully',
            organization: {
                id: insertion.rows[0].organizationID,
                name: insertion.rows[0].organizationName,
                description: insertion.rows[0].description
            }
        });

    } catch (error) {
        console.error(error);
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Organization already exists' });
        }
        res.status(500).json({ error: 'Error creating the organization' });
    }
});


router.put('/:name', async (req, res) => {
    const { name: newName, description } = req.body;
    const { name: oldName } = req.params;

    try {
        const update = await req.db.query(
            'UPDATE "Organizations" SET "organizationName" = $1, "description" = $2 WHERE "organizationName" = $3 RETURNING *',
            [newName, description || '', oldName]
        );

        if (update.rowCount === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.status(200).json({
            message: 'Organization updated successfully',
            organization: {
                name: update.rows[0].organizationName,
                description: update.rows[0].description
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating the organization' });
    }
});


router.delete('/:name', async (req, res) => {
    const { name } = req.params;

    try {
        const deletion = await req.db.query('DELETE FROM "Organizations" WHERE "organizationName" = $1', [name]);

        if (deletion.rowCount === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.status(200).json({ message: 'Organization deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting the organization' });
    }
});

module.exports = router;

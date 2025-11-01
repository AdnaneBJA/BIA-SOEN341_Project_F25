const express = require('express');
const router = express.Router();


router.post('/assign', async (req, res) => {
  let { userId, newRole } = req.body; 

  newRole = newRole.toLowerCase();
  
  try {
    if (newRole !== 'organizer') {
      // If the user is an organizer with events, we can't remove them. So we check first.
      const eventsCheck = await req.db.query(
        'SELECT * FROM "Events" WHERE "organizerID" = $1',
        [userId]
      );
      if (eventsCheck.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot remove organizer role: user still has assigned events.' 
        });
      }
    }

    //remove them from the role
    await req.db.query('DELETE FROM "Admin" WHERE "adminID" = $1', [userId]);
    await req.db.query('DELETE FROM "Organizer" WHERE "organizerID" = $1', [userId]);
    await req.db.query('DELETE FROM "Student" WHERE "studentID" = $1', [userId]);

    //enter them in their new role
    let tableName;
    if (newRole === 'admin') tableName = '"Admin"';
    else if (newRole === 'organizer') tableName = '"Organizer"';
    else if (newRole === 'student') tableName = '"Student"';

    await req.db.query(`INSERT INTO ${tableName} ("${newRole}ID", "${newRole}UserName", "${newRole}Password") VALUES ($1, $2, $3)`,
    [userId, req.body.username, req.body.password] 
    );

    res.status(200).json({ message: `User ${userId} is now a ${newRole}` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
});

//----------------------- REVOKING A ROLE------------------------//
router.delete('/revoke/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if organizer with events
    const eventsCheck = await req.db.query(
      'SELECT * FROM "Events" WHERE "organizerID" = $1',
      [userId]
    );
    if (eventsCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot revoke organizer role: user still has assigned events.' 
      });
    }

    // Remove user from all roles
    await req.db.query('DELETE FROM "Admin" WHERE "adminID" = $1', [userId]);
    await req.db.query('DELETE FROM "Organizer" WHERE "organizerID" = $1', [userId]);
    await req.db.query('DELETE FROM "Student" WHERE "studentID" = $1', [userId]);

    res.status(200).json({ message: `All roles revoked for user ${userId}` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to revoke role' });
  }
});



router.get('/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const result = await req.db.query('SELECT * FROM "UserRoles" WHERE "username" = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User has no assigned role.' });
    }

    res.status(200).json({ role: result.rows[0].role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching user role.' });
  }
});

module.exports = router;




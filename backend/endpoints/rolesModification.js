const express = require('express');
const router = express.Router();


router.post('/assign', async (req, res) => {
  let { userId, newRole } = req.body;

  newRole = newRole.toLowerCase();

  try {
    // Define table mappings
    const roleMappings = {
      'admin': { table: '"Admin"', idCol: '"adminID"', userCol: '"adminUserName"', passCol: '"adminPassword"' },
      'organizer': { table: '"Organizer"', idCol: '"organizerID"', userCol: '"organizerUserName"', passCol: '"organizerPassword"' },
      'student': { table: '"Student"', idCol: '"studentID"', userCol: '"studentUserName"', passCol: '"studentPassword"' }
    };

    if (!roleMappings[newRole]) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const targetRole = roleMappings[newRole];

    // Check if user exists in other role tables and get their credentials
    let sourceRole = null;
    let sourceUsername = null;
    let sourcePassword = null;
    let sourceRoleName = null;

    for (const [roleName, roleData] of Object.entries(roleMappings)) {
      const checkInRole = await req.db.query(
        `SELECT ${roleData.idCol}, ${roleData.userCol}, ${roleData.passCol} FROM ${roleData.table} WHERE ${roleData.idCol} = $1`,
        [userId]
      );

      if (checkInRole.rows.length > 0) {
        // User found in this role table
        if (roleName === newRole) {
          // User already has the target role
          return res.status(400).json({
            error: `User with ID ${userId} already exists as a ${newRole}`
          });
        } else {
          // User found in a different role table - prepare for conversion
          sourceRole = roleData;
          sourceRoleName = roleName;
          const row = checkInRole.rows[0];

          // Debug: Log all available keys in the row object
          console.log('Available keys in row:', Object.keys(row));
          console.log('Full row data:', row);

          // PostgreSQL returns column names in lowercase by default
          // We need to find the actual keys in the returned object
          const allKeys = Object.keys(row);

          // Find username and password keys (they should be lowercase versions)
          const usernameKey = allKeys.find(k => k.toLowerCase().includes('username'));
          const passwordKey = allKeys.find(k => k.toLowerCase().includes('password'));

          if (!usernameKey || !passwordKey) {
            console.error('Could not find username/password keys in row:', allKeys);
            return res.status(500).json({ error: 'Database schema mismatch' });
          }

          sourceUsername = row[usernameKey];
          sourcePassword = row[passwordKey];

          console.log(`Converting user from ${roleName}:`, {
            userId,
            sourceUsername,
            sourcePassword,
            usernameKey,
            passwordKey
          });
          break;
        }
      }
    }

    if (!sourceRole) {
      return res.status(404).json({
        error: `User with ID ${userId} not found in any role table. Please create the user first.`
      });
    }

    // Insert into the target role table with the source credentials
    await req.db.query(
      `INSERT INTO ${targetRole.table} (${targetRole.idCol}, ${targetRole.userCol}, ${targetRole.passCol}) VALUES ($1, $2, $3)`,
      [userId, sourceUsername, sourcePassword]
    );

    // Delete from source role table (converting the user)
    await req.db.query(
      `DELETE FROM ${sourceRole.table} WHERE ${sourceRole.idCol} = $1`,
      [userId]
    );

    res.status(200).json({
      message: `${sourceRoleName.charAt(0).toUpperCase() + sourceRoleName.slice(1)} with ID ${userId} successfully became a ${newRole}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to assign role: ' + error.message });
  }
});

//----------------------- REVOKING A ROLE------------------------//
router.delete('/revoke/:userId', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.query; // Get the specific role to revoke from query params

  if (!role) {
    return res.status(400).json({ error: 'Role parameter is required' });
  }

  const roleNormalized = role.toLowerCase();

  try {
    let tableName, idColumn;

    if (roleNormalized === 'admin') {
      tableName = '"Admin"';
      idColumn = '"adminID"';
    } else if (roleNormalized === 'organizer') {
      tableName = '"Organizer"';
      idColumn = '"organizerID"';

      // Check if organizer has events
      const eventsCheck = await req.db.query(
        'SELECT * FROM "Events" WHERE "organizerID" = $1',
        [userId]
      );
      if (eventsCheck.rows.length > 0) {
        return res.status(400).json({
          error: 'Cannot revoke organizer role: user still has assigned events.'
        });
      }
    } else if (roleNormalized === 'student') {
      tableName = '"Student"';
      idColumn = '"studentID"';
    } else {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if user exists in the specified role table
    const existsCheck = await req.db.query(
      `SELECT ${idColumn} FROM ${tableName} WHERE ${idColumn} = $1`,
      [userId]
    );

    if (existsCheck.rows.length === 0) {
      return res.status(404).json({
        error: `User with ID ${userId} not found in ${role} table`
      });
    }

    // Delete only from the specified role table
    await req.db.query(`DELETE FROM ${tableName} WHERE ${idColumn} = $1`, [userId]);

    res.status(200).json({ message: `${role} role revoked for user ID ${userId}` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to revoke role: ' + error.message });
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

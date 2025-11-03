const express = require('express');
const router = express.Router();

const roleMappings = {
  admin: { table: '"Admin"', idCol: '"adminID"', userCol: '"adminUserName"', passCol: '"adminPassword"' },
  organizer: { table: '"Organizer"', idCol: '"organizerID"', userCol: '"organizerUserName"', passCol: '"organizerPassword"' },
  student: { table: '"Student"', idCol: '"studentID"', userCol: '"studentUserName"', passCol: '"studentPassword"' }
};

function oppositeRole(role) {
  const r = String(role || '').toLowerCase();
  if (r === 'student') return 'organizer';
  if (r === 'organizer') return 'student';
  return null;
}

router.post('/assign', async (req, res) => {
  // Contract: selected role in UI is the CURRENT role; convert to the opposite (Student <-> Organizer)
  let { userId, currentRole, newRole } = req.body;

  try {
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    let targetRoleKey;
    let sourceRoleKey;

    if (newRole) {
      targetRoleKey = String(newRole).toLowerCase();
      if (!['student','organizer'].includes(targetRoleKey)) {
        return res.status(400).json({ error: 'Only Student/Organizer conversion is supported.' });
      }
      const maybeSourceA = targetRoleKey === 'student' ? 'organizer' : 'student';
      const srcProbe = await req.db.query(`SELECT 1 FROM ${roleMappings[maybeSourceA].table} WHERE ${roleMappings[maybeSourceA].idCol} = $1`, [userId]);
      if (srcProbe.rows.length === 0) {
        return res.status(404).json({ error: `${maybeSourceA.charAt(0).toUpperCase()+maybeSourceA.slice(1)} with ID ${userId} was not found.` });
      }
      sourceRoleKey = maybeSourceA;
    } else {
      sourceRoleKey = String(currentRole || '').toLowerCase();
      if (!['student','organizer'].includes(sourceRoleKey)) {
        return res.status(400).json({ error: 'Select current role as Student or Organizer to convert.' });
      }
      targetRoleKey = sourceRoleKey === 'student' ? 'organizer' : 'student';
    }

    const sourceRole = roleMappings[sourceRoleKey];
    const targetRole = roleMappings[targetRoleKey];

    const src = await req.db.query(
      `SELECT ${sourceRole.idCol} AS id, ${sourceRole.userCol} AS username, ${sourceRole.passCol} AS password FROM ${sourceRole.table} WHERE ${sourceRole.idCol} = $1`,
      [userId]
    );
    if (src.rows.length === 0) {
      return res.status(404).json({ error: `${sourceRoleKey.charAt(0).toUpperCase()+sourceRoleKey.slice(1)} with ID ${userId} was not found.` });
    }
    const { username, password } = src.rows[0];

    if (sourceRoleKey === 'organizer') {
      const eventsCheck = await req.db.query('SELECT 1 FROM "Events" WHERE "organizerID" = $1 LIMIT 1', [userId]);
      if (eventsCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Cannot convert Organizer who still has assigned events.' });
      }
    }

    const tgtUsernameExists = await req.db.query(
      `SELECT 1 FROM ${targetRole.table} WHERE ${targetRole.userCol} = $1`,
      [username]
    );
    if (tgtUsernameExists.rows.length > 0) {
      return res.status(400).json({ error: `Cannot convert because username "${username}" already exists in ${targetRoleKey} table.` });
    }

    // Insert into target with same credentials, let ID be generated
    const insertRes = await req.db.query(
      `INSERT INTO ${targetRole.table} (${targetRole.userCol}, ${targetRole.passCol}) VALUES ($1, $2) RETURNING ${targetRole.idCol} AS id`,
      [username, password]
    );
    const newId = insertRes.rows[0]?.id;

    // Remove from source
    await req.db.query(`DELETE FROM ${sourceRole.table} WHERE ${sourceRole.idCol} = $1`, [userId]);

    return res.status(200).json({
      message: `${sourceRoleKey.charAt(0).toUpperCase()+sourceRoleKey.slice(1)} with ID ${userId} successfully became a ${targetRoleKey} with new ID ${newId}`,
      newId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to assign role: ' + error.message });
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
        'SELECT 1 FROM "Events" WHERE "organizerID" = $1 LIMIT 1',
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

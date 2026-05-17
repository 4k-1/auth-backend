const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function getAll(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, first_name, last_name, email, role, is_verified, created_at, updated_at FROM accounts ORDER BY created_at DESC'
    );
    res.json(rows.map(formatAccount));
  } catch (error) {
    console.error('GetAll error:', error);
    res.status(500).json({ message: 'Failed to fetch accounts' });
  }
}

async function getById(req, res) {
  try {
    const requestedId = parseInt(req.params.id);

    // Users can only view their own profile; Admins can view any
    if (req.user.role !== 'Admin' && req.user.id !== requestedId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const [rows] = await pool.execute(
      'SELECT id, first_name, last_name, email, role, is_verified, created_at, updated_at FROM accounts WHERE id = ?',
      [requestedId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(formatAccount(rows[0]));
  } catch (error) {
    console.error('GetById error:', error);
    res.status(500).json({ message: 'Failed to fetch account' });
  }
}

async function create(req, res) {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const [existing] = await pool.execute('SELECT id FROM accounts WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO accounts (first_name, last_name, email, password_hash, role, is_verified)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [firstName, lastName, email, passwordHash, role || 'User']
    );

    res.status(201).json({ message: 'Account created', id: result.insertId });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ message: 'Failed to create account' });
  }
}

async function update(req, res) {
  try {
    const requestedId = parseInt(req.params.id);

    if (req.user.role !== 'Admin' && req.user.id !== requestedId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const [rows] = await pool.execute('SELECT * FROM accounts WHERE id = ?', [requestedId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const { firstName, lastName, email, password, role } = req.body;
    const account = rows[0];

    let passwordHash = account.password_hash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Only Admin can change roles
    const updatedRole = req.user.role === 'Admin' && role ? role : account.role;

    await pool.execute(
      `UPDATE accounts SET first_name = ?, last_name = ?, email = ?, password_hash = ?, role = ?, updated_at = NOW() WHERE id = ?`,
      [firstName || account.first_name, lastName || account.last_name, email || account.email, passwordHash, updatedRole, requestedId]
    );

    res.json({ message: 'Account updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Failed to update account' });
  }
}

async function deleteAccount(req, res) {
  try {
    const requestedId = parseInt(req.params.id);

    const [rows] = await pool.execute('SELECT id FROM accounts WHERE id = ?', [requestedId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await pool.execute('DELETE FROM accounts WHERE id = ?', [requestedId]);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
}

function formatAccount(a) {
  return {
    id: a.id,
    firstName: a.first_name,
    lastName: a.last_name,
    email: a.email,
    role: a.role,
    isVerified: a.is_verified === 1 || a.is_verified === true,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

module.exports = { getAll, getById, create, update, deleteAccount };

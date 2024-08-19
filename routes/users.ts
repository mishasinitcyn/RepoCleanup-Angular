import express from 'express';
import { pool } from '../db';

const router = express.Router();

router.post('/', async (req, res) => {
  const { ID, username, email } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO Users (ID, username, email) VALUES ($1, $2, $3) ON CONFLICT (ID) DO UPDATE SET username = $2, email = $3 RETURNING *',
      [ID, username, email]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

export const usersRouter = router;
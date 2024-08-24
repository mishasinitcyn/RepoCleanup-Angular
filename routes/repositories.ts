import express from 'express';
import { pool } from '../db';

const router = express.Router();

// Add repository-related routes here
// For example:
// router.get('/:id', async (req, res) => { ... });
// router.post('/', async (req, res) => { ... });

export const repositoriesRouter = router;
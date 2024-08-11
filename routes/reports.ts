import express from 'express';
import { pool } from '../db';

const router = express.Router();

router.get('/:id', async (req, res) => {
  const reportId = parseInt(req.params.id);
  if (isNaN(reportId)) {
    return res.status(400).json({ error: 'Invalid report ID' });
  }

  try {
    const query = `
      SELECT * from reports WHERE reportID = $1;
    `;
    const result = await pool.query(query, [reportId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];
    return res.json({
      reportid: report.reportid,
      creatorid: report.creatorid,
      datecreated: report.datecreated,
      isopen: report.isopen,
      repoid: report.repoid,
      repoadmingithubid: report.repoadmingithubid,
      reportcontent: report.reportcontent
    });
  } catch (err) {
    console.error('Error fetching report:', err);
    return res.status(500).json({ error: 'An error occurred while fetching the report' });
  }
});


router.post('/', async (req, res) => {
  const { creatorGithubID, repoID, repoAdminGithubID, reportContent } = req.body;
  if (!creatorGithubID || !repoID || !repoAdminGithubID || !reportContent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const query = `
      INSERT INTO Reports (creatorID, repoID, repoOwnerID, reportContent)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (creatorID, repoID, isOpen)
      DO UPDATE SET
        reportContent = EXCLUDED.reportContent,
        dateCreated = CURRENT_TIMESTAMP
      RETURNING reportID;
    `;
    const values = [creatorGithubID, repoID, repoAdminGithubID, reportContent];
    
    const result = await pool.query(query, values);
    const reportID = result.rows[0].reportid;
    return res.status(201).json({ message: 'Report saved successfully', reportID });
  } catch (err) {
    console.error('Error saving report:', err);
    return res.status(500).json({ error: 'An error occurred while saving the report' });
  }
});

export const reportsRouter = router;
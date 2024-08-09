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

export const reportsRouter = router;
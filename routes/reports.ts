import express from 'express';
import { pool } from '../db';
import { QueryResult } from 'pg';

const router = express.Router();

interface ReportResponse {
  reportid: Number;
  creatorid: String;
  datecreated: Date;
  isopen: Boolean;
  repoid: String;
  repoownerid: String;
  flaggedissues: any;
}

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
      return res.status(204).json({ error: 'Report not found' });
    }

    const report = result.rows[0];

    const response: ReportResponse = {
      reportid: report.reportid,
      creatorid: report.creatorid,
      datecreated: report.datecreated,
      isopen: report.isopen,
      repoid: report.repoid,
      repoownerid: report.repoownerid,
      flaggedissues: report.flaggedissues
    };
    return res.json(response);
  } catch (err) {
    console.error('Error fetching report:', err);
    return res.status(500).json({ error: 'An error occurred while fetching the report' });
  }
});

router.get('/open/:creatorID/:repoID', async (req, res) => {
  const { creatorID, repoID } = req.params;
  if (!creatorID || !repoID) {
    return res.status(400).json({ error: 'Missing required query parameters: creatorID and repoID' });
  }

  try {
    const query = `
      SELECT * FROM reports 
      WHERE creatorID = $1 AND repoID = $2 AND isOpen = true;
    `;

    const result = await pool.query(query, [creatorID, repoID]);

    if (result.rows.length === 0) {
      return res.status(204).send();
    }

    const report = result.rows[0];

    const response: ReportResponse = {
      reportid: report.reportid,
      creatorid: report.creatorid,
      datecreated: report.datecreated,
      isopen: report.isopen,
      repoid: report.repoid,
      repoownerid: report.repoownerid,
      flaggedissues: report.flaggedissues
    };

    return res.json(response);
  } catch (err) {
    console.error('Error fetching open report:', err);
    return res.status(500).json({ error: 'An error occurred while fetching the open report' });
  }
});

router.post('/', async (req, res) => {
  const { creatorID, repoID, repoOwnerID, flaggedissues } = req.body;
  if (!creatorID || !repoID || !repoOwnerID || !flaggedissues) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const query = `
      INSERT INTO Reports (creatorID, repoID, repoOwnerID, flaggedissues)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (creatorID, repoID, isOpen)
      DO UPDATE SET
        flaggedissues = EXCLUDED.flaggedissues,
        dateCreated = CURRENT_TIMESTAMP
      RETURNING reportID;
    `;
    const values = [creatorID, repoID, repoOwnerID, flaggedissues];
    
    const result = await pool.query(query, values);
    const reportID = result.rows[0].reportid;
    return res.status(201).json({ message: 'Report saved successfully', reportID });
  } catch (err) {
    console.error('Error saving report:', err);
    return res.status(500).json({ error: 'An error occurred while saving the report' });
  }
});

router.delete('/:creatorID/:repoID', async (req, res) => {
  const { creatorID, repoID } = req.params;
  if (!creatorID || !repoID) {
    return res.status(400).json({ error: 'Missing required parameters: creatorID and repoID' });
  }

  try {
    const query = `
      DELETE FROM Reports 
      WHERE creatorID = $1 AND repoID = $2 AND isOpen = true
      RETURNING reportID;
    `;
    const result: QueryResult = await pool.query(query, [creatorID, repoID]);

    if (result.rowCount === 0) {
      return res.status(204).send();
    }

    const deletedReportID = result.rows[0].reportid;
    return res.json({ message: 'Report deleted successfully', deletedReportID });
  } catch (err) {
    console.error('Error deleting report:', err);
    return res.status(500).json({ error: 'An error occurred while deleting the report' });
  }
});

export const reportsRouter = router;
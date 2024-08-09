import express from 'express';
import axios from 'axios';
import { Octokit } from '@octokit/rest';
import { environment } from '../src/environments/environment';

const router = express.Router();

router.post('/callback', async (req, res) => {
  const { code } = req.body;
  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: environment.githubClientId,
      client_secret: environment.githubClientSecret,
      code,
    }, {
      headers: {
        Accept: 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

router.get('/issues/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      per_page: token ? 30 : 10,
      state: 'open'
    });

    res.json(data);
  } catch (error: any) {
    console.error('GitHub API error:', error);
    res.status(error.status || 500).json({ error: 'Failed to fetch issues' });
  }
});

export const githubRouter = router;
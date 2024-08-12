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
    const octokit = new Octokit({ auth: response.data.access_token });
    const { data: userData } = await octokit.users.getAuthenticated();

    // Save user to database
    const saveUserResponse = await axios.post(`${environment.apiUrl}/users`, {
      ID: userData.id.toString(),
      username: userData.login,
      email: userData.email
    });

    res.json({ 
      access_token: response.data.access_token,
      user: saveUserResponse.data 
    });
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

router.get('/:owner/:repo/issues', async (req, res) => {
  const { owner, repo } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    const octokit = new Octokit({ auth: token });
    
    // Fetch repository information
    const { data: repoMetadata } = await octokit.repos.get({ owner, repo });
    
    // Fetch issues
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      per_page: token ? 30 : 10,
      state: 'open'
    });

    res.json({
      repoMetadata: repoMetadata,
      issues: issues
    });
  } catch (error: any) {
    console.error('GitHub API error:', error);
    res.status(error.status || 500).json({ error: 'Failed to fetch issues' });
  }
});

router.get('/:repoid/issues', async (req, res) => {
  const { repoid } = req.params;
  const { numbers } = req.query;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!numbers) {
    return res.status(400).json({ error: 'Issue IDs are required' });
  }
  if (!repoid) {
    return res.status(400).json({ error: 'Repo ID required' });
  }

  try {
    const issueNumbersArray = (numbers as string).split(',');
    const issues = await Promise.all(
      issueNumbersArray.map(issueNumber => 
        axios.get(`https://api.github.com/repositories/${repoid}/issues/${issueNumber}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': "application/vnd.github+json",
          }
        }).then(response => response.data)
      )
    );
    return res.json(issues);
  } catch (error: any) {
    console.error('GitHub API error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ error: 'Failed to fetch issues' });
  }
});

export const githubRouter = router;
import express from 'express';
import axios from 'axios';
import { Octokit } from '@octokit/rest';
import { environment } from '../src/environments/environment';
import { createOAuthAppAuth } from "@octokit/auth-oauth-app";

const router = express.Router();

router.get('/:owner/:repo/metadata', async (req, res) => {
  const { owner, repo } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    let octokit;
    
    if (token) {
      octokit = new Octokit({ auth: token });
    } else {
      octokit = new Octokit({
        auth: {
          clientId: environment.githubClientId,
          clientSecret: environment.githubClientSecret,
        },
        authStrategy: createOAuthAppAuth,
      });
    }
    
    const { data: repoMetadata } = await octokit.repos.get({ owner, repo });

    res.json(repoMetadata);
  } catch (error: any) {
    console.error('GitHub API error:', error);
    res.status(error.status || 500).json({ error: 'Failed to fetch repository metadata' });
  }
});

router.get('/:repoid/metadata', async (req, res) => {
  const { repoid } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!repoid) return res.status(400).json({ error: 'Repo ID required' });

  try {
    let octokit;
    if (token) {
      octokit = new Octokit({ auth: token });
    } else {
      octokit = new Octokit({
        auth: {
          clientId: environment.githubClientId,
          clientSecret: environment.githubClientSecret,
        },
        authStrategy: createOAuthAppAuth,
      });
    }

    const { data: repoMetadata } = await octokit.request('GET /repositories/{repo_id}', {
      repo_id: repoid
    });
    return res.json(repoMetadata);
  } catch (error: any) {
    console.error('GitHub API error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ error: 'Failed to fetch repository metadata' });
  }
});

router.get('/:owner/:repo/issues', async (req, res) => {
  const { owner, repo } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    let octokit;
    
    if (token) {
      octokit = new Octokit({ auth: token });
    } else {
      octokit = new Octokit({
        auth: {
          clientId: environment.githubClientId,
          clientSecret: environment.githubClientSecret,
        },
        authStrategy: createOAuthAppAuth,
      });
    }
    
    const { data: issues } = await octokit.issues.listForRepo({owner, repo, per_page: token ? 30 : 10, state: 'open'});
    return res.json(issues);
  } catch (error: any) {
    console.error('GitHub API error:', error);
    return res.status(error.status || 500).json({ error: 'Failed to fetch issues' });
  }
});

router.get('/:owner/:repo/issues/numbers', async (req, res) => {
  const { owner, repo } = req.params;
  const { numbers } = req.query;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!numbers) return res.status(400).json({ error: 'Issue numbers are required' });

  try {
    const issueNumbersArray = (numbers as string).split(',');
    let octokit;
    if (token) {
      octokit = new Octokit({ auth: token });
    } else {
      octokit = new Octokit({
        auth: {
          clientId: environment.githubClientId,
          clientSecret: environment.githubClientSecret,
        },
        authStrategy: createOAuthAppAuth,
      });
    }

    const issues = await Promise.all(
      issueNumbersArray.map(issueNumber => 
        octokit.issues.get({owner,repo, issue_number: parseInt(issueNumber)}).then(
          response => response.data
        )
      )
    );
    return res.json(issues);
  } catch (error: any) {
    console.error('GitHub API error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ error: 'Failed to fetch issues' });
  }
});

router.post('/:owner/:repo/issues/:issue_number/lock', async (req, res) => {
  const { owner, repo, issue_number } = req.params;
  const { lock_reason } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const octokit = new Octokit({ auth: token });

    await octokit.issues.lock({
      owner,
      repo,
      issue_number: parseInt(issue_number),
      lock_reason
    });

    return res.status(200).json({ message: 'Issue locked successfully' });
  } catch (error: any) {
    console.error('GitHub API error:', error);
    return res.status(error.status || 500).json({ error: 'Failed to lock issue' });
  }
});

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

    return res.json({ 
      access_token: response.data.access_token,
      user: saveUserResponse.data 
    });
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return res.status(500).json({ error: 'Failed to authenticate' });
  }
});

export const githubRouter = router;
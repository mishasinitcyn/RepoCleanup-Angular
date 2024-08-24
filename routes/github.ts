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

router.put('/:owner/:repo/issues/:issue_number/lock', async (req, res) => {
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

router.patch('/:owner/:repo/issues/:issue_number', async (req, res) => {
  const { owner, repo, issue_number } = req.params;
  const { state } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const octokit = new Octokit({ auth: token });

    await octokit.issues.update({
      owner,
      repo,
      issue_number: parseInt(issue_number),
      state
    });

    return res.status(200).json({ message: 'Issue updated successfully' });
  } catch (error: any) {
    console.error('GitHub API error:', error);
    return res.status(error.status || 500).json({ error: 'Failed to update issue' });
  }
});

router.post('/:owner/:repo/labels', async (req, res) => {
  const { owner, repo } = req.params;
  const { name, color, description } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const octokit = new Octokit({ auth: token });

    await octokit.issues.createLabel({
      owner,
      repo,
      name,
      color,
      description
    });

    return res.status(201).json({ message: 'Label created successfully' });
  } catch (error: any) {
    if (error.status === 422) {
      // Label already exists, we can ignore this error
      return res.status(200).json({ message: 'Label already exists' });
    }
    console.error('GitHub API error:', error);
    return res.status(error.status || 500).json({ error: 'Failed to create label' });
  }
});

router.post('/:owner/:repo/issues/:issue_number/labels', async (req, res) => {
  const { owner, repo, issue_number } = req.params;
  const { labels } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const octokit = new Octokit({ auth: token });

    await octokit.issues.addLabels({
      owner,
      repo,
      issue_number: parseInt(issue_number),
      labels
    });

    return res.status(200).json({ message: 'Labels added successfully' });
  } catch (error: any) {
    console.error('GitHub API error:', error);
    return res.status(error.status || 500).json({ error: 'Failed to add labels' });
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

router.put('/:org/block/:username', async (req, res) => {
  const { org, username } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const octokit = new Octokit({ auth: token });

    await octokit.rest.orgs.blockUser({
      org,
      username,
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error('GitHub API error:', error);
    if (error.status === 422) {
      return res.status(422).json({ error: 'Unable to block the user' });
    }
    return res.status(error.status || 500).json({ error: 'Failed to block user' });
  }
});

router.delete('/:org/block/:username', async (req, res) => {
  const { org, username } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const octokit = new Octokit({ auth: token });

    await octokit.rest.orgs.unblockUser({
      org,
      username,
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error('GitHub API error:', error);
    return res.status(error.status || 500).json({ error: 'Failed to unblock user' });
  }
});




router.post('/:owner/:repo/secure-main-branch', async (req, res) => {
  const { owner, repo } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const octokit = new Octokit({ auth: token });

    await octokit.repos.updateBranchProtection({
      owner,
      repo,
      branch: 'main',
      required_status_checks: null,
      enforce_admins: true,
      restrictions: null,
      required_pull_request_reviews: null,
      required_linear_history: true,
      allow_force_pushes: false,
      allow_deletions: false,
    });

    return res.status(200).json({ message: 'Main branch secured successfully' });
  } catch (error: any) {
    console.error('GitHub API error:', error);
    return res.status(error.status || 500).json({ error: 'Failed to secure main branch' });
  }
});

router.post('/:owner/:repo/require-pr-approvals', async (req, res) => {
  const { owner, repo } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const octokit = new Octokit({ auth: token });

    await octokit.repos.updateBranchProtection({
      owner,
      repo,
      branch: 'main',
      required_status_checks: null,
      enforce_admins: true,
      restrictions: null,
      required_pull_request_reviews: {
        dismissal_restrictions: {},
        dismiss_stale_reviews: true,
        require_code_owner_reviews: false,
        required_approving_review_count: 2,
      },
    });

    return res.status(200).json({ message: 'PR approval rule set successfully' });
  } catch (error: any) {
    console.error('GitHub API error:', error);
    return res.status(error.status || 500).json({ error: 'Failed to set PR approval rule' });
  }
});

router.post('/:owner/:repo/add-templates', async (req, res) => {
  const { owner, repo } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const octokit = new Octokit({ auth: token });

    const issueTemplate = `
# Issue Title

## Description
[Provide a brief description of the issue]

## Steps to Reproduce
1. [First Step]
2. [Second Step]
3. [and so on...]

## Expected Behavior
[What you expect to happen]

## Actual Behavior
[What actually happens]

## Additional Information
[Any additional information, configuration or data that might be necessary to reproduce the issue]
    `;

    const prTemplate = `
# Pull Request Title

## Description
[Provide a brief description of the changes in this PR]

## Related Issue
[If applicable, link to the issue this PR addresses]

## Proposed Changes
- [Change 1]
- [Change 2]
- [Change 3]

## Additional Information
[Any additional information or context about the changes]

## Checklist
- [ ] Tests
- [ ] Documentation
- [ ] [Any other relevant checklist items]
    `;

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: '.github/ISSUE_TEMPLATE.md',
      message: 'Add issue template',
      content: Buffer.from(issueTemplate).toString('base64'),
    });

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: '.github/PULL_REQUEST_TEMPLATE.md',
      message: 'Add pull request template',
      content: Buffer.from(prTemplate).toString('base64'),
    });

    return res.status(200).json({ message: 'Templates added successfully' });
  } catch (error: any) {
    console.error('GitHub API error:', error);
    return res.status(error.status || 500).json({ error: 'Failed to add templates' });
  }
});

export const githubRouter = router;
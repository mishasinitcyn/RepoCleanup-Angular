import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { environment } from './src/environments/environment';
import AppServerModule from './src/main.server';
import axios from 'axios';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';

dotenv.config();

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);
  server.use(express.json());

  // GitHub OAuth callback endpoint
  server.post('/api/github/callback', async (req, res) => {
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

  // GitHub API proxy (now using Octokit)
  server.get('/api/github/issues/:owner/:repo', async (req, res) => {
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

  // Proxy requests to FastAPI backend
  server.use('/api', createProxyMiddleware({
    target: environment.fastApiUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/api/classify_spam': '/classify_spam',
      '^/api/issues': '/issues'
    }
  }));

  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap: AppServerModule,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = 3000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
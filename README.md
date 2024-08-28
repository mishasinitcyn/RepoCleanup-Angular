# RepoCleanup
<p float="left">
  <a href='https://www.youtube.com/watch?v=yNBtKRospZs&t=2s'><img src='https://github.com/user-attachments/assets/aebf62c8-2f4d-4ba8-a210-e92a1379281a' width=40px></a>
  <a href='https://medium.com/@msa242/repocleanup-d54c50d79b99'><img src='https://www.svgrepo.com/show/394277/medium.svg' width=40px></a>
</p>

## What is RepoCleanup?
RepoCleanup is an open-source Github administration platform that allows developers to remove spam issues/pull-requests from repositories, and add repository rules.

## What problem does it solve?
Popular open-source projects on GitHub are polluted with spam issues submitted by users farming for engagement. Even helpful issues are often posted without a relevant tag/label like "bug", "feature", "discussion", etc.

# Implementation
RepoCleanup is implemented on top of my PECAN template (Postgres, Express, Coolify, Angular, Node). It comes configured with all the files necessary for deployment and local development, including Dockerfile, docker-compose, dockerignore, environment files, Express server, Postgres database, and UI library.

## Angular Frontend
In my experience, Angular scales elegantly for medium-large applications due to the Model-View-Controller architecture. I personally prefer it to React which couples HTML and JavaScript into jsx files, degrading readability with scale.

## Express Backend
The backend is implemented in Express, with routes separated into TypeScript files for modularity. The main advantages of using Express over a Python framework like Django or Flask are that it's natively integrated with Angular and (by virtue of being a Typescript framework) it makes working with JSON data and async API calls significantly easier.

## Postgres Database
This is a standard relational database implemented in PostgreSQL, with the twist of storing unstructured data in JSONB format. Users and repositories are uniquely identified by their Github id and reports by a serializable id. Additionally, a uniqueness constraint on the Reports table ensures that a user can have only one consecutive report open for a given repository, preventing version conflicts.
```SQL
CREATE TABLE IF NOT EXISTS Users (
    ID VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    cleanupScore INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Reports (
    reportID SERIAL PRIMARY KEY,
    creatorID VARCHAR(255) REFERENCES Users(ID),
    dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isOpen BOOLEAN DEFAULT TRUE,
    repoID VARCHAR(255) NOT NULL,
    repoOwnerID VARCHAR(255) NOT NULL,
    flaggedIssues JSONB
);

CREATE UNIQUE INDEX unique_open_report ON Reports (creatorID, repoID) WHERE isOpen = TRUE;
```

## Hosting on Coolify
Rather than deploying on the cloud, I bought a Lenovo TS150 server on Facebook Marketplace for $400CAD and installed Coolify on it. This made deployment incredibly easy because the application is built according to my Dockerfile and linked directly to my domain with automatically configured Caddy reverse proxy and SSL. As soon as my website was live I donated $100 to the Coolify project.

## Future Work
When I initially started this project, I posted an invitation on Discord as part of a developer community event and had a number of people reach out to me interested in contributing. 2 developers (osman-sultan, durgeshfirake) helped me come up with the design for the landing page. I collaborated with 3 developers (dyzhuu, Davicci, xzd9326) in collecting a first-of-its-kind dataset of spam GitHub issues to train a classifier. After putting it together, the event ended and I continued developing the application on my own. The first iteration of RepoCleanup is deployed without the spam detection model. The goal is to create a training and deployment job to continuously update the model with new spam issues saved by the users of the application, deploy the model, and open-source the dataset.

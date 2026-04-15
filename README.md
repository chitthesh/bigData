# social network graph database

> social network simple implementation using neo4j graph database

<hr>

## How to build & run
this app built with nextjs, its not recomended connecting to database directly from frontend webapp because will exposing your database credential, this only simple testing implementation for my learning purposo, the intent is how to use graph database not how to make good frontend, stay chill...

- to build & run just run like nextjs app

- read about this experiment on my medium :  [this link](https://alfiankan.medium.com/explorasi-membuat-sosial-network-graph-dengan-neo4j-graph-database-dan-next-js-8b44e640f818)

## Tiny Deployment Checklist (Vercel)

1. Confirm git remote points to your repo:
	- `git remote -v`
	- expected: `https://github.com/chitthesh/bigData.git`
2. Ensure Vercel project is linked in this folder:
	- `npx vercel link`
3. Connect Git integration for auto deploy on push:
	- `npx vercel git connect https://github.com/chitthesh/bigData.git`
4. Configure required env vars in both Production and Preview:
	- `NEO4J_URI`
	- `NEO4J_USER`
	- `NEO4J_PASSWORD`
5. Push to your main branch to trigger automatic Production deployment.
6. For manual release (optional):
	- `npx vercel --prod --yes`
7. Smoke test after deploy:
	- open app URL
	- verify API health endpoint: `/api/users`

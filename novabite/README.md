# NovaBite — Sales Intelligence Prototype

Professional, self-contained sales intelligence demo intended for a technical take-home assignment. The project includes a small Express backend that serves aggregated sales data and a React frontend dashboard with a conversational assistant.

This README is concise and written for an engineering reviewer: it explains how to run the project locally, what each service does, and how to test the main flows.

## Quick summary
- Backend: Express API serving sales aggregates and a conversational endpoint.
- Frontend: React app (dev server) showing KPIs, charts and a chat UI.
- Data: provided CSV (data/novabite_sales_data.csv). The backend will load this into a local database or use an in-memory fallback.

## Quickstart (local)

1. Prerequisites
	- Node.js 18+ and npm

2. Install and run backend

	```powershell
	cd backend
	npm install
	# if this is the first run and you want a local DB file:
	npm run seed   # optional (seeds novabite.db from CSV)
	npm start      # starts API on http://localhost:4000
	```

	- If the native SQLite package fails to build, the backend will automatically use the provided CSV and an in-memory adapter so the API still works.

3. Install and run frontend (new terminal)

	```powershell
	cd frontend
	npm install
	npm start      # opens http://localhost:3000 (dev server)
	```

	The frontend proxies API requests to the backend (`/api/*`) during development.

## Environment
- Copy `backend/.env.example` to `backend/.env` and set the chat API key value there when needed. The key name used by the backend is `ANTHROPIC_API_KEY` (it is treated as a generic chat provider key).

## Main flows to test

1. Health check

	```powershell
	curl http://localhost:4000/api/health
	# expected: { "status": "ok" }
	```

2. Summary KPIs

	```powershell
	curl http://localhost:4000/api/summary
	```

3. Chat / conversational assistant

	```powershell
	curl -X POST http://localhost:4000/api/chat -H "Content-Type: application/json" -d '{"question":"Give me a brief summary of sales"}'
	```

	- If the external chat/key is not configured or the provider rejects requests, the backend will return a concise local summary built from the loaded data so the chat UI still works for evaluation.

## Project structure (short)

- `backend/` — Express API, routes, and DB adapter (uses SQLite when available, otherwise CSV fallback).
- `frontend/` — React dashboard and chat UI.
- `data/novabite_sales_data.csv` — provided dataset used for seeding or fallback.

## Notes for the reviewer

- The backend aims for clarity and portability: it will run even when native modules can't be compiled on the reviewer machine.
- The chat endpoint is implemented as a thin wrapper that builds an aggregated data snapshot and sends it to the configured chat provider; when the provider is not available the route produces a deterministic, human-readable fallback summary from the same aggregates.
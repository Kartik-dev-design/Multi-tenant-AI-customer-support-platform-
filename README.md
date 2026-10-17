# AI Support Platform

Multi-tenant AI customer support platform: RAG over company docs, agentic ticket handling with human approval.
Stack: MERN (TypeScript) + LLM tool-calling agents + BullMQ + MongoDB Atlas Vector Search.

## Roadmap
- [x] Step 1: Foundation, multi-tenancy, JWT auth
- [ ] Step 2: Document ingestion + RAG with citations
- [ ] Step 3: Single agent with tools
- [ ] Step 4: Multi-agent routing + human approval
- [ ] Step 5: Evals, observability, guardrails
- [ ] Step 6: Dockerize, CI/CD, deploy

## Run locally
```bash
docker compose up -d
cd apps/api && cp .env.example .env && npm install && npm run dev
```
API: http://localhost:4000/api/v1/health

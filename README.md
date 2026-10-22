# AI Support Platform

Multi-tenant AI customer support platform: RAG over company docs, agentic ticket handling with human approval.
Stack: MERN (TypeScript) + LLM tool-calling agents + BullMQ + MongoDB Atlas Vector Search.

## Roadmap
- [x] Step 1: Foundation, multi-tenancy, JWT auth, React auth UI
- [x] Step 2: Document ingestion + RAG with citations
- [x] Step 3: Single agent with tools (custom Claude tool-calling loop, SSE streaming, run traces)
- [ ] Step 4: Multi-agent routing + human approval
- [ ] Step 5: Evals, observability, guardrails
- [ ] Step 6: Dockerize, CI/CD, deploy

## Run locally
```bash
docker compose up -d
cd apps/api && cp .env.example .env   # add OPENAI_API_KEY and ANTHROPIC_API_KEY
npm install
npm run dev        # terminal 1: API
npm run worker     # terminal 2: ingestion worker (required for document processing)
```
API: http://localhost:4000/api/v1/health

## Frontend
```bash
cd apps/web && npm install && npm run dev
```
Web: http://localhost:5173 (Vite proxies `/api` to the API on :4000)

## Try the agent (Step 3)
1. Upload a doc in **Knowledge base** (e.g. a refund policy) and wait for `ready`.
2. In **Conversations**, click **Load demo orders**, then ask:
   - "What's your refund policy?"  -> `searchKnowledgeBase`
   - "Where is order ORD-1001?"    -> `getOrderStatus`
   - "I want a human, my item arrived broken" -> `createTicket` (shows on Overview)
3. Open **Agent traces** to inspect every model call and tool call.

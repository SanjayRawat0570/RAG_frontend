# RAG Frontend (Next.js)

Web UI for the Enterprise RAG backend: add documents and ask questions, with
cited answers, intent, provider, cost, and cache status.

## Develop

```bash
npm install
cp .env.local.example .env.local     # NEXT_PUBLIC_API_BASE=http://localhost:8000/api/v1
npm run dev                          # http://localhost:3000
```

## Build / run

```bash
npm run build && npm start
```

## Configuration

| Env var | Purpose |
|---------|---------|
| `NEXT_PUBLIC_API_BASE` | Backend API base URL (baked at build time). Default `http://localhost:8000/api/v1`. |

## Deploy

- **Vercel**: import this directory, set `NEXT_PUBLIC_API_BASE` to your backend URL.
- **Docker**: `docker build --build-arg NEXT_PUBLIC_API_BASE=... -t rag-web .`
  (produces a standalone server image; `docker run -p 3000:3000 rag-web`).
# RAG_frontend

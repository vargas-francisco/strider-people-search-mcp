# End-to-End Smoke Test Runbook

This is the manual verification you (the maintainer) run before tagging `v0.1.0` and announcing the MCP. Everything in the repo's automated test suite is green; the only thing left is to verify the real round-trip against `qa.striderintel.com` and from real MCP clients (Claude Desktop, ChatGPT).

## Prerequisites

- Strider Auth0 M2M client_id / client_secret with scopes:
  - `read:all-sentry` (required)
  - `read:falsified-resumes` (optional — enables resume audit)
- The Auth0 token URL and audience for Strider's QA tenant
- A real `qa.striderintel.com` test account whose data you can reasonably query
- `flyctl` installed if you also want to verify the deployed path: `brew install flyctl`

## 1. Mint a QA M2M token

```bash
curl --request POST \
  --url https://<strider-tenant>.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "grant_type": "client_credentials",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "YOUR_AUDIENCE"
  }'
```

Save the `access_token` as `$JWT` in your shell.

## 2. Local HTTP-mode smoke

```bash
cd ~/github/strider-people-search-mcp
STRIDER_BASE_URL=https://qa.striderintel.com npm run dev:http
```

Server should log `mcp http listening` on port 3000.

In another terminal:

```bash
# Health check
curl -s http://localhost:3000/health
# → {"ok":true,"name":"strider-people-search-mcp","version":"0.1.0"}

# Unauth check — must return auth_denied
curl -s -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{}'
# → {"error":"auth_denied","message":"missing Authorization: Bearer..."}
```

## 3. MCP Inspector against local server

```bash
npx @modelcontextprotocol/inspector --url http://localhost:3000/mcp \
  --header "Authorization: Bearer $JWT"
```

In the Inspector UI, verify:

- [ ] **Tools** tab lists exactly 4: `person_search`, `person_search_get_result`, `resume_check_get_status`, `resume_check_get_result`
- [ ] Each tool description is the rich, multi-paragraph text (not a placeholder)
- [ ] **Resources** tab lists exactly 9: `docs://overview`, `docs://input-fields`, `docs://output-fields`, `docs://workflows/quick-search`, `docs://workflows/identity-verification`, `docs://workflows/resume-audit`, `docs://errors`, `docs://quota`, `docs://privacy`
- [ ] Read `docs://overview` — see the full markdown
- [ ] **Prompts** tab lists 3: `screen_candidate`, `verify_identity`, `resume_audit`

## 4. Call `person_search` against QA

In the Inspector, call `person_search` with:

```json
{ "emails": ["<a real qa-known email here>"] }
```

Expected one of:
- `{ "status": "ok", "data": { results: [...], ... } }` — full result returned within 90s
- `{ "status": "running", "job_id": "..." }` — slow job; remember the job_id

If you got `running`, call `person_search_get_result` with the same `job_id` after ~10s. Repeat until you see `status: "ok"` or `error`.

## 5. Resume audit (only if you have `read:falsified-resumes`)

Generate a small base64 of a PDF (or use a known good resume base64):

```bash
base64 -i sample-resume.pdf | head -c 200  # just the first chunk
```

In the Inspector, call `person_search` with:

```json
{
  "emails": ["<the same qa email>"],
  "include_resume_check": true,
  "resume_file": {
    "fileName": "sample.pdf",
    "fileExtension": "pdf",
    "fileBase64": "<full base64 here>"
  }
}
```

Expect a `resume_check_job_id` in the response (alongside the sentry result or running envelope).

Then:
- Call `resume_check_get_status` with that `resume_check_job_id` until status is `completed`
- Call `resume_check_get_result` to get the verdict

## 6. Local stdio-mode smoke

```bash
STRIDER_AUTH0_TOKEN=$JWT STRIDER_BASE_URL=https://qa.striderintel.com \
  npx @modelcontextprotocol/inspector npx tsx src/entrypoints/stdio.ts
```

Repeat checks from Step 3 — same tools, resources, prompts. Run a person_search.

## 7. Claude Desktop integration

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS path):

```json
{
  "mcpServers": {
    "strider-people-search": {
      "command": "npx",
      "args": ["-y", "tsx", "/Users/<you>/github/strider-people-search-mcp/src/entrypoints/stdio.ts"],
      "env": {
        "STRIDER_AUTH0_TOKEN": "<paste your JWT>",
        "STRIDER_BASE_URL": "https://qa.striderintel.com"
      }
    }
  }
}
```

Restart Claude Desktop. In a chat, say: "Look up John Smith at Boeing."

- [ ] Claude selects `person_search`
- [ ] Confirms tool args before calling
- [ ] Reports results coherently with citations

## 8. Deploy to Fly.io (one-time)

```bash
brew install flyctl
fly auth login
cd ~/github/strider-people-search-mcp
fly apps create strider-people-search-mcp     # or pick a different name if taken
fly deploy
```

Verify:

```bash
curl -s https://strider-people-search-mcp.fly.dev/health
# → {"ok":true,...}
```

## 9. Claude Desktop against deployed Fly.io URL

Replace the stdio block in `claude_desktop_config.json` with:

```json
{
  "mcpServers": {
    "strider-people-search": {
      "transport": "http",
      "url": "https://strider-people-search-mcp.fly.dev/mcp",
      "headers": { "Authorization": "Bearer <your-jwt>" }
    }
  }
}
```

Restart Claude Desktop. Repeat the "Look up John Smith at Boeing" test.

## 10. ChatGPT Custom Connector

ChatGPT → Settings → Connectors → Add custom connector:

- Name: `Strider People Search (unofficial)`
- URL: `https://strider-people-search-mcp.fly.dev/mcp`
- Auth: Bearer — paste your JWT

In a new ChatGPT chat with the connector enabled, ask: "Use the Strider tool to look up John Smith at Boeing."

- [ ] ChatGPT picks `person_search`
- [ ] Returns coherent answer

## 11. (Recommended) Run the evals against your QA-permitted models

```bash
ANTHROPIC_API_KEY=sk-... OPENAI_API_KEY=sk-... npm run eval
```

Pass rate target: **>80%** across the 10 (5 tests × 2 providers) golden prompts. If lower, iterate on tool descriptions in `src/registry.ts` and resource content in `src/resources/`, then re-run.

## 12. Tag v0.1.0

Only after Steps 2–11 all pass:

```bash
git tag v0.1.0
git push origin v0.1.0
gh release create v0.1.0 --generate-notes
```

## 13. Announce

Optionally: link the README on /r/LocalLLaMA, /r/ClaudeAI, MCP community forums, or share with Strider directly if you want to offer it upstream.

---

## Failure-mode notes

- **`auth_denied` from Strider on every call:** your JWT lacks `read:all-sentry`. Re-check scopes in the token-mint request.
- **`quota_exceeded`:** your test entity's annual quota is exhausted on QA. Use a different entity or contact your account manager.
- **`running` forever:** if a job never reaches `processed` after several minutes of polling, the downstream Tracer / Sentry service may be unhealthy. Check Strider's status.
- **MCP Inspector won't connect:** make sure the URL ends in `/mcp` (HTTP mode) and you're sending `Authorization: Bearer ...`.
- **Claude Desktop sees 0 tools:** check Claude Desktop's logs (`~/Library/Logs/Claude/mcp*.log`) for handshake errors. The most common cause is a bad `command`/`args` path in the config.

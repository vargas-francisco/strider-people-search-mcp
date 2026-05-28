# strider-people-search-mcp

> ⚠️ **Unofficial.** This is a community project. Not affiliated with or endorsed by
> Strider Technologies. You must already have Strider API credentials to use it.

A focused Model Context Protocol (MCP) server that exposes Strider's people-search
and resume-falsification APIs as agent-callable tools.

Connect from ChatGPT (Custom Connectors), Claude Desktop, Claude Code, Cursor, or
any other MCP-compatible client.

## What it does

- Searches for people using Strider Sentry
- Optionally verifies resumes against the search results to detect falsification
- Embeds usage guidelines, input/output references, and recovery instructions as
  MCP resources — so your agent self-corrects without out-of-band docs

## Tools

| Tool                          | Purpose                                                |
|-------------------------------|--------------------------------------------------------|
| `person_search`               | Start a person search; block-and-poll up to 90s       |
| `person_search_get_result`    | Fetch result of a previously-started search           |
| `resume_check_get_status`     | Poll resume-falsification analysis status              |
| `resume_check_get_result`     | Fetch resume-falsification verdict                    |

See `docs/tool-reference.md` for full input/output schemas.

## Quick start

### Hosted (recommended)

The maintainer hosts a public instance at:

```
https://strider-people-search-mcp.fly.dev/mcp
```

You need a Strider Auth0 M2M JWT with the `read:all-sentry` scope (and optionally
`read:falsified-resumes` for resume features). See `docs/auth.md`.

#### ChatGPT (Custom Connector)
1. ChatGPT → Settings → Connectors → Add custom connector
2. Name: "Strider People Search (unofficial)"
3. URL: `https://strider-people-search-mcp.fly.dev/mcp`
4. Auth: Bearer token — paste your Strider Auth0 JWT

#### Claude Desktop

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "strider-people-search": {
      "transport": "http",
      "url": "https://strider-people-search-mcp.fly.dev/mcp",
      "headers": { "Authorization": "Bearer <your-strider-jwt>" }
    }
  }
}
```

#### Claude Code

Add to your repo's `.mcp.json`:

```json
{
  "mcpServers": {
    "strider-people-search": {
      "transport": "http",
      "url": "https://strider-people-search-mcp.fly.dev/mcp",
      "headers": { "Authorization": "Bearer <your-strider-jwt>" }
    }
  }
}
```

### Self-hosted (stdio)

```bash
npm install -g strider-people-search-mcp   # once published
STRIDER_AUTH0_TOKEN=<your-jwt> strider-people-search-mcp
```

Or with auto-token-minting:

```bash
STRIDER_AUTH0_CLIENT_ID=...
STRIDER_AUTH0_CLIENT_SECRET=...
STRIDER_AUTH0_AUDIENCE=...
STRIDER_AUTH0_TOKEN_URL=https://your-auth0.auth0.com/oauth/token
strider-people-search-mcp
```

## Development

```bash
npm install
npm test                    # unit + integration
npm run eval                # evals (requires ANTHROPIC_API_KEY or OPENAI_API_KEY)
npm run dev:stdio           # local stdio server
npm run dev:http            # local HTTP server on :3000
```

## License

MIT. See `LICENSE`.

# Deploying to Fly.io

This MCP is deployed as a single-region Fly.io app.

## Prerequisites
- `flyctl` installed (`brew install flyctl`)
- `fly auth login` completed
- App created (`fly apps create strider-people-search-mcp`)

## Deploy

```bash
fly deploy
```

## Logs

```bash
fly logs
```

## Scaling

Default config scales to zero when idle (`auto_stop_machines = "stop"`).
On first request after idle, cold start adds ~2s to the first MCP request.
To pin a machine warm:

```bash
fly scale count 1 --region iad
```

## Configuration

Env vars are set in `fly.toml` for non-secrets. The MCP itself does NOT
require any secrets because auth tokens are passed per-request by clients.

If you want to point at qa for testing:

```bash
fly secrets set STRIDER_BASE_URL=https://qa.striderintel.com
```

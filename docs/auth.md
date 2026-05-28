# Authentication

This MCP forwards Bearer tokens to the Strider `/api` endpoints. You are
responsible for obtaining a valid Strider Auth0 M2M (machine-to-machine) JWT.

## Required scope
- `read:all-sentry` — for `person_search`, `person_search_get_result`
- `read:falsified-resumes` — for `resume_check_get_status`, `resume_check_get_result`

## How to mint a token

You need credentials issued by Strider:
- `client_id`
- `client_secret`
- `audience` (Strider's API audience identifier)
- `token_url` (e.g., `https://<strider-tenant>.auth0.com/oauth/token`)

Then:

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

Response:

```json
{ "access_token": "eyJhbGciOi...", "expires_in": 86400, "token_type": "Bearer" }
```

Use the `access_token` as your Bearer token.

## Token lifetime

Tokens are valid for up to 24 hours. You'll need to refresh periodically. If
running the MCP in stdio mode with `STRIDER_AUTH0_CLIENT_ID`/`SECRET`/etc.
configured, it will auto-refresh.

## Don't paste tokens into chat

Configure tokens in your MCP client's settings, not in chat messages. The MCP
itself never stores tokens server-side — they pass through per request.

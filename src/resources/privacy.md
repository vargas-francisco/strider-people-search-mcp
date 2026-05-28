# Privacy & Data Handling

This MCP forwards user requests to Strider's API. The author of this MCP DOES NOT
store, log, or retain any of the data flowing through it. Tokens, request bodies,
and response bodies are not persisted.

## What to send

Send **only the minimum identifying information** needed to find the person:

- Name + employer or school is usually enough
- Email or LinkedIn URL is even cleaner

## What NOT to send

- **Social Security Numbers** — not used by Sentry, never include.
- **Dates of birth** — not used by Sentry, never include.
- **Government IDs, passport numbers** — not used.
- **Financial information** — not used.

If the user provides any of these, ignore them when building the tool call. If
necessary, tell the user "I won't include that — Strider's search doesn't use it."

## Tokens

This MCP only forwards Bearer tokens; it never stores them. If a user pastes a
token into chat to share with you, advise them that tokens are sensitive and
should be configured in their MCP client, not in chat messages.

## Reporting concerns

If you suspect a leaked token or anomalous use, the user should contact their
Strider account manager immediately and rotate the M2M client_secret.

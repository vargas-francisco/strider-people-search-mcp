# Strider People-Search Quota

Each successful person search consumes one unit from the user's annual contract
quota. The quota resets on the contract anniversary date — NOT on the calendar year.

## How to be a good citizen

- Don't call `person_search` repeatedly with the same inputs hoping for different
  results. The engine is deterministic-ish; you'll just burn quota.
- If you got `status === "running"`, poll with `person_search_get_result`. That
  does NOT consume additional quota.
- Before initiating a new search, ask the user if they want to proceed — the cost
  is real.

## When you see `quota_exceeded`

This means the user's organization has consumed their full annual allocation.
There is no programmatic refresh. Tell the user clearly:

> "Your Strider people-search quota is exhausted for this contract year. Please
> contact your Strider account manager to discuss expansion."

Do not retry.

# Workflow: Identity Verification

User says: "Verify that John Smith really worked at Boeing as a senior engineer
from 2018 to 2023."

**Steps:**

1. Call `person_search` with the person's identifying info.
2. From the result, locate the `employment` records for the relevant organization.
3. Cross-check the user's claims against the records:
   - Organization match?
   - Title plausibility (titles can drift; "senior engineer" vs "principal engineer")?
   - Date overlap?
4. Report findings as: claim → evidence in Strider → match/mismatch/inconclusive.
5. Cite `sources` for each piece of evidence.

**Important:** absence of a record is NOT proof of falsehood — Strider's coverage is
not exhaustive. Phrase carefully ("Strider has no record of …" not "this is false").

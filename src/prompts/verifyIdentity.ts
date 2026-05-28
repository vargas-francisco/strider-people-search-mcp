export interface VerifyIdentityArgs {
  name: string;
  claims: string;
}

export const verifyIdentityPrompt = ({ name, claims }: VerifyIdentityArgs): string =>
  `
You are verifying claims about a person using Strider's people-search MCP.

Person: ${name}
Claims to verify: ${claims}

Steps:
1. Call \`person_search\` with the person's name plus the strongest disambiguator
   from the claims (employer, school, or email if available).
2. Compare each claim to the Strider record. Use this output structure:

   - Claim: <quote>
     - Strider evidence: <quote + source>
     - Verdict: match / partial match / mismatch / inconclusive (Strider has no record)

3. Note Strider coverage limits: absence of a record is NOT proof a claim is false.
4. Do not invent fields. If Strider doesn't say it, you don't say it.
`.trim();

export interface ScreenCandidateArgs {
  name: string;
  employer: string;
}

export const screenCandidatePrompt = ({ name, employer }: ScreenCandidateArgs): string =>
  `
You are screening a candidate for personnel risk using Strider's people-search MCP.

Candidate: ${name}
Current/claimed employer: ${employer}

Steps:
1. Call \`person_search\` with the candidate's name and employer.
2. Review the result for risk signals. Quote each signal verbatim and cite sources.
3. Cross-check the candidate's employment history for plausibility.
4. Summarize findings under three headings: BACKGROUND, RISK SIGNALS, RECOMMENDATION.
5. Recommend HUMAN REVIEW for any non-trivial finding — do not make hire/no-hire
   decisions on your own.

If the API quota is exceeded, surface that to the user immediately.
`.trim();

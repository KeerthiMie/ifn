// Terms & Conditions configuration
// Update these URLs when the real documents are published.
export const AGREEMENT_URLS = {
  1: 'https://PLACEHOLDER-TERMS-URL/step-1',
  2: 'https://PLACEHOLDER-TERMS-URL/step-2',
  3: 'https://PLACEHOLDER-TERMS-URL/step-3',
}

// Current version of the agreements. Increment this when any agreement text changes
// to force re-acceptance.
export const CURRENT_TERMS_VERSION = 1

// Text for each step (used in the UI). Keep in sync with the external documents.
export const AGREEMENT_TEXTS = {
  1: `**STEP 1 — Notice for Collection and Processing of Personal Data**

- Consent for collection and processing of personal/professional data.
- Purpose limitation for networking, mentorship, startup tracking and investor matching.
- Profile visibility rules.
- Data processor information.
- User rights to access, correct and request erasure/withdraw consent.`,

  2: `**STEP 2 — Terms of Use / Ecosystem Code of Conduct & Intellectual Property Protection**

- Commercial-use restrictions.
- No unsolicited advertising, marketing pitches, bulk recruitment or job-poaching.
- Enforcement actions for commercial spamming, unauthorized scraping or poaching.
- Institutional ownership of platform software, interfaces, database structures, graphical assets and technical documentation.
- Protection of founder/student startup materials and pitch decks.
- Prohibition on plagiarism, piracy, unauthorized distribution and reverse engineering.`,

  3: `**STEP 3 — Institutional Liability Disclaimer and Risk Allocation**

- No funding or performance guarantee.
- IFN is a networking/collaboration facilitator and does not guarantee investment or funding.
- Liability waiver for user-generated content.
- Liability waiver for online/offline financial, investment or partnership arrangements between users.
- Formal collaborations should use separate MOU/agreements.
- Platform is provided on an "as-is/as-available" basis.`
}
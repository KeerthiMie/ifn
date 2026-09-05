// Terms & Conditions configuration
// Increment CURRENT_TERMS_VERSION when any terms clauses change to mandate re-acceptance.
export const CURRENT_TERMS_VERSION = 1

export const TERMS_STEPS = {
  1: {
    title: 'Notice for Collection and Processing of Personal Data',
    category: 'Step 1 of 3: Privacy & Data Protection',
    description: 'Please review how your personal, academic, and professional information is collected, processed, and safeguarded within the ICFAI Founders Network.',
    sections: [
      {
        heading: '1. Purpose of Data Collection and Processing',
        content: 'ICFAI Founders Network ("IFN", "we", "us") collects and processes personal, academic, and professional information to facilitate institutional networking, startup project tracking, peer-to-peer mentorship, and investor-founder matching within the ICFAI entrepreneurial ecosystem.',
      },
      {
        heading: '2. Types of Data Processed',
        content: 'Data collected includes your full name, institutional email address, telephone contact, academic or alumni credentials, startup affiliations, project descriptions, pitch documents, and platform engagement telemetry necessary to deliver the service.',
      },
      {
        heading: '3. Profile Visibility & Member Directory Access',
        content: 'Your public directory profile (including name, designation, bio, and associated startup profile) will be visible to authenticated IFN members. Private contact information and internal messages remain protected based on your granular privacy preferences.',
      },
      {
        heading: '4. Non-Commercial Data Protection Commitment',
        content: 'IFN enforces strict non-commercial data stewardship. Your personal and professional information will never be sold, leased, traded, or distributed to third-party marketing companies, advertisers, or data brokers.',
      },
      {
        heading: '5. Data Subject Rights & Consent Management',
        content: 'You hold the right to inspect your stored information, request corrections to outdated or inaccurate records, and submit requests for account deactivation or consent withdrawal subject to institutional audit requirements.',
      },
    ],
  },

  2: {
    title: 'Terms of Use, Ecosystem Code of Conduct & Intellectual Property',
    category: 'Step 2 of 3: Platform Conduct & IP Protection',
    description: 'Please review the community guidelines, anti-spam policies, and intellectual property protections governing this platform.',
    sections: [
      {
        heading: '1. Permitted Use & Professionalism',
        content: 'IFN is an institutional collaborative workspace designed for founders, mentors, and innovators. All participants agree to maintain professional etiquette, integrity, and constructive discourse across all community channels, comments, and direct communications.',
      },
      {
        heading: '2. Strict Prohibition on Commercial Spam and Job Poaching',
        content: 'Unsolicited mass commercial advertisements, predatory marketing pitches, bulk recruitment campaigns, and aggressive talent poaching are strictly forbidden. Any violation results in immediate temporary suspension or permanent expulsion from the ecosystem.',
      },
      {
        heading: '3. Platform Software & Database Ownership',
        content: 'All underlying software, interfaces, user experience workflows, database architectures, graphics, and technical documentation are proprietary assets owned by ICFAI / IFN and protected under applicable copyright and intellectual property laws.',
      },
      {
        heading: '4. Founder Intellectual Property & Confidentiality',
        content: 'Founders retain exclusive ownership of their startup ideas, pitch decks, business projections, and proprietary technical designs. All members agree to respect startup confidentiality and refrain from unlawful copying, plagiarism, distribution, or reverse engineering.',
      },
      {
        heading: '5. Moderation and Enforcement Authority',
        content: 'Platform administrators reserve full discretion to audit abuse reports, redact non-compliant content, and revoke membership access for behavior detrimental to community safety and trust.',
      },
    ],
  },

  3: {
    title: 'Institutional Liability Disclaimer & Risk Allocation',
    category: 'Step 3 of 3: Legal Disclaimers & Limitations',
    description: 'Please review the institutional disclaimers and allocation of risks associated with collaboration and financial engagements.',
    sections: [
      {
        heading: '1. Community Facilitator Status — No Funding Guarantee',
        content: 'IFN operates solely as a community network and facilitator. IFN, its affiliated academic institutions, and administrators do not guarantee funding, grant allocation, venture capital investment, or commercial profitability for any listed venture.',
      },
      {
        heading: '2. Independent Due Diligence & Bilateral Arrangements',
        content: 'Any financial transaction, equity allocation, loan, partnership, advisory agreement, or contract between members is strictly bilateral. Members are solely responsible for conducting independent legal, financial, and regulatory due diligence before entering into binding agreements.',
      },
      {
        heading: '3. Disclaimer for User-Generated Content',
        content: 'Startup metrics, financial projections, team claims, and commentary submitted by users reflect solely the representations of individual authors. IFN does not endorse or vouch for the veracity or completeness of user-generated content.',
      },
      {
        heading: '4. "As-Is" Platform Service Provision',
        content: 'The digital platform and services are provided strictly on an "as-is" and "as-available" basis without representations or warranties of any kind, whether express, statutory, or implied, including fitness for a particular purpose or uptime availability.',
      },
      {
        heading: '5. Limitation of Liability and Hold Harmless',
        content: 'To the fullest extent allowed by law, ICFAI, IFN, its officers, faculty, and administrative personnel are held harmless from any direct, indirect, incidental, punitive, or consequential damages resulting from platform usage or bilateral engagements.',
      },
    ],
  },
}

// Retained for backwards compatibility if needed
export const AGREEMENT_TEXTS = {
  1: TERMS_STEPS[1].sections.map(s => `${s.heading}\n${s.content}`).join('\n\n'),
  2: TERMS_STEPS[2].sections.map(s => `${s.heading}\n${s.content}`).join('\n\n'),
  3: TERMS_STEPS[3].sections.map(s => `${s.heading}\n${s.content}`).join('\n\n'),
}
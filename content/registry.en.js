/* eslint-disable no-unused-vars */
// AI Use Case Registry — English content.
//
// This file is the structural source for every language: the start page, the screening
// groups and questions, the documentation tiers, their sections and fields, and the
// interface wording. Other languages (e.g. registry.es.js) only translate text and are
// matched to this file by id.
//
// Change any text freely. Ids (screening group ids, question ids, tier levels, section
// ids and field ids) are stable keys: translations and exported records refer to them,
// so add new ids rather than reusing old ones.
//
// SPDX-License-Identifier: CC-BY-4.0
// "AI Use Case Registry" framework by AiR Hub at UNLV International Gaming Institute.
// Licensed under CC BY 4.0: credit AiR Hub when you share or adapt it (see LICENSE).

window.REGISTRY_LOCALES = window.REGISTRY_LOCALES || {};

window.REGISTRY_LOCALES.en = {
  // Shown in the language switcher
  label: "EN",
  flag: "🇺🇸",

  // ---------------------------------------------------------------------------
  // Start page (the first page of the registry)
  // ---------------------------------------------------------------------------
  startPage: {
    // Start page heading. Use \n to break it over two lines.
    title: "AI Use Case Registry",
    // Stored in every record as contentVersion. Change it whenever you change the questions or fields.
    version: "Version 1.0",
    blurb:
      "Document each AI use case in your organization's gambling operations here.",
    blurbTail:
      "Every record joins a living inventory of how AI is used and governed, so it can be reviewed and overseen.",
    howItWorks: {
      eyebrow: "How it works",
      steps: [
        { title: "Screen", body: "Answer a few yes/no questions about your AI use case and how it interacts with or impacts players." },
        { title: "Classify", body: "Your answers determine the use case's impact level — and how much documentation it requires." },
        { title: "Document", body: "Complete the documentation fields for your assigned tier, then submit the record to your organization's inventory." },
      ],
      scaleLabel: "Documentation tiers are set by a use case's potential impact on players",
      axisLow: "Lower player impact",
      axisHigh: "Higher player impact",
    },
    // The start page shows the flow, the tiers and the key terms (collapsed). To add your
    // own sections above the key terms (how your organization uses the registry, who to
    // ask), list them here; docs/customizing.md has an example:
    //   sections: [{ label: "…", heading: "…", paragraphs: ["…"], list: ["…"] }],
    // footerNote adds a short note to the footer.
    defsLabel: "Before you start",
    defsHeading: "Key terms used in the registry",
    defsIntro: "These terms have a specific meaning in the screening questions and documentation fields.",
    defsToggleLabel: "Show definitions",
    // The tier descriptions and examples open under the definition marked showTiers.
    definitions: [
      {
        term: "AI System",
        body: `An AI system is a computational or machine-based system that, for explicit or implicit objectives, infers from the input it receives how to generate outputs such as predictions, content, recommendations, or decisions that can influence physical or virtual environments and players. This may include machine learning systems, generative AI, predictive analytics, behavioral models, recommendation systems, or advanced automated decision-support systems.

This definition is a recommended baseline, adapted from the OECD Recommendation on AI and the NIST AI Risk Management Framework. Adopting organizations may expand or adapt it to reflect their own context and risk appetite, but should avoid narrowing it below this scope.`,
        inlineLinks: [
          { phrase: "OECD Recommendation on AI", url: "https://legalinstruments.oecd.org/en/instruments/OECD-LEGAL-0449" },
          { phrase: "NIST AI Risk Management Framework", url: "https://airc.nist.gov/airmf-resources/airmf/0-ai-rmf-1-0/" },
        ],
      },
      {
        term: "Use Case",
        body: `A use case refers to a specific operational application of an AI system. A single AI system may support multiple use cases that fall into different impact tiers based on how the system is being used.`,
      },
      {
        term: "Player Interaction & Impact",
        body: `The extent to which an AI system's outputs affect individual players — whether applied automatically or acted on by a person. This ranges from interaction (targeting or communicating with players, or analyzing their behavior or data) to material impact (consequentially affecting their welfare, financial outcomes, access, behavior, fairness, autonomy, or regulatory treatment). Where a use case falls on this spectrum is what the screening assesses to assign its documentation tier.`,
      },
      {
        term: "Documentation Tier",
        body: `The documentation level assigned to a use case based on its potential impact on players. The tiers are additive — higher tiers require additional documentation on top of the tiers below.`,
        showTiers: true,
      },
    ],
    completionGuidance: `Because the fields provided may not perfectly accommodate or be relevant to every single AI use case, we recommend making a best effort to complete all sections. If you are uncertain whether a specific field applies, we advise erring on the side of caution and conservative disclosure by filling it out.`,
    tierToggleLabel: "See detailed tier descriptions and example use cases for each",
    examplesLabel: "Examples",
  },

  // Explanation shown next to the word "materially" in screening groups that set
  // materialityNote: true. This is the materiality threshold for your organization.
  materiality: {
    word: "materially",
    title: "What “materially” means here",
    aria: "What does “materially” mean here?",
    note: "For the purposes of this registry, “materially” refers to situations where an AI system could reasonably be expected to have a non-trivial influence on player outcomes, regulatory obligations, or significant business operations. Due to the context-dependent nature of materiality, organizations should consider the scale, severity, likelihood, and reversibility of potential impacts when determining whether a system meets this threshold.",
  },

  // ---------------------------------------------------------------------------
  // Screening
  //
  // Groups are asked in this order. The first group with any "yes" answer assigns
  // its tier and screening stops. If every group is answered "no", the use case is
  // assigned the lowest tier below. Add, remove or reword questions and groups here.
  //
  // `phrase` completes the sentence "You indicated this use case …" at the top of
  // an elaboration section (see `contextFrom` on documentation sections).
  // ---------------------------------------------------------------------------
  screening: [
    {
      id: "t3",
      tier: 3,
      heading: "Could this use case materially affect players?",
      intro: 'Answer for this use case specifically, not everything the underlying system could do. If you are unsure whether something applies, lean toward "Yes."',
      materialityNote: true,
      questions: [
        {
          id: "A1",
          title: "Player Access",
          phrase: "materially affects player access",
          prompt:
            "Does this use case materially affect player access (e.g., account status, restrictions, exclusions, or eligibility decisions)?",
        },
        {
          id: "A2",
          title: "Player Money",
          phrase: "materially affects player money",
          prompt:
            "Does this use case materially affect player money (e.g., affordability decisions, deposit/withdrawal/limit determinations, or directive recommendations about wagering, betting, or spending)?",
        },
        {
          id: "A3",
          title: "Protection-Related Decisions",
          phrase: "supports, automates, or directs protection-related decisions",
          prompt:
            "Does this use case support, automate, or direct protection-related decisions (e.g., RG interventions, vulnerability classifications, harm-prevention measures, or recommendations to players about RG resources or self-exclusion)?",
        },
        {
          id: "A4",
          title: "Identity Functions",
          phrase: "performs identity functions (biometric ID / KYC)",
          prompt:
            "Does this use case perform identity functions (e.g., biometric identification or verification, or KYC determinations)?",
        },
        {
          id: "A5",
          title: "Consequential Operational Decisions",
          phrase: "influences other consequential operational decisions about players",
          prompt:
            "Does this use case make or materially influence other consequential operational decisions about individual players (e.g., differential treatment, dynamic pricing or odds, fraud determinations, or AML escalation) based on player-specific analysis or classification?",
        },
      ],
    },
    {
      id: "t2",
      tier: 2,
      heading: "Does this use case interact with individual players?",
      intro: 'If you are unsure whether something applies, lean toward "Yes."',
      questions: [
        {
          id: "B1",
          title: "Direct Communication",
          phrase: "directly communicates with individual players",
          prompt:
            "Does this use case directly communicate with individual players (e.g., chat, generated messages, recommendations, personalized content)?",
        },
        {
          id: "B2",
          title: "Personalization",
          phrase: "personalizes content, promotions, or experiences",
          prompt:
            "Does this use case personalize content, promotions, communications, or experiences for individual players?",
        },
        {
          id: "B3",
          title: "Player Behavior",
          phrase: "analyzes or classifies individual player behavior",
          prompt:
            "Does this use case analyze or classify individual player behavior to inform business decisions that are advisory, expressive, or experiential (e.g., marketing segmentation, retention scoring, content recommendations)?",
        },
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // Documentation tiers
  //
  // Tiers are additive: a use case completes the sections of its own tier and of
  // every tier below it. Field kinds: "text" (short answer), "textarea" (long
  // answer), "select" (with `options`) and "contact" (with `subfields`).
  //
  // Section options:
  //   contextFrom: "<screening group id>"  opens the section with the "yes" answers
  //                                         from that group
  //   ownTierOnly: true                    shown only to use cases of exactly this
  //                                         tier, not carried up to higher tiers
  //                                         (the elaborations, which ask why the use
  //                                         case is in its tier)
  // Field options:
  //   derivedFromIntake: "useCaseName" | "operationalArea"  prefilled from intake
  //   summary: "deployment"                 shown in the review summary card
  // ---------------------------------------------------------------------------
  tiers: [
    {
      level: 1,
      name: "Tier 1",
      label: "Baseline",
      abbr: "T1",
      headline: "Baseline Documentation",
      docLabel: "Baseline",
      short:
        "Use cases that do not target, analyze, or address individual players. They operate on aggregates, documents, internal users, or non-player data.",
      definition:
        "Tier 1 use cases do not target, analyze, or address individual players. They operate on aggregates, documents, internal users, or non-player data.",
      description:
        "Tier 1 use cases operate on aggregates, internal documents or users, and/or non-player data. Baseline documentation captures what the system is and who is responsible.",
      examples: [
        "Document summarization / translation tools",
        "Employee productivity copilots",
        "Spam filtering",
        "Aggregated operational analytics",
        "Internal scheduling systems",
      ],
      sections: [
        {
          id: "t1-s1",
          title: "Use Case Overview",
          fields: [
            {
              id: "A1.1",
              name: "Use Case Name",
              prompt:
                "Provide the name used internally to identify this AI system or use case.",
              kind: "text",
              derivedFromIntake: "useCaseName",
            },
            {
              id: "A1.2",
              name: "Use Case Summary",
              prompt:
                "Briefly describe what this use case does — its primary purpose and how it is used operationally.",
              kind: "textarea",
            },
            {
              id: "A1.3",
              name: "System Type",
              prompt:
                "Identify the type of AI or automated system being used (e.g., machine learning, conversational AI, rule-based system).",
              kind: "text",
            },
            {
              id: "A1.4",
              name: "Operational Area",
              prompt:
                "Identify the primary operational area where the use case is deployed (e.g., marketing, customer support, surveillance, responsible gambling, AML, fraud, operations).",
              kind: "text",
              derivedFromIntake: "operationalArea",
            },
            {
              id: "A1.5",
              name: "Deployment Status",
              prompt:
                "Indicate whether the use case is in testing, pilot, active deployment, or paused.",
              kind: "select",
              options: ["Testing", "Pilot", "Active deployment", "Paused"],
              summary: "deployment",
            },
            {
              id: "A1.6",
              name: "External Dependencies",
              prompt:
                "Identify any external APIs, platforms, tools, datasets, or third-party services relied upon by the supporting AI system.",
              kind: "textarea",
            },
          ],
        },
        {
          id: "t1-s2",
          title: "Contact Information",
          fields: [
            {
              id: "A1.7",
              name: "Organization Contact",
              prompt:
                "Provide the primary contact responsible for this submission.",
              kind: "contact",
              subfields: [
                { key: "name", label: "Name", type: "text" },
                { key: "role", label: "Role / Title", type: "text" },
                { key: "department", label: "Department", type: "text" },
                { key: "email", label: "Email", type: "email" },
              ],
            },
          ],
        },
      ],
    },
    {
      level: 2,
      name: "Tier 2",
      label: "Extended",
      abbr: "T2",
      headline: "Extended Documentation",
      docLabel: "Extended",
      short:
        "Use cases that target, analyze, or communicate with individual players, but whose outputs do not materially affect a consequential player outcome. Outputs are advisory in a non-directive sense, expressive, or experiential.",
      definition:
        "Tier 2 use cases target, analyze, or communicate with individual players, but their outputs do not materially affect a consequential player outcome. Outputs are advisory in a non-directive sense, expressive, or experiential.",
      description:
        "Tier 2 outputs are advisory in a non-directive sense, expressive, or experiential. Extended documentation covers player interaction, transparency, and internal governance in addition to baseline fields.",
      examples: [
        "AI customer support assistant",
        "AI-generated marketing copy",
        "Responsible gambling educational messaging",
        "A chatbot that only answers basic FAQs",
        "Segmentation for general marketing",
      ],
      sections: [
        {
          id: "t2-s1",
          title: "Elaboration",
          contextFrom: "t2",
          ownTierOnly: true,
          fields: [
            {
              id: "B1.1",
              name: "Player Interaction",
              prompt:
                "Describe how the use case directly communicates with players, personalizes player-facing outputs, or analyzes/classifies player behavior to inform advisory, expressive, or experiential business decisions.",
              kind: "textarea",
            },
          ],
        },
        {
          id: "t2-s2",
          title: "Transparency",
          fields: [
            {
              id: "B2.1",
              name: "AI Disclosure to Users",
              prompt:
                "If applicable, describe how users are informed about this AI system and its role in communications, recommendations, personalization, or decisions. If such disclosure is not provided, briefly note why.",
              kind: "textarea",
            },
            {
              id: "B2.2",
              name: "User Opt-Out",
              prompt:
                "Describe any mechanisms allowing users to limit or opt out of this use case where operationally feasible. If such mechanisms are not in place, briefly note why.",
              kind: "textarea",
            },
            {
              id: "B2.3",
              name: "Information Disclosure",
              prompt:
                "Describe how the use case and/or supporting AI system are disclosed to relevant audiences (e.g., regulators, auditors, oversight bodies, and/or customers). If such disclosures are not made, briefly note why.",
              kind: "textarea",
            },
          ],
        },
        {
          id: "t2-s3",
          title: "Internal Governance",
          fields: [
            {
              id: "B3.1",
              name: "Documentation",
              prompt:
                "Describe how major updates, revisions, retraining events, or operational modifications are documented internally. If a model card or equivalent structured documentation template exists for this use case, please describe it.",
              kind: "textarea",
            },
            {
              id: "B3.2",
              name: "Performance Review",
              prompt:
                "Describe the general processes used to review performance and address identified concerns after deployment. If such processes are not in place, briefly note why.",
              kind: "textarea",
            },
            {
              id: "B3.3",
              name: "Human Oversight",
              prompt:
                "Describe any human oversight mechanisms associated with this use case, including circumstances in which personnel may review outputs, supervise system-supported processes, or intervene when concerns arise. If no human oversight is in place, briefly note why.",
              kind: "textarea",
            },
            {
              id: "B3.5",
              name: "External Review",
              prompt:
                "Indicate whether this use case and/or the underlying AI system has undergone any external assessments, independent reviews, or third-party evaluations. If applicable, briefly describe the nature of these activities. If none have been conducted, briefly note why.",
              kind: "textarea",
            },
          ],
        },
      ],
    },
    {
      level: 3,
      name: "Tier 3",
      label: "Comprehensive",
      abbr: "T3",
      headline: "Comprehensive Documentation",
      docLabel: "Comprehensive",
      short:
        "Use cases that can materially affect a consequential player outcome by automating, determining, recommending, or directively influencing decisions about access, money, protection, identity, or consequential operational decisions.",
      definition:
        "Tier 3 use cases can materially affect a consequential player outcome by automating, determining, recommending, or directively influencing decisions about:",
      description:
        "Tier 3 use cases automate, determine, recommend, or directively influence consequential decisions about individual players. Comprehensive documentation adds player impact, data privacy, and risk mitigation on top of all lower tiers.",
      categories: [
        { label: "Access", body: "account status, restrictions, exclusions, eligibility" },
        { label: "Money", body: "deposits, withdrawals, limits, affordability, wagering decisions" },
        { label: "Protection", body: "RG interventions, vulnerability classifications, harm-prevention measures" },
        { label: "Identity", body: "biometric ID, KYC determinations" },
        { label: "Consequential operational decisions", body: "differential treatment, dynamic pricing or odds, fraud determinations, or AML escalation" },
      ],
      examples: [
        "Affordability assessments",
        "RG risk scoring and intervention triggering",
        "Vulnerability classification",
        "Biometric ID / KYC systems",
        "AML systems with automated escalation enforcement actions",
        "A chatbot providing gambling recommendations, behavioral nudges, or RG directives",
        "Dynamic limits/odds based on behavioral profiling",
        "Open banking integrations affecting account decisions",
      ],
      sections: [
        {
          id: "t3-s1",
          title: "Elaboration",
          contextFrom: "t3",
          ownTierOnly: true,
          fields: [
            {
              id: "C1.1",
              name: "Material Player Impact",
              prompt:
                "Describe how the use case makes or materially influences consequential operational decisions about individuals or affects players' access, money, protection, or identity.",
              kind: "textarea",
            },
            {
              id: "C1.2",
              name: "Use Case Justification",
              prompt:
                "A Tier 3 classification warrants additional deliberation regarding deployment. Describe how the anticipated benefits justify the use of AI for this use case in light of its potential impact (e.g., why was this solution chosen over a 'traditional' method).",
              kind: "textarea",
            },
          ],
        },
        {
          id: "t3-s2",
          title: "Data Privacy and Protection",
          fields: [
            {
              id: "C2.1",
              name: "Sensitive Data",
              prompt:
                "Describe any potentially sensitive data used by the supporting AI system (e.g., behavioral, biometric, financial, geolocation, or other personal data) and explain how these data support the system's functionality or intended purpose.",
              kind: "textarea",
            },
            {
              id: "C2.2",
              name: "Third-Party and Cross-System Data",
              prompt:
                "Describe how external datasets, third-party providers, or cross-system integrations are incorporated into the system, if applicable.",
              kind: "textarea",
            },
            {
              id: "C2.3",
              name: "Data Retention and Protection",
              prompt:
                "Describe how sensitive data associated with the system is stored, retained, protected, managed, and governed throughout the system lifecycle. If such measures are not in place, briefly note why.",
              kind: "textarea",
            },
          ],
        },
        {
          id: "t3-s3",
          title: "Risk Mitigation",
          fields: [
            {
              id: "C3.1",
              name: "Model Evaluation",
              prompt:
                "Describe the methodologies used to evaluate and validate system performance over time, including testing approaches, performance metrics, monitoring thresholds, drift detection processes, and procedures used to investigate and address identified issues. If such measures are not in place, briefly note why.",
              kind: "textarea",
            },
            {
              id: "C3.2",
              name: "Fairness and Bias",
              prompt:
                "Describe how the organization evaluates the use case for unfair, discriminatory, or biased outcomes, including how such risks are identified, tested for, and mitigated. If such evaluations are not performed, briefly note why.",
              kind: "textarea",
            },
            {
              id: "C3.3",
              name: "Explainability",
              prompt:
                "Describe how the outputs, recommendations, or decisions produced by the use case can be reasonably explained or interpreted by relevant stakeholders. If explainability measures are not in place, briefly note why.",
              kind: "textarea",
            },
            {
              id: "C3.4",
              name: "Operational Safeguards",
              prompt:
                "Describe the operational safeguards and incident response procedures established for the AI system, including escalation pathways, rollback capabilities, shutdown procedures, and contingency plans used when significant issues are identified. If such safeguards are not in place, briefly note why.",
              kind: "textarea",
            },
          ],
        },
        {
          id: "t3-s4",
          title: "Model Architecture",
          fields: [
            {
              id: "C4.1",
              name: "System Development",
              prompt:
                "Briefly describe whether the system was developed internally, externally, or through a hybrid approach.",
              kind: "textarea",
            },
            {
              id: "C4.2",
              name: "Training Methodology",
              prompt:
                "Describe at a high level how the system or model was trained, configured, developed, or implemented.",
              kind: "textarea",
            },
            {
              id: "C4.3",
              name: "Incident Documentation",
              prompt:
                "Describe how operational incidents, failures, harmful outputs, or material system issues are documented internally.",
              kind: "textarea",
            },
          ],
        },
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // Interface wording. {0}, {1} are filled in by the app.
  // ---------------------------------------------------------------------------
  ui: {
    returnTitle: "Return to start",
    pageLabel_start: "Home",
    pageLabel_screening: "Screening",
    pageLabel_documentation: "Documentation",
    pageLabel_review: "Review & Submit",
    pageLabel_submitted: "Submitted",
    prog_screening: "Screening",
    prog_documentation: "Documentation",
    prog_review: "Review",
    langAria: "Language",

    tier: "Tier",
    yes: "Yes",
    no: "No",
    continue: "Continue",
    backToScreening: "Back to screening",
    downloadDraft: "Download draft",
    previewSubmission: "Preview submission",
    print: "Print",
    backToEdit: "Back to edit",
    confirmSubmit: "Confirm & submit",
    startAnother: "Start another submission",
    notProvided: "Not provided",
    word: "word",
    words: "words",
    chars: "chars",
    ph_enter: "Enter response…",
    ph_selectStatus: "Select status…",
    ph_describe: "Provide a clear and concrete description…",
    ph_select: "Select…",
    ph_email: "name@organization.com",
    and: "and",

    startSubmission: "Start a new use case submission",
    readFirst: "Read first",
    beginScreening: "Begin screening",
    resumeSubmission: "Resume your submission",
    openSaved: "Open a saved record",
    demoBar: "Demo: this is what your staff would see. Nothing you enter is stored or sent.",
    demoBarLink: "Get the open-source registry",
    demoConfigShow: "What can I change?",
    demoConfigHide: "Hide labels",
    importError: "That file isn't a registry record this registry can open.",
    openOtherVersion: "This record was made with {0} of the registry's questions and fields. This registry is on {1}.",
    openDroppedFields: "{0} answer(s) are for fields this registry no longer has ({1}). They'll be left out when you save or submit.",
    openRescreen: "The screening questions have changed since this record was made, so you'll go through screening again first. Your earlier answers are filled in.",
    openContinue: "Open it anyway?",

    screeningStage: "Screening",
    prog_intake: "Use case intake",
    prog_section: "Section {0} of {1}",
    prog_result: "Result",
    intake_eyebrow: "Step 1 · Use case intake",
    intake_heading: "Identify the use case.",
    intake_sub: "Give this use case a name and identify where in your operations it lives. This will anchor your submission throughout the rest of the registry.",
    intake_nameLabel: "Use case name",
    intake_namePrompt: "Provide the name used internally to identify this AI use case.",
    intake_namePlaceholder: "e.g., RG Risk Scoring v2, Customer Support Copilot",
    intake_areaLabel: "Operational area",
    intake_areaPrompt: "Identify the primary operational area where the system is deployed (e.g., marketing, customer support, surveillance, responsible gambling, AML, fraud, operations).",
    intake_areaPlaceholder: "e.g., Responsible Gambling",
    backToStart: "Back to home",
    continueToScreening: "Continue to screening",
    groupEyebrow: "Screening · Section {0} of {1}",
    answeredOf: "{0} / {1} answered",
    allAnswered: "All questions answered",
    answerAll: "Answer every question to continue",
    backToIntake: "Back to intake",
    backToPrevSection: "Back to previous section",
    result_eyebrow: "Screening result",
    result_headA: "This use case is ",
    result_headB: " and requires {0} documentation.",
    result_subA: "Based on your answers about ",
    result_subIn: " in ",
    thisUseCase: "this use case",
    yourDocumentation: "Your documentation",
    required: "Required",
    notRequired: "Not required",
    reAnswer: "Re-answer screening",
    continueToDoc: "Continue to documentation",

    fieldsCountOf: "{0} / {1} fields",
    docEyebrow: "Documenting use case",
    docTitlePlaceholder: "Untitled use case",
    docAreaLabel: "Operational area",
    docAreaPlaceholder: "e.g., Responsible Gambling",
    sectionWord: "Section",
    contextA: "You indicated this use case ",
    contextB: ". Describe how it does so.",

    previewEyebrow: "Submission preview · Not yet submitted",
    previewTitlePlaceholder: "Untitled use case",
    previewNoteA: "Review your answers below. When they're ready, select ",
    fact_docLevel: "Documentation level",
    fact_area: "Operational area",
    fact_deployment: "Deployment status",
    fact_contact: "Primary contact",
    fieldsComplete: "fields complete",
    allFieldsComplete: "All fields complete",
    fieldsEmptyOne: "{0} field still empty",
    fieldsEmptyMany: "{0} fields still empty",
    sectionXofY: "Section {0} of {1}",
    complete: "✓ Complete",
    nEmpty: "{0} empty",

    submittedEyebrow: "Submitted · {0}",
    submittedHeading: "Record complete.",
    submittedBody: "This registry doesn't store anything itself. Download the record and add it to your organization's inventory.",
    dl_json: "Record (.json)",
    dl_csv: "Spreadsheet row (.csv)",
    dl_template: "Blank inventory spreadsheet (.csv)",
    sending: "Sending to your organization's registry…",
    sentOk: "Also sent to your organization's registry.",
    sentRefused: "Your organization's registry didn't accept the record. Download it instead, and let whoever runs the registry know.",
    sentUnreachable: "Couldn't reach your organization's registry. Check your connection and try again, or download the record instead.",
    sentReason: "Reason: {0}.",
    retrySend: "Try again",
    dash: "—",
    dialogReturnHome: "Return to the homepage? Your in-progress submission will be kept in this session.",
    dialogDiscardWork: "Discard your in-progress submission? This can't be undone.",
    dialogRecordUnsaved: "You haven't downloaded this record, and nothing here keeps a copy. Leave without saving it?",
  },
};

// ═══════════════════════════════════════════════════════════════
// MRXplorer — schema.js
// Structured data for AEO across all pages.
//
// USAGE: Add <script src="schema.js"></script> to every page,
// then call injectSchema(PAGE_TYPE) before </body>.
//
// PAGE TYPES: 'home' | 'about' | 'contact'
//
// Example: <script>injectSchema('home');</script>
// ═══════════════════════════════════════════════════════════════

(function () {

  // ── SHARED BASE ENTITIES ───────────────────────────────────
  // These are referenced across multiple schema types.
  // Update once here and all pages stay in sync.

  const PERSON = {
    "@type": "Person",
    "@id": "https://www.mrxplorer.com/#z-johnson",
    "name": "Z Johnson",
    "givenName": "Z",
    "familyName": "Johnson",
    "jobTitle": "Founder and Principal",
    "description": "AI training consultant for market research agencies and insights teams. 20+ years in research operations. Founder of MRXplorer LLC.",
    "url": "https://www.mrxplorer.com/about",
    "email": "zjohnson@mrxplorer.com",
    "sameAs": [
      "https://www.linkedin.com/in/zontziry/",
      "https://mrxplorations.beehiiv.com"
    ],
    "knowsAbout": [
      "Market Research",
      "Artificial Intelligence",
      "Claude AI",
      "Prompt Engineering",
      "Research Operations",
      "Workflow Automation",
      "AI Training and Education",
      "Insights Technology"
    ],
    "worksFor": { "@id": "https://www.mrxplorer.com/#organization" }
  };

  const ORGANIZATION = {
    "@type": "Organization",
    "@id": "https://www.mrxplorer.com/#organization",
    "name": "MRXplorer LLC",
    "legalName": "MRXplorer LLC",
    "url": "https://www.mrxplorer.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.mrxplorer.com/assets/mrxplorer-logo.png",
      "width": 1466,
      "height": 442
    },
    "description": "MRXplorer trains market research agencies and insights teams to build, prompt, and manage AI workflows using Claude. Education and enablement — not implementation.",
    "email": "zjohnson@mrxplorer.com",
    "founder": { "@id": "https://www.mrxplorer.com/#z-johnson" },
    "foundingDate": "2023",
    "areaServed": "Worldwide",
    "serviceType": [
      "AI Training",
      "Workflow Automation Consulting",
      "Research Operations Consulting",
      "Team Enablement"
    ],
    "sameAs": [
      "https://www.linkedin.com/in/zontziry/",
      "https://mrxplorations.beehiiv.com"
    ],
    "knowsAbout": [
      "Market Research",
      "Artificial Intelligence",
      "Claude AI",
      "Prompt Engineering",
      "Research Operations",
      "Workflow Automation"
    ]
  };

  const WEBSITE = {
    "@type": "WebSite",
    "@id": "https://www.mrxplorer.com/#website",
    "url": "https://www.mrxplorer.com",
    "name": "MRXplorer",
    "description": "AI training for market research teams.",
    "publisher": { "@id": "https://www.mrxplorer.com/#organization" },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.mrxplorer.com/?s={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  // ── COURSE DATA ────────────────────────────────────────────

  const COURSES = {
    beginner: [
      { name: "Prompt Frameworks for Better Results", desc: "Learn how to set up prompts that get you good results — and then how to make the results even better." },
      { name: "AI as a Thinking Partner", desc: "Walk through ways to prompt AI to avoid sycophantic responses and turn it into a tool that pushes on your thinking." },
      { name: "Chat / Projects / Cowork / Code(x)", desc: "Learn what each of these tools are within Claude and ChatGPT and when to use each." },
      { name: "Hallucination, Pricing, and Privacy Basics", desc: "A realistic look at AI's capabilities, privacy best practices, and why everyone talks about token pricing." }
    ],
    intermediate: [
      { name: "Chat / Projects / Cowork / Code(x)", desc: "Learn when to use each tool and build your first mini-app for a market research workflow." },
      { name: "Quantitative Analysis with an LLM", desc: "LLMs can now call Python scripts to analyze data. Learn use cases for quantitative research and realistic limits." },
      { name: "Building and Working with Agents", desc: "Turn repeated prompts into time-saving automations. Learn the difference between a skill and an agent." },
      { name: "Projects — When You Actually Want a Siloed Experience", desc: "Learn how to use projects in Claude and ChatGPT to support brand-side or agency-side client work." },
      { name: "Data Privacy and Security", desc: "What data you should never put into an AI, what settings to use, and best practices for any subscription level." },
      { name: "When to Automate", desc: "Evaluate your own routines and decide what to automate. Work through often-overlooked considerations that impact complexity." }
    ],
    leaders: [
      { name: "AI Foundations for Market Research Leaders", desc: "What AI can actually do, key model differences, and where teams are overestimating or underusing it." },
      { name: "Practical AI", desc: "Use Claude Code or Codex to create agents, prompt tools better, and understand how long automations actually take." },
      { name: "Governance, Risk, and Tool Standardization", desc: "Set acceptable use rules for AI and review privacy/security policies for your organization." },
      { name: "Workflows — Let's Map and Decide (2 weeks)", desc: "Map the steps your teams use to develop studies and identify where AI can make a difference." },
      { name: "Your 90-Day Implementation Plan", desc: "Who should be involved, what steps to take, and your next 90 days to align on tools, governance, and adoption." }
    ]
  };

  function buildCourseSchemas() {
    const schemas = [];
    let position = 1;
    const tiers = [
      { key: 'beginner', level: 'Beginner', price: 79, cohortPrice: 249 },
      { key: 'intermediate', level: 'Intermediate', price: 99, cohortPrice: 499 },
      { key: 'leaders', level: 'Leaders', price: 499, cohortPrice: 2595 }
    ];
    tiers.forEach(tier => {
      COURSES[tier.key].forEach(cls => {
        schemas.push({
          "@type": "Course",
          "name": cls.name,
          "description": cls.desc,
          "provider": { "@id": "https://www.mrxplorer.com/#organization" },
          "author": { "@id": "https://www.mrxplorer.com/#z-johnson" },
          "audience": {
            "@type": "Audience",
            "audienceType": "Market Research Professionals"
          },
          "offers": {
            "@type": "Offer",
            "price": tier.price,
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          },
          "coursePrerequisites": tier.key === 'beginner' ? "None" : tier.key === 'intermediate' ? "Familiarity with AI tools" : "Experience leading research teams"
        });
        position++;
      });
    });
    return schemas;
  }

  // ── PAGE SCHEMAS ───────────────────────────────────────────

  const SCHEMAS = {

    // ── HOME ──────────────────────────────────────────────────
    home: {
      "@context": "https://schema.org",
      "@graph": [
        PERSON,
        ORGANIZATION,
        WEBSITE,
        {
          "@type": "WebPage",
          "@id": "https://www.mrxplorer.com/#webpage",
          "url": "https://www.mrxplorer.com",
          "name": "MRXplorer — Live AI Classes for Market Researchers",
          "description": "Live virtual AI classes for market researchers. Beginner to advanced. Learn prompt engineering, AI agents, governance, and practical workflows from Z Johnson.",
          "isPartOf": { "@id": "https://www.mrxplorer.com/#website" },
          "about": { "@id": "https://www.mrxplorer.com/#organization" },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.mrxplorer.com"
              }
            ]
          }
        },
        ...buildCourseSchemas(),
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What does MRXplorer do?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "MRXplorer teaches live virtual AI classes for market research agencies, insights teams, and research leaders. Classes cover beginner through advanced topics including prompt engineering, AI agents, governance, and workflow automation."
              }
            },
            {
              "@type": "Question",
              "name": "Who are MRXplorer classes for?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "MRXplorer classes are for boutique research agencies, in-house insights teams, and research leaders who want to build practical AI skills. Three tracks available: Beginner, Intermediate, and Leaders."
              }
            },
            {
              "@type": "Question",
              "name": "How much do classes cost?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Beginner classes are $79 each or $249 for the full cohort. Intermediate classes are $99 each or $499 for the full cohort. Leaders classes are $499 each or $2,595 for the full cohort."
              }
            },
            {
              "@type": "Question",
              "name": "How do I register for classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Browse the class catalog at mrxplorer.com, select your classes, and check out via Stripe. You'll receive a confirmation email with class details and a calendar invite."
              }
            }
          ]
        }
      ]
    },

    // ── ABOUT ─────────────────────────────────────────────────
    about: {
      "@context": "https://schema.org",
      "@graph": [
        PERSON,
        ORGANIZATION,
        WEBSITE,
        {
          "@type": "WebPage",
          "@id": "https://www.mrxplorer.com/about#webpage",
          "url": "https://www.mrxplorer.com/about",
          "name": "About Z Johnson — MRXplorer",
          "description": "Z Johnson is a market research operations veteran and AI training consultant with 20+ years of experience. Founder of MRXplorer LLC.",
          "isPartOf": { "@id": "https://www.mrxplorer.com/#website" },
          "about": { "@id": "https://www.mrxplorer.com/#z-johnson" },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.mrxplorer.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "About",
                "item": "https://www.mrxplorer.com/about"
              }
            ]
          }
        },
        {
          "@type": "ProfilePage",
          "mainEntity": { "@id": "https://www.mrxplorer.com/#z-johnson" },
          "url": "https://www.mrxplorer.com/about",
          "name": "Z Johnson — Founder of MRXplorer",
          "description": "Professional profile and background of Z Johnson, AI training consultant and market research operations expert."
        }
      ]
    },

    // ── CONTACT ───────────────────────────────────────────────
    contact: {
      "@context": "https://schema.org",
      "@graph": [
        PERSON,
        ORGANIZATION,
        WEBSITE,
        {
          "@type": "WebPage",
          "@id": "https://www.mrxplorer.com/contact#webpage",
          "url": "https://www.mrxplorer.com/contact",
          "name": "Contact MRXplorer — Book a Training Consultation",
          "description": "Book a free training consultation with Z Johnson at MRXplorer. Bring your workflow diagnostic results and skip straight to the work.",
          "isPartOf": { "@id": "https://www.mrxplorer.com/#website" },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.mrxplorer.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Contact",
                "item": "https://www.mrxplorer.com/contact"
              }
            ]
          }
        },
        {
          "@type": "ContactPage",
          "url": "https://www.mrxplorer.com/contact",
          "name": "Book a Training Consultation",
          "description": "Schedule a free training consultation with Z Johnson to review your workflow diagnostic results and map your AI training roadmap.",
          "mainEntity": {
            "@type": "ContactPoint",
            "contactType": "Sales and Consulting Inquiries",
            "email": "zjohnson@mrxplorer.com",
            "availableLanguage": "English",
            "areaServed": "Worldwide"
          }
        }
      ]
    }

  };

  // ── INJECT FUNCTION ────────────────────────────────────────
  window.injectSchema = function (pageType) {
    const schema = SCHEMAS[pageType];
    if (!schema) {
      console.warn('MRXplorer schema: unknown page type "' + pageType + '"');
      return;
    }
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
  };

})();

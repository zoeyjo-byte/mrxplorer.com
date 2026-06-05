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
      "url": "https://www.mrxplorer.com/assets/MRXplorer_Logo_PNG.png",
      "width": 400,
      "height": 120
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
          "name": "MRXplorer — AI Training for Market Research Teams",
          "description": "Z Johnson teaches market research agencies and insights teams how to build, prompt, and manage AI workflows using Claude. Training, not implementation.",
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
        {
          "@type": "Service",
          "@id": "https://www.mrxplorer.com/#workflow-diagnostic",
          "name": "Workflow Diagnostic",
          "description": "A free diagnostic tool that identifies which of your research workflows have the highest AI automation potential — and which need a staged approach.",
          "url": "https://www.mrxplorer.com/diagnostic",
          "provider": { "@id": "https://www.mrxplorer.com/#organization" },
          "serviceType": "AI Readiness Assessment",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          }
        },
        {
          "@type": "Service",
          "@id": "https://www.mrxplorer.com/#training-consultation",
          "name": "Training Consultation",
          "description": "A focused session reviewing your diagnostic results, sequencing your AI training roadmap, and identifying your team's first real AI capability.",
          "url": "https://www.mrxplorer.com/contact",
          "provider": { "@id": "https://www.mrxplorer.com/#organization" },
          "serviceType": "AI Training Consultation"
        },
        {
          "@type": "Service",
          "@id": "https://www.mrxplorer.com/#ai-insights-residency",
          "name": "AI Insights Residency",
          "description": "A structured training engagement where research teams build real workflows with Claude, Claude Cowork, and Claude Code, guided by an expert with 20+ years in research operations.",
          "url": "https://www.mrxplorer.com/contact",
          "provider": { "@id": "https://www.mrxplorer.com/#organization" },
          "serviceType": "AI Training Program"
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What does MRXplorer do?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "MRXplorer trains market research agencies and insights teams to build and manage AI workflows themselves using Claude. The model is education and enablement — not building tools for clients or implementing automation on their behalf."
              }
            },
            {
              "@type": "Question",
              "name": "Who is MRXplorer for?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "MRXplorer works with boutique research agencies, in-house insights teams, and research technology companies that want to build internal AI capabilities without relying on vendors to do it for them."
              }
            },
            {
              "@type": "Question",
              "name": "What AI tools does MRXplorer train teams on?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "MRXplorer training focuses on Claude, Claude Cowork, and Claude Code — Anthropic's suite of AI tools — applied specifically to market research and insights workflows."
              }
            },
            {
              "@type": "Question",
              "name": "How do I get started with MRXplorer?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Start with the free Workflow Diagnostic at mrxplorer.com/diagnostic. It identifies your highest-potential automation workflows and generates personalized verdict cards to bring to a training consultation."
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

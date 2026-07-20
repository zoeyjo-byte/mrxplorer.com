import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceDir = path.join(root, 'content', 'articles');
const outputDir = path.join(root, 'articles');
const site = 'https://www.mrxplorer.com';
const template = await fs.readFile(path.join(outputDir, 'template.html'), 'utf8');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function parseSource(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Article is missing front matter');
  const frontMatter = Object.fromEntries(match[1].split('\n').map((line) => {
    const separator = line.indexOf(':');
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
  return { frontMatter, body: match[2].trim() };
}

function markdownToHtml(markdown) {
  const lines = markdown.split('\n');
  const output = [];
  let paragraph = [];
  let list = [];
  let quote = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      output.push(`<p>${escapeHtml(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      output.push(`<ol>${list.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`);
      list = [];
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      output.push(`<blockquote>${escapeHtml(quote.join(' '))}</blockquote>`);
      quote = [];
    }
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushQuote();
    } else if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      flushQuote();
      output.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    } else if (/^\d+\. /.test(line)) {
      flushParagraph();
      flushQuote();
      list.push(line.replace(/^\d+\. /, ''));
    } else if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      quote.push(line.slice(2));
    } else {
      flushList();
      flushQuote();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();
  flushQuote();
  return output.join('\n\n');
}

function formatDate(isoDate) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

// AEO crawlers fetch one page at a time and cannot resolve @id references
// defined on other pages, so these entity nodes are inlined into every graph.
const webSiteNode = {
  '@type': 'WebSite',
  '@id': `${site}/#website`,
  url: site,
  name: 'MRXplorer',
  description: 'AI training for market research teams.',
  publisher: { '@id': `${site}/#organization` },
};

const organizationNode = {
  '@type': 'Organization',
  '@id': `${site}/#organization`,
  name: 'MRXplorer LLC',
  url: site,
  logo: {
    '@type': 'ImageObject',
    url: `${site}/assets/mrxplorer-logo.png`,
    width: 1466,
    height: 442,
  },
  sameAs: [
    'https://www.linkedin.com/in/zontziry/',
    'https://mrxplorations.beehiiv.com',
  ],
};

const personNode = {
  '@type': 'Person',
  '@id': `${site}/#z-johnson`,
  name: 'Z Johnson',
  jobTitle: 'Founder and Principal',
  description: 'AI training consultant for market research agencies and insights teams. 20+ years in research operations. Founder of MRXplorer LLC.',
  url: `${site}/about`,
  sameAs: [
    'https://www.linkedin.com/in/zontziry/',
    'https://mrxplorations.beehiiv.com',
  ],
  worksFor: { '@id': `${site}/#organization` },
};

function articleSchema(article) {
  const url = `${site}/articles/${article.slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: article.title,
        description: article.description,
        isPartOf: { '@id': `${site}/#website` },
        about: { '@id': `${site}/#organization` },
        datePublished: article.datePublished,
        dateModified: article.dateModified,
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: site },
          { '@type': 'ListItem', position: 2, name: 'Articles', item: `${site}/articles` },
          { '@type': 'ListItem', position: 3, name: article.title, item: url },
        ],
      },
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        mainEntityOfPage: { '@id': `${url}#webpage` },
        headline: article.title,
        description: article.description,
        author: { '@id': `${site}/#z-johnson` },
        publisher: { '@id': `${site}/#organization` },
        datePublished: article.datePublished,
        dateModified: article.dateModified,
        image: {
          '@type': 'ImageObject',
          url: `${site}/assets/mrxplorer-logo-social.png`,
          width: 1200,
          height: 630,
        },
      },
      webSiteNode,
      organizationNode,
      personNode,
    ],
  };
}

function byline(article) {
  let html = `By <a href="/about">Z Johnson</a> · Published <time datetime="${article.datePublished}">${formatDate(article.datePublished)}</time>`;
  if (article.dateModified !== article.datePublished) {
    html += ` · Updated <time datetime="${article.dateModified}">${formatDate(article.dateModified)}</time>`;
  }
  return html;
}

const files = (await fs.readdir(sourceDir)).filter(file => file.endsWith('.md')).sort();
const articles = [];
for (const file of files) {
  const { frontMatter, body } = parseSource(await fs.readFile(path.join(sourceDir, file), 'utf8'));
  const article = {
    title: frontMatter.title,
    slug: frontMatter.slug,
    description: frontMatter.description,
    teaser: frontMatter.teaser || frontMatter.description,
    order: Number(frontMatter.order) || Number.MAX_SAFE_INTEGER,
    datePublished: frontMatter.datePublished,
    dateModified: frontMatter.dateModified || frontMatter.datePublished,
  };
  articles.push(article);
  const url = `/articles/${article.slug}`;
  let page = template
    .replace(/\s*<meta name="robots" content="noindex,follow">\n/, '\n')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(article.title)} | MRXplorer</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(article.description)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(article.title)} | MRXplorer">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(article.description)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="https://www.mrxplorer.com${url}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="https://www.mrxplorer.com${url}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtml(article.title)} | MRXplorer">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtml(article.description)}">`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${JSON.stringify(articleSchema(article), null, 2)}\n</script>`)
    .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${escapeHtml(article.title)}</h1>`)
    .replace(/<p style="font-size: 0\.9rem; color: var\(--gray-mid\);">[\s\S]*?<\/p>/, `<p style="font-size: 0.9rem; color: var(--gray-mid);">${byline(article)}</p>`)
    .replace(/<div class="prose" style="max-width: 720px;">[\s\S]*?<\/div>/, `<div class="prose" style="max-width: 720px;">\n${markdownToHtml(body)}\n</div>`);

  const destination = path.join(outputDir, article.slug, 'index.html');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, page);
}

// ── Articles index page ──────────────────────────────────────────
// Regenerates the schema, card grid, and last-updated line inside
// articles/index.html so the listing can never drift from the content.

articles.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
const firstPublished = articles.map(a => a.datePublished).sort()[0];
const lastUpdated = articles.map(a => a.dateModified).sort().at(-1);

function indexSchema() {
  const url = `${site}/articles`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#webpage`,
        url,
        name: 'Articles — MRXplorer | AI for Market Researchers',
        description: 'Practical articles on AI for market research: prompt engineering, AI governance, workflow automation, and how research teams are using AI in 2026.',
        isPartOf: { '@id': `${site}/#website` },
        about: { '@id': `${site}/#organization` },
        author: { '@id': `${site}/#z-johnson` },
        datePublished: firstPublished,
        dateModified: lastUpdated,
        breadcrumb: { '@id': `${url}#breadcrumb` },
        mainEntity: { '@id': `${url}#list` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: site },
          { '@type': 'ListItem', position: 2, name: 'Articles', item: url },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#list`,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: articles.length,
        itemListElement: articles.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: article.title,
          url: `${site}/articles/${article.slug}`,
        })),
      },
      webSiteNode,
      organizationNode,
      personNode,
    ],
  };
}

const indexCards = articles.map(article => `          <a class="what-card" href="/articles/${article.slug}">
            <h3>${escapeHtml(article.title)}</h3>
            <p>${escapeHtml(article.teaser)}</p>
            <p style="font-size: 0.85rem; margin-bottom: 0;"><time datetime="${article.datePublished}">${formatDate(article.datePublished)}</time></p>
          </a>`).join('\n');

const lastUpdatedLine = `<p style="font-size: 0.9rem; color: var(--gray-mid); margin-bottom: 3rem;">Written by <a href="/about">Z Johnson</a> · Last updated <time datetime="${lastUpdated}">${formatDate(lastUpdated)}</time></p>`;

const indexPath = path.join(outputDir, 'index.html');
const indexPage = (await fs.readFile(indexPath, 'utf8'))
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${JSON.stringify(indexSchema(), null, 2)}\n</script>`)
  .replace(/<!-- BEGIN GENERATED: last-updated -->[\s\S]*?<!-- END GENERATED: last-updated -->/, `<!-- BEGIN GENERATED: last-updated -->\n        ${lastUpdatedLine}\n        <!-- END GENERATED: last-updated -->`)
  .replace(/<!-- BEGIN GENERATED: article-cards -->[\s\S]*?<!-- END GENERATED: article-cards -->/, `<!-- BEGIN GENERATED: article-cards -->\n${indexCards}\n          <!-- END GENERATED: article-cards -->`);
await fs.writeFile(indexPath, indexPage);

console.log(`Generated ${files.length} article pages and the articles index.`);

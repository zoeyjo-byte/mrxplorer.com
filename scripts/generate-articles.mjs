import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceDir = path.join(root, 'content', 'articles');
const outputDir = path.join(root, 'articles');
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

function articleSchema(article) {
  const url = `https://www.mrxplorer.com/articles/${article.slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: article.title,
        description: article.description,
        isPartOf: { '@id': 'https://www.mrxplorer.com/#website' },
        about: { '@id': 'https://www.mrxplorer.com/#organization' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mrxplorer.com' },
            { '@type': 'ListItem', position: 2, name: 'Articles', item: 'https://www.mrxplorer.com/articles' },
            { '@type': 'ListItem', position: 3, name: article.title, item: url },
          ],
        },
      },
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        mainEntityOfPage: { '@id': url },
        headline: article.title,
        description: article.description,
        author: { '@id': 'https://www.mrxplorer.com/#z-johnson' },
        publisher: { '@id': 'https://www.mrxplorer.com/#organization' },
        datePublished: article.datePublished,
        dateModified: article.datePublished,
        image: {
          '@type': 'ImageObject',
          url: 'https://www.mrxplorer.com/assets/mrxplorer-logo-social.png',
          width: 1200,
          height: 630,
        },
      },
    ],
  };
}

const files = (await fs.readdir(sourceDir)).filter(file => file.endsWith('.md')).sort();
for (const file of files) {
  const { frontMatter, body } = parseSource(await fs.readFile(path.join(sourceDir, file), 'utf8'));
  const article = {
    title: frontMatter.title,
    slug: frontMatter.slug,
    description: frontMatter.description,
    datePublished: frontMatter.datePublished,
  };
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
    .replace(/<p style="font-size: 0\.9rem; color: var\(--gray-mid\);">[\s\S]*?<\/p>/, `<p style="font-size: 0.9rem; color: var(--gray-mid);">By Z Johnson · Published ${new Date(`${article.datePublished}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</p>`)
    .replace(/<div class="prose" style="max-width: 720px;">[\s\S]*?<\/div>/, `<div class="prose" style="max-width: 720px;">\n${markdownToHtml(body)}\n</div>`);

  const destination = path.join(outputDir, article.slug, 'index.html');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, page);
}

console.log(`Generated ${files.length} article pages.`);

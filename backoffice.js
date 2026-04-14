/* ============================================================
   Rise Up Benefits — SEO Backoffice Engine
   Audit, AI Tools, Reports
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initAuditPanel();
  initAITools();
  initReportsPanel();
});

/* ================================================================
   NAVIGATION
   ================================================================ */
function initNavigation() {
  const links = document.querySelectorAll('.bo-nav-link[data-panel]');
  const panels = document.querySelectorAll('.bo-panel');
  const topTitle = document.getElementById('topbar-title');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.bo-sidebar');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPanel = link.dataset.panel;

      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      panels.forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(targetPanel);
      if (panel) panel.classList.add('active');

      if (topTitle) topTitle.textContent = link.textContent.trim();

      if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
      }
    });
  });

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

/* ================================================================
   SEO AUDIT ENGINE
   ================================================================ */
class SEOAuditor {
  constructor() {
    this.doc = null;
    this.html = '';
    this.results = {};
    this.issues = [];
    this.score = 0;
  }

  async fetchAndParse(url = './index.html') {
    // Method 1: fetch (http/https)
    try {
      const response = await fetch(url);
      if (response.ok) {
        this.html = await response.text();
        if (this.html.length > 100) {
          const parser = new DOMParser();
          this.doc = parser.parseFromString(this.html, 'text/html');
          return this.doc;
        }
      }
    } catch (e) { /* Continue to fallback */ }

    // Method 2: XMLHttpRequest
    try {
      const html = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = () => resolve(xhr.responseText);
        xhr.onerror = () => reject(new Error('XHR failed'));
        xhr.send();
      });
      if (html && html.length > 100) {
        this.html = html;
        const parser = new DOMParser();
        this.doc = parser.parseFromString(this.html, 'text/html');
        return this.doc;
      }
    } catch (e) { /* Continue to fallback */ }

    // Method 3: iframe same-origin
    try {
      const doc = await new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:-9999px;width:1px;height:1px;opacity:0;';
        iframe.src = url;
        iframe.onload = () => {
          try {
            const iDoc = iframe.contentDocument;
            if (iDoc && iDoc.documentElement.outerHTML.length > 100) {
              resolve(iDoc);
            } else {
              reject(new Error('Empty document'));
            }
          } catch (e) { reject(e); }
          finally { setTimeout(() => iframe.remove(), 200); }
        };
        iframe.onerror = () => { iframe.remove(); reject(new Error('iframe failed')); };
        document.body.appendChild(iframe);
      });
      this.doc = doc;
      this.html = doc.documentElement.outerHTML;
      return this.doc;
    } catch (e) { /* Continue to fallback */ }

    // All methods failed — show helper
    throw new Error('FILE_PROTOCOL_BLOCKED');
  }

  runFullAudit() {
    this.issues = [];
    this.results = {
      meta: this.auditMeta(),
      headings: this.auditHeadings(),
      images: this.auditImages(),
      schema: this.auditSchema(),
      links: this.auditLinks(),
      accessibility: this.auditAccessibility(),
      performance: this.auditPerformance(),
      content: this.auditContent(),
      social: this.auditSocial()
    };

    // Calculate weighted score
    const weights = {
      meta: 15, headings: 10, images: 10, schema: 15,
      links: 10, accessibility: 15, performance: 10, content: 10, social: 5
    };

    let totalWeight = 0;
    let weightedScore = 0;
    for (const [key, weight] of Object.entries(weights)) {
      totalWeight += weight;
      weightedScore += (this.results[key].score / 100) * weight;
    }

    this.score = Math.round((weightedScore / totalWeight) * 100);
    return { score: this.score, results: this.results, issues: this.issues };
  }

  /* ---------- Meta Tags ---------- */
  auditMeta() {
    const d = this.doc;
    let score = 0;
    let maxScore = 0;
    const checks = [];

    // Title
    maxScore += 20;
    const title = d.querySelector('title');
    if (title && title.textContent.trim()) {
      const len = title.textContent.trim().length;
      if (len >= 30 && len <= 65) {
        score += 20;
        checks.push({ pass: true, label: `Title: "${title.textContent.trim()}" (${len} chars)` });
      } else {
        score += 10;
        checks.push({ pass: false, label: `Title length: ${len} chars (ideal: 30-65)` });
        this.issues.push({ severity: 'warning', category: 'Meta', msg: `Title tag is ${len} chars — aim for 30-65`, fix: 'Adjust title length for optimal display in search results' });
      }
    } else {
      checks.push({ pass: false, label: 'Missing title tag' });
      this.issues.push({ severity: 'critical', category: 'Meta', msg: 'Missing <title> tag', fix: 'Add a descriptive <title> element in <head>' });
    }

    // Meta description
    maxScore += 20;
    const desc = d.querySelector('meta[name="description"]');
    if (desc && desc.content.trim()) {
      const len = desc.content.trim().length;
      if (len >= 120 && len <= 160) {
        score += 20;
        checks.push({ pass: true, label: `Meta description: ${len} chars` });
      } else {
        score += 10;
        checks.push({ pass: false, label: `Meta description: ${len} chars (ideal: 120-160)` });
        this.issues.push({ severity: 'warning', category: 'Meta', msg: `Meta description is ${len} chars — aim for 120-160`, fix: 'Adjust description length for optimal SERP display' });
      }
    } else {
      checks.push({ pass: false, label: 'Missing meta description' });
      this.issues.push({ severity: 'critical', category: 'Meta', msg: 'Missing meta description', fix: 'Add <meta name="description" content="..."> in <head>' });
    }

    // Keywords
    maxScore += 10;
    const keywords = d.querySelector('meta[name="keywords"]');
    if (keywords && keywords.content.trim()) {
      score += 10;
      checks.push({ pass: true, label: 'Keywords meta tag present' });
    } else {
      checks.push({ pass: false, label: 'Missing keywords meta tag' });
      this.issues.push({ severity: 'info', category: 'Meta', msg: 'No keywords meta tag (low SEO impact but still useful)', fix: 'Consider adding relevant keywords' });
    }

    // Canonical
    maxScore += 15;
    const canonical = d.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) {
      score += 15;
      checks.push({ pass: true, label: `Canonical: ${canonical.href}` });
    } else {
      checks.push({ pass: false, label: 'Missing canonical URL' });
      this.issues.push({ severity: 'warning', category: 'Meta', msg: 'No canonical URL defined', fix: 'Add <link rel="canonical" href="..."> to prevent duplicate content issues' });
    }

    // Robots
    maxScore += 10;
    const robots = d.querySelector('meta[name="robots"]');
    if (robots) {
      score += 10;
      checks.push({ pass: true, label: `Robots: ${robots.content}` });
    } else {
      score += 5;
      checks.push({ pass: false, label: 'No robots meta tag (defaults to index,follow)' });
    }

    // Favicon
    maxScore += 5;
    const favicon = d.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (favicon) {
      score += 5;
      checks.push({ pass: true, label: 'Favicon present' });
    } else {
      checks.push({ pass: false, label: 'Missing favicon' });
      this.issues.push({ severity: 'info', category: 'Meta', msg: 'No favicon defined', fix: 'Add a favicon for brand recognition in browser tabs' });
    }

    // Charset
    maxScore += 10;
    const charset = d.querySelector('meta[charset]');
    if (charset) {
      score += 10;
      checks.push({ pass: true, label: `Charset: ${charset.getAttribute('charset')}` });
    } else {
      checks.push({ pass: false, label: 'Missing charset declaration' });
      this.issues.push({ severity: 'warning', category: 'Meta', msg: 'No charset meta tag', fix: 'Add <meta charset="UTF-8">' });
    }

    // Viewport
    maxScore += 10;
    const viewport = d.querySelector('meta[name="viewport"]');
    if (viewport) {
      score += 10;
      checks.push({ pass: true, label: 'Viewport meta tag present' });
    } else {
      checks.push({ pass: false, label: 'Missing viewport meta tag' });
      this.issues.push({ severity: 'critical', category: 'Meta', msg: 'No viewport meta tag — site may not be mobile-friendly', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">' });
    }

    return { score: Math.round((score / maxScore) * 100), checks, label: 'Meta Tags' };
  }

  /* ---------- Headings ---------- */
  auditHeadings() {
    const d = this.doc;
    let score = 0;
    let maxScore = 0;
    const checks = [];

    // H1
    maxScore += 40;
    const h1s = d.querySelectorAll('h1');
    if (h1s.length === 1) {
      score += 40;
      checks.push({ pass: true, label: `One H1: "${h1s[0].textContent.trim().substring(0, 60)}..."` });
    } else if (h1s.length === 0) {
      checks.push({ pass: false, label: 'No H1 tag found' });
      this.issues.push({ severity: 'critical', category: 'Headings', msg: 'Missing H1 tag', fix: 'Add exactly one <h1> element per page' });
    } else {
      score += 20;
      checks.push({ pass: false, label: `Multiple H1s found: ${h1s.length}` });
      this.issues.push({ severity: 'warning', category: 'Headings', msg: `${h1s.length} H1 tags found — should be exactly 1`, fix: 'Use only one H1 per page for clear topic hierarchy' });
    }

    // Hierarchy
    maxScore += 30;
    const allHeadings = d.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let hierarchyValid = true;
    let prevLevel = 0;
    const headingList = [];

    allHeadings.forEach(h => {
      const level = parseInt(h.tagName[1]);
      headingList.push({ level, text: h.textContent.trim().substring(0, 50) });
      if (level > prevLevel + 1 && prevLevel > 0) {
        hierarchyValid = false;
      }
      prevLevel = level;
    });

    if (hierarchyValid && allHeadings.length > 0) {
      score += 30;
      checks.push({ pass: true, label: `Heading hierarchy valid (${allHeadings.length} headings)` });
    } else if (allHeadings.length > 0) {
      score += 15;
      checks.push({ pass: false, label: 'Heading hierarchy has skipped levels' });
      this.issues.push({ severity: 'warning', category: 'Headings', msg: 'Heading levels are skipped (e.g., H1 → H3)', fix: 'Follow sequential heading order: H1 → H2 → H3' });
    }

    // Heading count
    maxScore += 30;
    if (allHeadings.length >= 3) {
      score += 30;
      checks.push({ pass: true, label: `${allHeadings.length} headings total` });
    } else {
      score += 10;
      checks.push({ pass: false, label: `Only ${allHeadings.length} headings — consider adding more structure` });
    }

    return { score: Math.round((score / maxScore) * 100), checks, label: 'Headings', headingList };
  }

  /* ---------- Images ---------- */
  auditImages() {
    const d = this.doc;
    let score = 0;
    let maxScore = 0;
    const checks = [];

    const images = d.querySelectorAll('img');
    const total = images.length;

    if (total === 0) {
      return { score: 100, checks: [{ pass: true, label: 'No images to audit' }], label: 'Images' };
    }

    // Alt text
    maxScore += 50;
    let missingAlt = 0;
    images.forEach(img => {
      if (!img.hasAttribute('alt') || img.alt.trim() === '') missingAlt++;
    });

    if (missingAlt === 0) {
      score += 50;
      checks.push({ pass: true, label: `All ${total} images have alt text` });
    } else {
      const pct = ((total - missingAlt) / total) * 50;
      score += Math.round(pct);
      checks.push({ pass: false, label: `${missingAlt} of ${total} images missing alt text` });
      this.issues.push({ severity: 'warning', category: 'Images', msg: `${missingAlt} image(s) missing alt text`, fix: 'Add descriptive alt attributes to all images for accessibility and SEO' });
    }

    // Dimensions
    maxScore += 25;
    let missingDimensions = 0;
    images.forEach(img => {
      if (!img.hasAttribute('width') || !img.hasAttribute('height')) missingDimensions++;
    });

    if (missingDimensions === 0) {
      score += 25;
      checks.push({ pass: true, label: 'All images have width/height attributes' });
    } else {
      checks.push({ pass: false, label: `${missingDimensions} images missing explicit dimensions` });
      this.issues.push({ severity: 'info', category: 'Images', msg: `${missingDimensions} image(s) missing width/height`, fix: 'Add width and height attributes to prevent layout shift (CLS)' });
    }

    // Lazy loading
    maxScore += 25;
    let lazyCount = 0;
    images.forEach(img => {
      if (img.loading === 'lazy') lazyCount++;
    });
    if (lazyCount > 0) {
      score += 25;
      checks.push({ pass: true, label: `${lazyCount} images use lazy loading` });
    } else {
      score += 10;
      checks.push({ pass: false, label: 'No images use loading="lazy"' });
      this.issues.push({ severity: 'info', category: 'Images', msg: 'Consider lazy loading below-the-fold images', fix: 'Add loading="lazy" to images not in the viewport' });
    }

    return { score: Math.round((score / maxScore) * 100), checks, label: 'Images', total, missingAlt, missingDimensions };
  }

  /* ---------- Schema/JSON-LD ---------- */
  auditSchema() {
    const d = this.doc;
    let score = 0;
    let maxScore = 0;
    const checks = [];

    const scripts = d.querySelectorAll('script[type="application/ld+json"]');
    const schemas = [];

    scripts.forEach(s => {
      try {
        const data = JSON.parse(s.textContent);
        schemas.push(data);
      } catch (e) {
        this.issues.push({ severity: 'critical', category: 'Schema', msg: 'Invalid JSON-LD — parse error', fix: 'Fix JSON syntax in structured data script' });
      }
    });

    // Has any schema
    maxScore += 30;
    if (schemas.length > 0) {
      score += 30;
      checks.push({ pass: true, label: `${schemas.length} JSON-LD schema(s) found` });
    } else {
      checks.push({ pass: false, label: 'No structured data found' });
      this.issues.push({ severity: 'critical', category: 'Schema', msg: 'No JSON-LD structured data', fix: 'Add schema.org structured data for rich search results' });
    }

    // Check for key types
    const types = schemas.map(s => s['@type']).filter(Boolean);

    maxScore += 20;
    if (types.includes('InsuranceAgency') || types.includes('LocalBusiness') || types.includes('Organization')) {
      score += 20;
      checks.push({ pass: true, label: 'Business schema present: ' + types.filter(t => ['InsuranceAgency', 'LocalBusiness', 'Organization'].includes(t)).join(', ') });
    } else if (schemas.length > 0) {
      checks.push({ pass: false, label: 'No business/organization schema type' });
      this.issues.push({ severity: 'warning', category: 'Schema', msg: 'Missing LocalBusiness/Organization schema', fix: 'Add a LocalBusiness or Organization structured data type' });
    }

    // FAQPage
    maxScore += 15;
    if (types.includes('FAQPage')) {
      score += 15;
      checks.push({ pass: true, label: 'FAQPage schema present' });
    } else if (schemas.length > 0) {
      score += 5;
      checks.push({ pass: false, label: 'No FAQPage schema (optional but recommended)' });
    }

    // AggregateRating
    maxScore += 15;
    const hasRating = schemas.some(s => s.aggregateRating);
    if (hasRating) {
      score += 15;
      checks.push({ pass: true, label: 'AggregateRating found' });
    } else if (schemas.length > 0) {
      checks.push({ pass: false, label: 'No AggregateRating — add for star snippets in search' });
      this.issues.push({ severity: 'info', category: 'Schema', msg: 'No AggregateRating in schema', fix: 'Add an AggregateRating for rich star snippets' });
    }

    // BreadcrumbList
    maxScore += 10;
    if (types.includes('BreadcrumbList')) {
      score += 10;
      checks.push({ pass: true, label: 'BreadcrumbList schema present' });
    }

    // Contact info in schema
    maxScore += 10;
    const hasContact = schemas.some(s => s.telephone || s.email);
    if (hasContact) {
      score += 10;
      checks.push({ pass: true, label: 'Contact information in schema' });
    }

    return { score: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0, checks, label: 'Schema / JSON-LD', types, schemaCount: schemas.length };
  }

  /* ---------- Links ---------- */
  auditLinks() {
    const d = this.doc;
    let score = 0;
    let maxScore = 0;
    const checks = [];

    const allLinks = d.querySelectorAll('a[href]');
    const internal = [];
    const external = [];
    let emptyLinks = 0;
    let noTextLinks = 0;

    allLinks.forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href === '#') {
        emptyLinks++;
      } else if (href.startsWith('http') || href.startsWith('//')) {
        external.push({ href, text: a.textContent.trim() });
      } else {
        internal.push({ href, text: a.textContent.trim() });
      }

      if (!a.textContent.trim() && !a.querySelector('svg, img') && !a.getAttribute('aria-label')) {
        noTextLinks++;
      }
    });

    // Has internal links
    maxScore += 30;
    if (internal.length >= 3) {
      score += 30;
      checks.push({ pass: true, label: `${internal.length} internal links` });
    } else {
      score += 10;
      checks.push({ pass: false, label: `Only ${internal.length} internal links` });
    }

    // External links with rel
    maxScore += 20;
    let noRelCount = 0;
    external.forEach(link => {
      const el = d.querySelector(`a[href="${link.href}"]`);
      if (el && !el.getAttribute('rel')?.includes('noopener')) noRelCount++;
    });

    if (noRelCount === 0 && external.length > 0) {
      score += 20;
      checks.push({ pass: true, label: `All ${external.length} external links have rel="noopener"` });
    } else if (noRelCount > 0) {
      score += 10;
      checks.push({ pass: false, label: `${noRelCount} external links missing rel="noopener"` });
      this.issues.push({ severity: 'info', category: 'Links', msg: `${noRelCount} external links lack rel="noopener"`, fix: 'Add rel="noopener" to all target="_blank" links' });
    } else {
      score += 20;
    }

    // Empty links
    maxScore += 25;
    if (emptyLinks <= 2) {
      score += 25;
      checks.push({ pass: true, label: `${emptyLinks} empty/hash-only links` });
    } else {
      score += 10;
      checks.push({ pass: false, label: `${emptyLinks} empty or hash-only links` });
      this.issues.push({ severity: 'warning', category: 'Links', msg: `${emptyLinks} links with empty or "#" href`, fix: 'Replace empty links with meaningful destinations or buttons' });
    }

    // Link text
    maxScore += 25;
    if (noTextLinks === 0) {
      score += 25;
      checks.push({ pass: true, label: 'All links have accessible text' });
    } else {
      checks.push({ pass: false, label: `${noTextLinks} links without accessible text` });
      this.issues.push({ severity: 'warning', category: 'Links', msg: `${noTextLinks} links lack text or aria-label`, fix: 'Add descriptive text or aria-label to all links' });
    }

    return {
      score: Math.round((score / maxScore) * 100), checks, label: 'Links',
      totalLinks: allLinks.length, internalCount: internal.length, externalCount: external.length
    };
  }

  /* ---------- Accessibility ---------- */
  auditAccessibility() {
    const d = this.doc;
    let score = 0;
    let maxScore = 0;
    const checks = [];

    // lang attribute
    maxScore += 15;
    const lang = d.documentElement.getAttribute('lang');
    if (lang) {
      score += 15;
      checks.push({ pass: true, label: `HTML lang="${lang}"` });
    } else {
      checks.push({ pass: false, label: 'Missing html lang attribute' });
      this.issues.push({ severity: 'critical', category: 'Accessibility', msg: 'No lang attribute on <html>', fix: 'Add lang="en" to the <html> element' });
    }

    // Skip link
    maxScore += 10;
    const skipLink = d.querySelector('a[href="#main-content"], a[href="#main"]');
    if (skipLink) {
      score += 10;
      checks.push({ pass: true, label: 'Skip-to-content link present' });
    } else {
      checks.push({ pass: false, label: 'Missing skip-to-content link' });
      this.issues.push({ severity: 'info', category: 'Accessibility', msg: 'No skip navigation link', fix: 'Add a skip-to-content link for keyboard users' });
    }

    // ARIA labels on nav
    maxScore += 15;
    const navs = d.querySelectorAll('nav');
    let navsWithLabel = 0;
    navs.forEach(n => {
      if (n.getAttribute('aria-label') || n.getAttribute('aria-labelledby')) navsWithLabel++;
    });
    if (navs.length > 0 && navsWithLabel === navs.length) {
      score += 15;
      checks.push({ pass: true, label: `All ${navs.length} nav elements have ARIA labels` });
    } else if (navs.length > 0) {
      score += 7;
      checks.push({ pass: false, label: `${navs.length - navsWithLabel} nav(s) missing ARIA labels` });
    } else {
      score += 15;
    }

    // Semantic elements
    maxScore += 15;
    const semanticEls = ['main', 'header, .navbar', 'footer', 'section', 'article'];
    let semanticCount = 0;
    semanticEls.forEach(sel => {
      if (d.querySelector(sel)) semanticCount++;
    });
    if (semanticCount >= 4) {
      score += 15;
      checks.push({ pass: true, label: `${semanticCount}/5 semantic elements used` });
    } else {
      score += Math.round((semanticCount / 5) * 15);
      checks.push({ pass: false, label: `Only ${semanticCount}/5 semantic elements` });
    }

    // Form labels
    maxScore += 15;
    const inputs = d.querySelectorAll('input, textarea, select');
    let unlabeled = 0;
    inputs.forEach(input => {
      const id = input.id;
      if (!id || !d.querySelector(`label[for="${id}"]`)) unlabeled++;
    });
    if (inputs.length > 0 && unlabeled === 0) {
      score += 15;
      checks.push({ pass: true, label: 'All form inputs have labels' });
    } else if (inputs.length === 0) {
      score += 15;
    } else {
      checks.push({ pass: false, label: `${unlabeled} form input(s) without labels` });
      this.issues.push({ severity: 'warning', category: 'Accessibility', msg: `${unlabeled} form fields without associated labels`, fix: 'Use <label for="id"> for every input' });
    }

    // Buttons with accessible names
    maxScore += 15;
    const buttons = d.querySelectorAll('button');
    let namelessBtns = 0;
    buttons.forEach(btn => {
      if (!btn.textContent.trim() && !btn.getAttribute('aria-label') && !btn.querySelector('svg')) namelessBtns++;
    });
    if (namelessBtns === 0) {
      score += 15;
      checks.push({ pass: true, label: 'All buttons have accessible names' });
    } else {
      checks.push({ pass: false, label: `${namelessBtns} button(s) without accessible names` });
    }

    // ARIA roles on sections
    maxScore += 15;
    const sections = d.querySelectorAll('section[aria-label], section[aria-labelledby]');
    const totalSections = d.querySelectorAll('section').length;
    if (totalSections > 0 && sections.length === totalSections) {
      score += 15;
      checks.push({ pass: true, label: `All ${totalSections} sections have ARIA labels` });
    } else if (totalSections > 0) {
      score += Math.round((sections.length / totalSections) * 15);
      checks.push({ pass: false, label: `${totalSections - sections.length} sections missing ARIA labels` });
    } else {
      score += 15;
    }

    return { score: Math.round((score / maxScore) * 100), checks, label: 'Accessibility' };
  }

  /* ---------- Performance Indicators ---------- */
  auditPerformance() {
    const d = this.doc;
    let score = 0;
    let maxScore = 0;
    const checks = [];

    // Viewport meta
    maxScore += 20;
    if (d.querySelector('meta[name="viewport"]')) {
      score += 20;
      checks.push({ pass: true, label: 'Viewport meta tag present' });
    }

    // External CSS count
    maxScore += 20;
    const cssLinks = d.querySelectorAll('link[rel="stylesheet"]');
    if (cssLinks.length <= 3) {
      score += 20;
      checks.push({ pass: true, label: `${cssLinks.length} external stylesheet(s)` });
    } else {
      score += 10;
      checks.push({ pass: false, label: `${cssLinks.length} external stylesheets — consider combining` });
    }

    // External scripts
    maxScore += 20;
    const scripts = d.querySelectorAll('script[src]');
    if (scripts.length <= 3) {
      score += 20;
      checks.push({ pass: true, label: `${scripts.length} external script(s)` });
    } else {
      score += 10;
      checks.push({ pass: false, label: `${scripts.length} external scripts — consider combining` });
    }

    // Inline styles
    maxScore += 20;
    const inlineStyles = d.querySelectorAll('[style]');
    if (inlineStyles.length <= 5) {
      score += 20;
      checks.push({ pass: true, label: `${inlineStyles.length} inline style(s)` });
    } else {
      score += 10;
      checks.push({ pass: false, label: `${inlineStyles.length} inline styles — move to CSS` });
      this.issues.push({ severity: 'info', category: 'Performance', msg: `${inlineStyles.length} elements with inline styles`, fix: 'Move inline styles to CSS classes for maintainability' });
    }

    // Font loading
    maxScore += 20;
    const googleFonts = Array.from(d.querySelectorAll('link[href*="fonts.googleapis"]'));
    if (googleFonts.length > 0) {
      score += 15;
      checks.push({ pass: true, label: 'Google Fonts loaded' });
      // Check for display=swap
      const hasSwap = googleFonts.some(l => l.href.includes('display=swap'));
      if (hasSwap) {
        score += 5;
        checks.push({ pass: true, label: 'Font display: swap enabled' });
      } else {
        checks.push({ pass: false, label: 'Missing display=swap on fonts' });
        this.issues.push({ severity: 'info', category: 'Performance', msg: 'Google Fonts not using display=swap', fix: 'Add &display=swap to Google Fonts URL' });
      }
    } else {
      score += 20;
    }

    return { score: Math.round((score / maxScore) * 100), checks, label: 'Performance' };
  }

  /* ---------- Content Analysis ---------- */
  auditContent() {
    const d = this.doc;
    let score = 0;
    let maxScore = 0;
    const checks = [];

    // Get visible text
    const body = d.querySelector('body');
    const text = body ? body.textContent.replace(/\s+/g, ' ').trim() : '';
    const wordCount = text.split(/\s+/).length;

    // Word count
    maxScore += 30;
    if (wordCount >= 300) {
      score += 30;
      checks.push({ pass: true, label: `${wordCount} words (300+ recommended)` });
    } else {
      score += Math.round((wordCount / 300) * 30);
      checks.push({ pass: false, label: `${wordCount} words — aim for 300+` });
      this.issues.push({ severity: 'info', category: 'Content', msg: `Low word count: ${wordCount} (aim for 300+)`, fix: 'Add more meaningful content to improve SEO ranking potential' });
    }

    // Readability (Flesch-Kincaid approx)
    maxScore += 30;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

    let readabilityScore = 0;
    if (sentences.length > 0 && words.length > 0) {
      readabilityScore = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
      readabilityScore = Math.max(0, Math.min(100, readabilityScore));
    }

    if (readabilityScore >= 60) {
      score += 30;
      checks.push({ pass: true, label: `Readability: ${Math.round(readabilityScore)} (easy to read)` });
    } else if (readabilityScore >= 40) {
      score += 20;
      checks.push({ pass: false, label: `Readability: ${Math.round(readabilityScore)} (somewhat difficult)` });
    } else {
      score += 10;
      checks.push({ pass: false, label: `Readability: ${Math.round(readabilityScore)} (difficult)` });
      this.issues.push({ severity: 'warning', category: 'Content', msg: 'Content is difficult to read', fix: 'Use shorter sentences and simpler words' });
    }

    // Keyword in title
    maxScore += 20;
    const title = d.querySelector('title')?.textContent?.toLowerCase() || '';
    const targetKeywords = ['insurance', 'medicare', 'benefits', 'health'];
    const kwInTitle = targetKeywords.filter(kw => title.includes(kw));
    if (kwInTitle.length >= 2) {
      score += 20;
      checks.push({ pass: true, label: `Keywords in title: ${kwInTitle.join(', ')}` });
    } else if (kwInTitle.length >= 1) {
      score += 10;
      checks.push({ pass: false, label: `Limited keywords in title: ${kwInTitle.join(', ')}` });
    }

    // CTA presence
    maxScore += 20;
    const ctas = d.querySelectorAll('.btn-primary, [class*="cta"]');
    if (ctas.length >= 2) {
      score += 20;
      checks.push({ pass: true, label: `${ctas.length} call-to-action elements` });
    } else {
      score += 10;
      checks.push({ pass: false, label: 'Few call-to-action elements' });
    }

    return {
      score: Math.round((score / maxScore) * 100), checks, label: 'Content',
      wordCount, readabilityScore: Math.round(readabilityScore), sentenceCount: sentences.length
    };
  }

  /* ---------- Social / Open Graph ---------- */
  auditSocial() {
    const d = this.doc;
    let score = 0;
    let maxScore = 0;
    const checks = [];

    const ogTags = ['og:title', 'og:description', 'og:type', 'og:url', 'og:site_name'];
    maxScore += 50;
    let ogCount = 0;
    ogTags.forEach(tag => {
      if (d.querySelector(`meta[property="${tag}"]`)) ogCount++;
    });

    if (ogCount === ogTags.length) {
      score += 50;
      checks.push({ pass: true, label: `All ${ogTags.length} Open Graph tags present` });
    } else {
      score += Math.round((ogCount / ogTags.length) * 50);
      checks.push({ pass: false, label: `${ogCount}/${ogTags.length} Open Graph tags` });
      this.issues.push({ severity: 'warning', category: 'Social', msg: `Missing ${ogTags.length - ogCount} Open Graph tag(s)`, fix: 'Add complete OG tags for better social sharing' });
    }

    // Twitter cards
    maxScore += 30;
    const twitterCard = d.querySelector('meta[name="twitter:card"]');
    const twitterTitle = d.querySelector('meta[name="twitter:title"]');
    if (twitterCard && twitterTitle) {
      score += 30;
      checks.push({ pass: true, label: 'Twitter Card tags present' });
    } else {
      score += 10;
      checks.push({ pass: false, label: 'Incomplete Twitter Card tags' });
      this.issues.push({ severity: 'info', category: 'Social', msg: 'Missing or incomplete Twitter Card meta tags', fix: 'Add twitter:card, twitter:title, twitter:description' });
    }

    // Geo tags
    maxScore += 20;
    const geoRegion = d.querySelector('meta[name="geo.region"]');
    if (geoRegion) {
      score += 20;
      checks.push({ pass: true, label: 'Geo location tags present' });
    } else {
      checks.push({ pass: false, label: 'No geo tags for local SEO' });
    }

    return { score: Math.round((score / maxScore) * 100), checks, label: 'Social & Sharing' };
  }
}

/* Syllable counter helper */
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

/* ================================================================
   AUTO-FIXER ENGINE
   One-click SEO fix — modifies raw HTML and produces download
   ================================================================ */
class AutoFixer {
  constructor(html, issues) {
    this.originalHtml = html;
    this.html = html;
    this.issues = issues;
    this.fixLog = [];
    this.fixCount = 0;
  }

  /* --- Run all fixes sequentially --- */
  async runAll(logCallback) {
    const fixers = [
      { name: 'Optimizing title tag', fn: () => this.fixTitle() },
      { name: 'Optimizing meta description', fn: () => this.fixMetaDescription() },
      { name: 'Adding missing meta tags', fn: () => this.fixMissingMeta() },
      { name: 'Fixing heading hierarchy', fn: () => this.fixHeadings() },
      { name: 'Adding image alt text', fn: () => this.fixImageAlt() },
      { name: 'Adding image dimensions', fn: () => this.fixImageDimensions() },
      { name: 'Adding lazy loading to images', fn: () => this.fixLazyLoading() },
      { name: 'Adding ARIA labels', fn: () => this.fixAria() },
      { name: 'Fixing external links', fn: () => this.fixExternalLinks() },
      { name: 'Fixing empty hash links', fn: () => this.fixEmptyLinks() },
      { name: 'Optimizing font loading', fn: () => this.fixFontLoading() },
      { name: 'Adding skip-to-content link', fn: () => this.fixSkipLink() },
      { name: 'Ensuring canonical URL', fn: () => this.fixCanonical() },
    ];

    for (const fixer of fixers) {
      logCallback(fixer.name, 'running');
      await this._delay(200); // Visual pacing
      const result = fixer.fn();
      logCallback(fixer.name, result.applied ? 'done' : 'skip', result.detail);
      if (result.applied) this.fixCount++;
      this.fixLog.push({ name: fixer.name, ...result });
      await this._delay(100);
    }

    return { fixedHtml: this.html, fixCount: this.fixCount, log: this.fixLog };
  }

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* --- Individual Fixers --- */

  fixTitle() {
    const titleMatch = this.html.match(/<title>(.*?)<\/title>/i);
    if (!titleMatch) {
      const newTitle = '<title>Rise Up Benefits Group | Medicare & Health Insurance Agent in Chandler, AZ</title>';
      this.html = this.html.replace('</head>', `  ${newTitle}\n</head>`);
      return { applied: true, detail: 'Added missing title tag' };
    }

    const title = titleMatch[1].trim();
    if (title.length >= 30 && title.length <= 65) {
      return { applied: false, detail: `Title already optimal (${title.length} chars)` };
    }

    // Shorten or lengthen title to optimal range
    let newTitle = title;
    if (title.length > 65) {
      // Trim to key part
      newTitle = title.substring(0, 62) + '...';
    } else if (title.length < 30) {
      // Expand with location
      newTitle = title + ' | Insurance Agent in Chandler, AZ';
      if (newTitle.length > 65) newTitle = newTitle.substring(0, 65);
    }

    this.html = this.html.replace(titleMatch[0], `<title>${newTitle}</title>`);
    return { applied: true, detail: `Optimized title from ${title.length} to ${newTitle.length} chars` };
  }

  fixMetaDescription() {
    const descMatch = this.html.match(/<meta\s+name="description"\s+content="(.*?)"\s*\/?>/i);
    if (!descMatch) {
      const newDesc = 'Rise Up Benefits Group is an independent insurance agency in Chandler, AZ. Get personalized Medicare, health, life, and long-term care insurance guidance.';
      this.html = this.html.replace('</head>', `  <meta name="description" content="${newDesc}">\n</head>`);
      return { applied: true, detail: 'Added missing meta description' };
    }

    const desc = descMatch[1].trim();
    if (desc.length >= 120 && desc.length <= 160) {
      return { applied: false, detail: `Description already optimal (${desc.length} chars)` };
    }

    let newDesc = desc;
    if (desc.length > 160) {
      newDesc = desc.substring(0, 157) + '...';
    } else if (desc.length < 120) {
      const suffix = ' Free consultation available — contact us today for personalized guidance.';
      newDesc = desc;
      if (!newDesc.endsWith('.')) newDesc += '.';
      newDesc += suffix;
      if (newDesc.length > 160) newDesc = newDesc.substring(0, 157) + '...';
    }

    this.html = this.html.replace(descMatch[0], `<meta name="description" content="${newDesc}">`);
    return { applied: true, detail: `Optimized description from ${desc.length} to ${newDesc.length} chars` };
  }

  fixMissingMeta() {
    let added = [];

    // Keywords
    if (!/<meta\s+name="keywords"/i.test(this.html)) {
      const kw = 'Medicare insurance Chandler AZ, health insurance agent, Medicare Advantage, independent insurance agency, life insurance, dental insurance Arizona';
      this.html = this.html.replace('</head>', `  <meta name="keywords" content="${kw}">\n</head>`);
      added.push('keywords');
    }

    // Robots
    if (!/<meta\s+name="robots"/i.test(this.html)) {
      this.html = this.html.replace('</head>', '  <meta name="robots" content="index, follow">\n</head>');
      added.push('robots');
    }

    // OG tags
    const ogTags = [
      { prop: 'og:title', content: 'Rise Up Benefits Group | Your Trusted Insurance Partner' },
      { prop: 'og:description', content: 'Independent insurance agency specializing in Medicare, health, life, and long-term care insurance.' },
      { prop: 'og:type', content: 'website' },
      { prop: 'og:url', content: 'https://www.riseupbenefitsgroup.com/' },
      { prop: 'og:site_name', content: 'Rise Up Benefits Group' }
    ];
    ogTags.forEach(tag => {
      if (!this.html.includes(`property="${tag.prop}"`)) {
        this.html = this.html.replace('</head>', `  <meta property="${tag.prop}" content="${tag.content}">\n</head>`);
        added.push(tag.prop);
      }
    });

    // Twitter
    if (!/<meta\s+name="twitter:card"/i.test(this.html)) {
      this.html = this.html.replace('</head>',
        '  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="Rise Up Benefits Group | Medicare & Health Insurance">\n  <meta name="twitter:description" content="Independent insurance agency in Chandler, AZ.">\n</head>');
      added.push('twitter:card');
    }

    // Geo
    if (!/<meta\s+name="geo\.region"/i.test(this.html)) {
      this.html = this.html.replace('</head>',
        '  <meta name="geo.region" content="US-AZ">\n  <meta name="geo.placename" content="Chandler, Arizona">\n</head>');
      added.push('geo tags');
    }

    if (added.length === 0) return { applied: false, detail: 'All meta tags already present' };
    return { applied: true, detail: `Added: ${added.join(', ')}` };
  }

  fixHeadings() {
    let fixed = 0;

    // Fix 1: Multiple H1s → keep first, convert rest to H2
    const h1Matches = this.html.match(/<h1[^>]*>.*?<\/h1>/gis);
    if (h1Matches && h1Matches.length > 1) {
      let firstFound = false;
      this.html = this.html.replace(/<h1([^>]*)>(.*?)<\/h1>/gis, (match, attrs, content) => {
        if (!firstFound) { firstFound = true; return match; }
        fixed++;
        return `<h2${attrs}>${content}</h2>`;
      });
    }

    // Fix 2: Missing H1 → promote first H2
    if (!h1Matches || h1Matches.length === 0) {
      if (/<h2[^>]*>/i.test(this.html)) {
        let promoted = false;
        this.html = this.html.replace(/<h2([^>]*)>(.*?)<\/h2>/is, (match, attrs, content) => {
          if (!promoted) { promoted = true; fixed++; return `<h1${attrs}>${content}</h1>`; }
          return match;
        });
      }
    }

    // Fix 3: Skipped heading levels (H2 → H4 should be H2 → H3)
    // Track the last heading level seen and fix any that skip
    let lastLevel = 0;
    const headingRegex = /<(h[1-6])([^>]*)>(.*?)<\/\1>/gis;
    const headings = [];
    let match;

    // Collect all headings with positions
    while ((match = headingRegex.exec(this.html)) !== null) {
      headings.push({
        full: match[0],
        tag: match[1],
        level: parseInt(match[1][1]),
        attrs: match[2],
        content: match[3],
        index: match.index
      });
    }

    // Find skipped levels and build replacements
    lastLevel = 0;
    const replacements = [];
    for (const h of headings) {
      if (lastLevel > 0 && h.level > lastLevel + 1) {
        const correctLevel = lastLevel + 1;
        replacements.push({
          from: h.full,
          to: `<h${correctLevel}${h.attrs}>${h.content}</h${correctLevel}>`,
          oldLevel: h.level,
          newLevel: correctLevel
        });
        lastLevel = correctLevel;
        fixed++;
      } else {
        lastLevel = h.level;
      }
    }

    // Apply replacements (reverse order to preserve positions)
    for (const r of replacements.reverse()) {
      this.html = this.html.replace(r.from, r.to);
    }

    if (fixed === 0) return { applied: false, detail: 'Heading structure looks good' };
    return { applied: true, detail: `Fixed ${fixed} heading level issue(s) for proper hierarchy` };
  }

  fixImageAlt() {
    let fixed = 0;
    const contextKeywords = ['insurance', 'medicare', 'benefits', 'health', 'team', 'office', 'contact'];

    this.html = this.html.replace(/<img([^>]*?)>/gi, (match, attrs) => {
      // Check if alt exists and is non-empty
      const altMatch = attrs.match(/alt="([^"]*)"/i);
      if (altMatch && altMatch[1].trim()) return match; // Already has alt

      // Generate alt from src filename or context
      const srcMatch = attrs.match(/src="([^"]*)"/i);
      let altText = 'Rise Up Benefits Group';

      if (srcMatch) {
        const filename = srcMatch[1].split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        if (filename.length > 3) {
          altText = filename.charAt(0).toUpperCase() + filename.slice(1);
        }
      }

      fixed++;
      if (altMatch) {
        // Has empty alt=""
        return match.replace(/alt=""/i, `alt="${altText}"`);
      } else {
        // No alt attribute at all
        return `<img alt="${altText}"${attrs}>`;
      }
    });

    if (fixed === 0) return { applied: false, detail: 'All images already have alt text' };
    return { applied: true, detail: `Added alt text to ${fixed} image(s)` };
  }

  fixImageDimensions() {
    let fixed = 0;
    this.html = this.html.replace(/<img([^>]*?)>/gi, (match, attrs) => {
      if (/width=/i.test(attrs) && /height=/i.test(attrs)) return match;
      fixed++;
      // Add reasonable defaults
      let newAttrs = attrs;
      if (!/width=/i.test(newAttrs)) newAttrs += ' width="auto"';
      if (!/height=/i.test(newAttrs)) newAttrs += ' height="auto"';
      return `<img${newAttrs}>`;
    });

    if (fixed === 0) return { applied: false, detail: 'All images already have dimensions' };
    return { applied: true, detail: `Added dimension hints to ${fixed} image(s)` };
  }

  fixLazyLoading() {
    let fixed = 0;
    let imgIndex = 0;

    this.html = this.html.replace(/<img([^>]*?)>/gi, (match, attrs) => {
      imgIndex++;
      // Skip first 2 images (likely above the fold)
      if (imgIndex <= 2) return match;
      if (/loading=/i.test(attrs)) return match;

      fixed++;
      return `<img loading="lazy"${attrs}>`;
    });

    if (fixed === 0) return { applied: false, detail: 'Lazy loading already configured' };
    return { applied: true, detail: `Added loading="lazy" to ${fixed} below-fold image(s)` };
  }

  fixAria() {
    let fixed = 0;

    // Add aria-label to nav elements missing them
    this.html = this.html.replace(/<nav(?![^>]*aria-label)([^>]*)>/gi, (match, attrs) => {
      fixed++;
      return `<nav aria-label="Main Navigation"${attrs}>`;
    });

    // Add aria-label to sections
    this.html = this.html.replace(/<section(?![^>]*aria-label)([^>]*?)id="([^"]*)"([^>]*)>/gi, (match, before, id, after) => {
      const label = id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      fixed++;
      return `<section aria-label="${label}"${before}id="${id}"${after}>`;
    });

    if (fixed === 0) return { applied: false, detail: 'ARIA labels already in place' };
    return { applied: true, detail: `Added ARIA labels to ${fixed} element(s)` };
  }

  fixExternalLinks() {
    let fixed = 0;

    this.html = this.html.replace(/<a([^>]*href="https?:\/\/[^"]*"[^>]*)>/gi, (match, attrs) => {
      let newAttrs = attrs;
      let changed = false;

      if (!/target=/i.test(newAttrs)) {
        newAttrs += ' target="_blank"';
        changed = true;
      }
      if (!/rel=/i.test(newAttrs)) {
        newAttrs += ' rel="noopener noreferrer"';
        changed = true;
      } else if (!/noopener/.test(newAttrs)) {
        newAttrs = newAttrs.replace(/rel="([^"]*)"/i, 'rel="$1 noopener"');
        changed = true;
      }

      if (changed) fixed++;
      return `<a${newAttrs}>`;
    });

    if (fixed === 0) return { applied: false, detail: 'All external links already secured' };
    return { applied: true, detail: `Secured ${fixed} external link(s) with noopener` };
  }

  fixEmptyLinks() {
    let fixed = 0;

    // Convert hash-only <a href="#"> to <button> if they have onclick or are interactive
    // Otherwise just leave them (they may be intentional anchors)
    this.html = this.html.replace(/<a([^>]*)href="#"([^>]*)>(.*?)<\/a>/gi, (match, before, after, content) => {
      // Skip if it's a real anchor jump like href="#services"
      // Only target bare "#"
      if (content.trim().length > 0) {
        fixed++;
        return `<a${before}href="javascript:void(0)" role="button"${after}>${content}</a>`;
      }
      return match;
    });

    if (fixed === 0) return { applied: false, detail: 'No problematic hash links found' };
    return { applied: true, detail: `Fixed ${fixed} empty hash link(s)` };
  }

  fixFontLoading() {
    if (!/fonts\.googleapis/i.test(this.html)) {
      return { applied: false, detail: 'No Google Fonts to optimize' };
    }

    if (/display=swap/i.test(this.html)) {
      return { applied: false, detail: 'Font display:swap already enabled' };
    }

    // Add display=swap to Google Fonts URLs
    this.html = this.html.replace(
      /(fonts\.googleapis\.com\/css2?\?[^"]*)/gi,
      (match) => {
        if (!match.includes('display=swap')) {
          return match + (match.includes('?') ? '&' : '?') + 'display=swap';
        }
        return match;
      }
    );

    return { applied: true, detail: 'Added display=swap to Google Fonts' };
  }

  fixSkipLink() {
    if (/href="#main-content"|href="#main"/i.test(this.html)) {
      return { applied: false, detail: 'Skip-to-content link already exists' };
    }

    const skipLink = '<a href="#main-content" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;" onfocus="this.style.position=\'static\';this.style.width=\'auto\';this.style.height=\'auto\';">Skip to main content</a>';

    this.html = this.html.replace(/<body([^>]*)>/i, `<body$1>\n  ${skipLink}`);
    return { applied: true, detail: 'Added skip-to-content link for keyboard users' };
  }

  fixCanonical() {
    if (/<link[^>]*rel="canonical"/i.test(this.html)) {
      return { applied: false, detail: 'Canonical URL already set' };
    }

    this.html = this.html.replace('</head>', '  <link rel="canonical" href="https://www.riseupbenefitsgroup.com/">\n</head>');
    return { applied: true, detail: 'Added canonical URL' };
  }
}

/* ================================================================
   AUDIT PANEL INITIALIZATION
   ================================================================ */
let lastAuditResult = null;
let lastAuditorHtml = '';

function initAuditPanel() {
  const runBtn = document.getElementById('run-audit-btn');
  if (!runBtn) return;

  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    runBtn.innerHTML = '<div class="spinner"></div> Running Audit...';

    try {
      const auditor = new SEOAuditor();
      await auditor.fetchAndParse('./index.html');
      const result = auditor.runFullAudit();

      lastAuditResult = result;
      lastAuditorHtml = auditor.html;

      renderAuditResults(result);
      saveAuditToHistory(result);

      // Show auto-fix section if there are issues
      const autofixSection = document.getElementById('autofix-section');
      if (autofixSection) {
        autofixSection.style.display = result.issues.length > 0 ? 'block' : 'none';
        // Reset log and result areas
        document.getElementById('autofix-log').style.display = 'none';
        document.getElementById('autofix-log').innerHTML = '';
        document.getElementById('autofix-result').style.display = 'none';
        document.getElementById('autofix-result').innerHTML = '';
      }

      showToast('✓ SEO audit complete');
    } catch (err) {
      if (err.message === 'FILE_PROTOCOL_BLOCKED') {
        const resultsEl = document.getElementById('audit-results');
        if (resultsEl) {
          resultsEl.style.display = 'block';
          resultsEl.innerHTML = `
            <div class="bo-card" style="text-align:center;padding:48px 24px;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--bo-warning)" stroke-width="2" style="margin-bottom:16px;">
                <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3 style="margin-bottom:8px;font-size:1.2rem;">Local Server Required</h3>
              <p style="color:var(--bo-text-muted);max-width:500px;margin:0 auto 20px;">
                The audit can't load <code>index.html</code> from the <code>file://</code> protocol due to browser security restrictions. 
                Start a simple local server to fix this:
              </p>
              <div class="output-box" style="max-width:400px;margin:0 auto 20px;">
                <pre>cd ${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}\nnpx -y serve .</pre>
              </div>
              <p style="color:var(--bo-text-dim);font-size:0.8rem;">Then open <strong>http://localhost:3000/backoffice.html</strong></p>
            </div>
          `;
        }
        showToast('⚠ Local server needed — see instructions below');
      } else {
        showToast('✗ Audit failed: ' + err.message);
      }
      console.error(err);
    }

    runBtn.disabled = false;
    runBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> Run SEO Audit`;
  });

  // Auto-fix button
  const fixBtn = document.getElementById('autofix-btn');
  if (fixBtn) {
    fixBtn.addEventListener('click', async () => {
      if (!lastAuditResult || !lastAuditorHtml) {
        showToast('Run an audit first');
        return;
      }

      fixBtn.disabled = true;
      fixBtn.innerHTML = '<div class="spinner"></div> Fixing Issues...';

      const logEl = document.getElementById('autofix-log');
      const resultEl = document.getElementById('autofix-result');
      logEl.style.display = 'block';
      logEl.innerHTML = '<div class="autofix-log" id="autofix-log-inner"></div>';
      resultEl.style.display = 'none';

      const logInner = document.getElementById('autofix-log-inner');

      const fixer = new AutoFixer(lastAuditorHtml, lastAuditResult.issues);

      const result = await fixer.runAll((name, status, detail) => {
        const existingStep = logInner.querySelector(`[data-step="${name}"]`);
        if (existingStep) {
          const icon = existingStep.querySelector('.autofix-step-icon');
          const text = existingStep.querySelector('.autofix-step-text');
          if (status === 'done') {
            icon.className = 'autofix-step-icon step-done';
            icon.textContent = '✓';
            text.innerHTML = `<strong>${name}</strong> — ${detail}`;
          } else if (status === 'skip') {
            icon.className = 'autofix-step-icon step-skip';
            icon.textContent = '–';
            text.innerHTML = `<strong>${name}</strong> — <span style="color:var(--bo-text-dim)">${detail}</span>`;
          }
        } else {
          const step = document.createElement('div');
          step.className = 'autofix-step';
          step.setAttribute('data-step', name);
          step.innerHTML = `
            <div class="autofix-step-icon step-running"><div class="spinner" style="width:12px;height:12px;border-width:1.5px;"></div></div>
            <div class="autofix-step-text"><strong>${name}</strong>...</div>
          `;
          logInner.appendChild(step);
          logInner.scrollTop = logInner.scrollHeight;
        }
      });

      // Show results
      resultEl.style.display = 'block';

      if (result.fixCount > 0) {
        // Store for deploy
        window.__fixedHtml = result.fixedHtml;
        window.__fixLog = result.log;

        resultEl.innerHTML = `
          <div class="autofix-result-bar" style="flex-wrap:wrap;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div class="autofix-result-info">
              <h4>✨ ${result.fixCount} Issue${result.fixCount !== 1 ? 's' : ''} Fixed</h4>
              <p>Click below to deploy the fixes to your live site. Changes will go live automatically.</p>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
              <button class="bo-btn-download" id="deploy-live-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 2L11 13"></path>
                  <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                </svg>
                Deploy to Live Site
              </button>
              <button class="bo-btn bo-btn-ghost bo-btn-sm" id="download-backup-btn" style="font-size:0.75rem;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                or download backup copy
              </button>
            </div>
          </div>
          <div id="deploy-status" style="display:none;margin-top:16px;"></div>
          <details class="autofix-diff">
            <summary>View Changes (${result.fixCount} modifications)</summary>
            <div id="diff-content"></div>
          </details>
        `;

        // Wire deploy button (commits to GitHub → triggers Vercel redeploy)
        document.getElementById('deploy-live-btn').addEventListener('click', async () => {
          const deployBtn = document.getElementById('deploy-live-btn');
          const statusEl = document.getElementById('deploy-status');
          
          deployBtn.disabled = true;
          deployBtn.innerHTML = '<div class="spinner"></div> Deploying...';
          statusEl.style.display = 'block';
          statusEl.innerHTML = `
            <div class="autofix-step">
              <div class="autofix-step-icon step-running"><div class="spinner" style="width:12px;height:12px;border-width:1.5px;"></div></div>
              <div class="autofix-step-text"><strong>Committing changes to repository...</strong></div>
            </div>
          `;

          try {
            const res = await fetch('/api/save-fix', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: window.__fixedHtml,
                message: `SEO Auto-Fix: ${result.fixCount} issue(s) resolved — ${new Date().toLocaleDateString()}`
              })
            });

            const data = await res.json();

            if (res.ok && data.success) {
              statusEl.innerHTML = `
                <div class="autofix-step">
                  <div class="autofix-step-icon step-done">✓</div>
                  <div class="autofix-step-text"><strong>Committed to repo</strong> — ${data.commit || 'done'}</div>
                </div>
                <div class="autofix-step">
                  <div class="autofix-step-icon step-done">✓</div>
                  <div class="autofix-step-text"><strong>Vercel auto-deploy triggered</strong> — site will update in ~30 seconds</div>
                </div>
              `;
              deployBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                ✓ Deployed Successfully
              `;
              deployBtn.style.background = 'var(--bo-success)';
              showToast('🚀 Fixes deployed to live site!');
            } else {
              throw new Error(data.error || data.detail || 'Deploy failed');
            }
          } catch (err) {
            statusEl.innerHTML = `
              <div class="autofix-step">
                <div class="autofix-step-icon" style="background:var(--bo-danger-bg);color:var(--bo-danger);border:1px solid rgba(239,68,68,0.3);">✗</div>
                <div class="autofix-step-text">
                  <strong>Deploy failed</strong> — ${escapeHtml(err.message)}<br>
                  <span style="color:var(--bo-text-dim);font-size:0.8rem;">Make sure GITHUB_TOKEN and GITHUB_REPO are set in Vercel → Settings → Environment Variables</span>
                </div>
              </div>
            `;
            deployBtn.disabled = false;
            deployBtn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
              </svg>
              Retry Deploy
            `;
            showToast('✗ Deploy failed — see error below');
          }
        });

        // Wire backup download button
        document.getElementById('download-backup-btn').addEventListener('click', () => {
          const blob = new Blob([window.__fixedHtml], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'index.html';
          a.click();
          URL.revokeObjectURL(url);
          showToast('✓ Backup copy downloaded');
        });

        // Generate diff
        const diffEl = document.getElementById('diff-content');
        if (diffEl) {
          const changes = result.log.filter(l => l.applied);
          diffEl.innerHTML = changes.map(c => `
            <div style="margin-bottom:12px;">
              <div style="font-size:0.8rem;font-weight:600;color:var(--bo-accent-light);margin-bottom:4px;">${c.name}</div>
              <div class="diff-line diff-add">+ ${escapeHtml(c.detail)}</div>
            </div>
          `).join('');
        }
      } else {
        resultEl.innerHTML = `
          <div class="autofix-result-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <div class="autofix-result-info">
              <h4>✨ No Fixes Needed</h4>
              <p>Your site is already well-optimized!</p>
            </div>
          </div>
        `;
      }

      fixBtn.disabled = false;
      fixBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg> ✨ Fix All Issues Automatically`;
      showToast(`✨ Done! ${result.fixCount} fixes applied`);
    });
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderAuditResults(result) {
  // Score gauge
  const gaugeEl = document.getElementById('score-gauge');
  const scoreNum = document.getElementById('score-number');
  if (gaugeEl && scoreNum) {
    gaugeEl.className = 'score-gauge';
    const scoreClass = result.score >= 90 ? 'score-excellent' : result.score >= 70 ? 'score-good' : result.score >= 50 ? 'score-average' : 'score-poor';
    gaugeEl.classList.add(scoreClass);

    // Animate gauge
    let current = 0;
    const target = result.score;
    const interval = setInterval(() => {
      current += 1;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      scoreNum.textContent = current;
      gaugeEl.style.setProperty('--score-deg', `${(current / 100) * 360}deg`);
    }, 15);
  }

  // Category cards
  const grid = document.getElementById('category-grid');
  if (grid) {
    grid.innerHTML = '';
    const icons = {
      meta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
      headings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v20M18 2v20M6 12h12"></path></svg>',
      images: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
      schema: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
      links: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
      accessibility: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="16" cy="4" r="1"></circle><path d="m18 19 1-7-6 1"></path><path d="m5 8 3-3 5.5 3-2.36 3.5"></path><path d="M4.24 14.5a5 5 0 0 0 6.88 6"></path><path d="M13.76 17.5a5 5 0 0 0-6.88-6"></path></svg>',
      performance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>',
      content: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
      social: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>'
    };

    for (const [key, data] of Object.entries(result.results)) {
      const progressClass = data.score >= 90 ? 'progress-excellent' : data.score >= 70 ? 'progress-good' : data.score >= 50 ? 'progress-average' : 'progress-poor';

      const card = document.createElement('div');
      card.className = `category-card ${progressClass}`;
      card.innerHTML = `
        <div class="category-card-header">
          <div class="category-card-label">${icons[key] || ''} ${data.label}</div>
          <div class="category-card-score">${data.score}</div>
        </div>
        <div class="category-progress"><div class="category-progress-bar" style="width: 0%"></div></div>
        <div class="category-details">
          ${data.checks.map(c => `
            <div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;">
              <span style="color:${c.pass ? 'var(--bo-success)' : 'var(--bo-warning)'};flex-shrink:0;margin-top:2px;">${c.pass ? '✓' : '⚠'}</span>
              <span>${c.label}</span>
            </div>
          `).join('')}
        </div>
      `;
      grid.appendChild(card);

      // Animate progress bar
      setTimeout(() => {
        card.querySelector('.category-progress-bar').style.width = data.score + '%';
      }, 100);
    }
  }

  // Issues table
  const issuesBody = document.getElementById('issues-tbody');
  if (issuesBody) {
    issuesBody.innerHTML = '';
    if (result.issues.length === 0) {
      issuesBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--bo-text-dim);padding:24px;">No issues found — great job!</td></tr>';
    } else {
      result.issues.sort((a, b) => {
        const order = { critical: 0, warning: 1, info: 2 };
        return (order[a.severity] || 3) - (order[b.severity] || 3);
      });

      result.issues.forEach(issue => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><span class="badge badge-${issue.severity}">${issue.severity}</span></td>
          <td>${issue.category}</td>
          <td>${issue.msg}</td>
          <td style="color:var(--bo-text-muted);">${issue.fix}</td>
        `;
        issuesBody.appendChild(row);
      });
    }
  }

  // Stats row
  const statsRow = document.getElementById('audit-stats');
  if (statsRow) {
    const issueCount = result.issues.length;
    const critCount = result.issues.filter(i => i.severity === 'critical').length;
    const warnCount = result.issues.filter(i => i.severity === 'warning').length;
    const passCount = Object.values(result.results).reduce((sum, r) => sum + r.checks.filter(c => c.pass).length, 0);

    statsRow.innerHTML = `
      <div class="stat-mini"><div class="stat-mini-value">${result.score}</div><div class="stat-mini-label">Overall Score</div></div>
      <div class="stat-mini"><div class="stat-mini-value" style="color:var(--bo-success);">${passCount}</div><div class="stat-mini-label">Checks Passed</div></div>
      <div class="stat-mini"><div class="stat-mini-value" style="color:var(--bo-danger);">${critCount}</div><div class="stat-mini-label">Critical Issues</div></div>
      <div class="stat-mini"><div class="stat-mini-value" style="color:var(--bo-warning);">${warnCount}</div><div class="stat-mini-label">Warnings</div></div>
      <div class="stat-mini"><div class="stat-mini-value">${issueCount}</div><div class="stat-mini-label">Total Issues</div></div>
    `;
  }

  // Show results container
  const resultsContainer = document.getElementById('audit-results');
  if (resultsContainer) resultsContainer.style.display = 'block';
}

/* ================================================================
   AI TOOLS
   ================================================================ */
function initAITools() {
  initMetaGenerator();
  initContentOptimizer();
  initKeywordAnalyzer();
  initSchemaBuilder();
}

/* ---------- Meta Generator ---------- */
function initMetaGenerator() {
  const btn = document.getElementById('generate-meta-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const topic = document.getElementById('meta-topic').value.trim();
    const business = document.getElementById('meta-business').value.trim() || 'Rise Up Benefits Group';
    const location = document.getElementById('meta-location').value.trim() || 'Chandler, AZ';

    if (!topic) { showToast('Please enter a topic'); return; }

    const titles = [
      `${business} | ${capitalizeWords(topic)} in ${location}`,
      `${capitalizeWords(topic)} - ${business} | ${location}`,
      `Trusted ${capitalizeWords(topic)} Services | ${business}`,
    ];

    const descriptions = [
      `${business} offers professional ${topic.toLowerCase()} services in ${location}. Get personalized guidance from licensed experts. Free consultation available — call today!`,
      `Looking for ${topic.toLowerCase()} in ${location}? ${business} provides tailored solutions with a focus on education and savings. Contact us for a free, no-obligation quote.`,
      `Discover comprehensive ${topic.toLowerCase()} options with ${business} in ${location}. Licensed nationwide, 30+ five-star reviews. Schedule your free consultation today.`,
    ];

    const keywords = generateKeywords(topic, business, location);

    const output = document.getElementById('meta-output');
    output.innerHTML = `<pre>${titles.map((t, i) => `<!-- Option ${i + 1} -->\n<title>${t}</title>\n<meta name="description" content="${descriptions[i]}">\n`).join('\n')}
<meta name="keywords" content="${keywords.join(', ')}"></pre>`;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'output-copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = () => { copyToClipboard(output.querySelector('pre').textContent); showToast('Copied!'); };
    output.appendChild(copyBtn);
  });
}

function generateKeywords(topic, business, location) {
  const base = topic.toLowerCase().split(/\s+/);
  const keywords = new Set([
    topic.toLowerCase(),
    `${topic.toLowerCase()} ${location.toLowerCase()}`,
    business.toLowerCase(),
    `${topic.toLowerCase()} agent`,
    `${topic.toLowerCase()} near me`,
    `best ${topic.toLowerCase()} ${location.split(',')[0]?.trim().toLowerCase()}`,
    `affordable ${topic.toLowerCase()}`,
    `${topic.toLowerCase()} quotes`,
    ...base
  ]);
  return [...keywords];
}

/* ---------- Content Optimizer ---------- */
function initContentOptimizer() {
  const btn = document.getElementById('optimize-content-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const text = document.getElementById('content-input').value.trim();
    if (!text) { showToast('Please enter content to analyze'); return; }

    const analysis = analyzeContent(text);
    renderContentAnalysis(analysis);
  });
}

function analyzeContent(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  // Word frequency
  const freq = {};
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'that', 'this', 'these', 'those', 'it', 'its', 'i', 'we', 'you', 'they', 'he', 'she', 'my', 'your', 'our', 'their', 'not', 'no', 'from', 'by', 'as', 'if', 'so']);

  words.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length > 2 && !stopWords.has(clean)) {
      freq[clean] = (freq[clean] || 0) + 1;
    }
  });

  const topKeywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  // Readability
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const fleschScore = sentences.length > 0
    ? 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length)
    : 0;

  const avgSentenceLength = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;

  // Suggestions
  const suggestions = [];

  if (words.length < 300) suggestions.push({ type: 'warning', text: `Word count is low (${words.length}). Aim for 300+ words for better SEO ranking.` });
  if (avgSentenceLength > 25) suggestions.push({ type: 'warning', text: `Average sentence length is ${avgSentenceLength} words. Keep under 20 for readability.` });
  if (fleschScore < 60) suggestions.push({ type: 'warning', text: `Readability score is ${Math.round(fleschScore)} — use simpler words and shorter sentences.` });
  if (paragraphs.length < 3 && words.length > 100) suggestions.push({ type: 'info', text: 'Break content into more paragraphs for scannability.' });

  const keywordDensity = topKeywords.length > 0 ? ((topKeywords[0][1] / words.length) * 100) : 0;
  if (keywordDensity > 3) suggestions.push({ type: 'warning', text: `Top keyword "${topKeywords[0][0]}" has ${keywordDensity.toFixed(1)}% density — may appear as keyword stuffing.` });
  if (keywordDensity < 1 && topKeywords.length > 0) suggestions.push({ type: 'info', text: `Top keyword "${topKeywords[0][0]}" has low density (${keywordDensity.toFixed(1)}%). Consider natural usage.` });

  if (suggestions.length === 0) suggestions.push({ type: 'pass', text: 'Content looks well-optimized! No major issues found.' });

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgSentenceLength,
    readabilityScore: Math.max(0, Math.min(100, Math.round(fleschScore))),
    topKeywords,
    suggestions
  };
}

function renderContentAnalysis(analysis) {
  const output = document.getElementById('content-output');
  if (!output) return;

  const readClass = analysis.readabilityScore >= 60 ? 'var(--bo-success)' :
                    analysis.readabilityScore >= 40 ? 'var(--bo-warning)' : 'var(--bo-danger)';

  output.innerHTML = `
    <div class="stats-row" style="margin-bottom:16px;">
      <div class="stat-mini"><div class="stat-mini-value">${analysis.wordCount}</div><div class="stat-mini-label">Words</div></div>
      <div class="stat-mini"><div class="stat-mini-value">${analysis.sentenceCount}</div><div class="stat-mini-label">Sentences</div></div>
      <div class="stat-mini"><div class="stat-mini-value" style="color:${readClass};">${analysis.readabilityScore}</div><div class="stat-mini-label">Readability</div></div>
      <div class="stat-mini"><div class="stat-mini-value">${analysis.avgSentenceLength}</div><div class="stat-mini-label">Avg. Words/Sentence</div></div>
    </div>

    <div class="bo-card" style="margin-bottom:16px;">
      <div class="bo-card-title" style="margin-bottom:12px;">Top Keywords</div>
      <div class="keyword-tags">
        ${analysis.topKeywords.map(([word, count]) => `<span class="keyword-tag">${word} <span class="count">${count}</span></span>`).join('')}
      </div>
    </div>

    <div class="bo-card">
      <div class="bo-card-title" style="margin-bottom:12px;">Suggestions</div>
      ${analysis.suggestions.map(s => `
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
          <span class="badge badge-${s.type === 'pass' ? 'pass' : s.type}">${s.type}</span>
          <span style="font-size:0.85rem;">${s.text}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/* ---------- Keyword Analyzer ---------- */
function initKeywordAnalyzer() {
  const btn = document.getElementById('analyze-keywords-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const text = document.getElementById('keyword-input').value.trim();
    const targetKW = document.getElementById('target-keyword').value.trim().toLowerCase();
    if (!text) { showToast('Please enter content'); return; }

    const words = text.split(/\s+/).filter(w => w.length > 0);
    const totalWords = words.length;

    // Target keyword analysis
    let targetAnalysis = null;
    if (targetKW) {
      const regex = new RegExp(targetKW.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = text.match(regex);
      const count = matches ? matches.length : 0;
      const density = ((count / totalWords) * 100).toFixed(2);

      // Position prominence (first 100 words)
      const first100 = words.slice(0, 100).join(' ').toLowerCase();
      const inFirst100 = first100.includes(targetKW);

      targetAnalysis = { keyword: targetKW, count, density, inFirst100, totalWords };
    }

    // General keyword extraction
    const analysis = analyzeContent(text);
    renderKeywordResults(targetAnalysis, analysis.topKeywords, totalWords);
  });
}

function renderKeywordResults(target, topKeywords, totalWords) {
  const output = document.getElementById('keyword-output');
  if (!output) return;

  let html = '';

  if (target) {
    const densityColor = target.density >= 1 && target.density <= 3 ? 'var(--bo-success)' :
                         target.density > 3 ? 'var(--bo-danger)' : 'var(--bo-warning)';

    html += `
      <div class="bo-card" style="margin-bottom:16px;">
        <div class="bo-card-title" style="margin-bottom:12px;">Target Keyword: "${target.keyword}"</div>
        <div class="stats-row">
          <div class="stat-mini"><div class="stat-mini-value" style="color:${densityColor};">${target.density}%</div><div class="stat-mini-label">Density</div></div>
          <div class="stat-mini"><div class="stat-mini-value">${target.count}</div><div class="stat-mini-label">Occurrences</div></div>
          <div class="stat-mini"><div class="stat-mini-value" style="color:${target.inFirst100 ? 'var(--bo-success)' : 'var(--bo-warning)'};">${target.inFirst100 ? 'Yes' : 'No'}</div><div class="stat-mini-label">In First 100 Words</div></div>
        </div>
        <div style="margin-top:12px;font-size:0.85rem;color:var(--bo-text-muted);">
          ${target.density < 1 ? '⚠ Keyword density is low. Consider adding more natural mentions.' :
            target.density > 3 ? '⚠ Keyword density is high. This may appear as keyword stuffing.' :
            '✓ Keyword density is in the ideal range (1-3%).'}
        </div>
      </div>
    `;
  }

  html += `
    <div class="bo-card">
      <div class="bo-card-title" style="margin-bottom:12px;">All Extracted Keywords</div>
      <div class="keyword-tags">
        ${topKeywords.map(([word, count]) => {
          const density = ((count / totalWords) * 100).toFixed(1);
          return `<span class="keyword-tag">${word} <span class="count">${count}× · ${density}%</span></span>`;
        }).join('')}
      </div>
    </div>
  `;

  output.innerHTML = html;
}

/* ---------- Schema Builder ---------- */
function initSchemaBuilder() {
  const typeSelect = document.getElementById('schema-type');
  const generateBtn = document.getElementById('generate-schema-btn');
  if (!typeSelect || !generateBtn) return;

  typeSelect.addEventListener('change', () => {
    const type = typeSelect.value;
    const fieldsContainer = document.getElementById('schema-fields');
    fieldsContainer.innerHTML = getSchemaFields(type);
  });

  generateBtn.addEventListener('click', () => {
    const type = typeSelect.value;
    if (!type) { showToast('Select a schema type'); return; }

    const schema = buildSchema(type);
    const output = document.getElementById('schema-output');
    output.innerHTML = `<code>${JSON.stringify(schema, null, 2)}</code>`;

    const copyBtn = document.getElementById('schema-copy-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        copyToClipboard(JSON.stringify(schema, null, 2));
        showToast('Schema JSON copied!');
      };
      copyBtn.style.display = 'inline-flex';
    }
  });

  // Trigger initial fields
  if (typeSelect.value) typeSelect.dispatchEvent(new Event('change'));
}

function getSchemaFields(type) {
  const fields = {
    LocalBusiness: `
      <div class="bo-form-group"><label>Business Name</label><input class="bo-input" id="sf-name" value="Rise Up Benefits Group"></div>
      <div class="bo-form-group"><label>Description</label><textarea class="bo-textarea" id="sf-description" rows="2">Independent insurance agency specializing in Health and Life Insurance solutions.</textarea></div>
      <div class="bo-form-group"><label>Phone</label><input class="bo-input" id="sf-phone" value="+1-480-300-5776"></div>
      <div class="bo-form-group"><label>Email</label><input class="bo-input" id="sf-email" value="viola@riseupbenefitsgroup.com"></div>
      <div class="bo-form-group"><label>Street Address</label><input class="bo-input" id="sf-street" value="2160 N Alma School Rd., Ste 102"></div>
      <div class="bo-form-group"><label>City</label><input class="bo-input" id="sf-city" value="Chandler"></div>
      <div class="bo-form-group"><label>State</label><input class="bo-input" id="sf-state" value="AZ"></div>
      <div class="bo-form-group"><label>Zip Code</label><input class="bo-input" id="sf-zip" value="85224"></div>
      <div class="bo-form-group"><label>Website URL</label><input class="bo-input" id="sf-url" value="https://www.riseupbenefitsgroup.com"></div>
    `,
    FAQPage: `
      <div id="faq-items">
        <div class="faq-item" style="margin-bottom:16px;padding:16px;background:var(--bo-surface-1);border-radius:var(--bo-radius-sm);">
          <div class="bo-form-group"><label>Question 1</label><input class="bo-input faq-q" placeholder="What is Medicare Advantage?"></div>
          <div class="bo-form-group"><label>Answer 1</label><textarea class="bo-textarea faq-a" rows="2" placeholder="Medicare Advantage plans are..."></textarea></div>
        </div>
      </div>
      <button class="bo-btn bo-btn-ghost bo-btn-sm" onclick="addFAQItem()">+ Add Question</button>
    `,
    Product: `
      <div class="bo-form-group"><label>Product/Service Name</label><input class="bo-input" id="sf-pname" placeholder="Medicare Supplement Plan"></div>
      <div class="bo-form-group"><label>Description</label><textarea class="bo-textarea" id="sf-pdesc" rows="2" placeholder="Comprehensive Medigap coverage..."></textarea></div>
      <div class="bo-form-group"><label>Price (or "Free Consultation")</label><input class="bo-input" id="sf-price" placeholder="0"></div>
      <div class="bo-form-group"><label>Brand</label><input class="bo-input" id="sf-brand" value="Rise Up Benefits Group"></div>
    `
  };
  return fields[type] || '<p style="color:var(--bo-text-dim)">Select a schema type above</p>';
}

// Global helper for FAQ
window.addFAQItem = function () {
  const container = document.getElementById('faq-items');
  const count = container.querySelectorAll('.faq-item').length + 1;
  const item = document.createElement('div');
  item.className = 'faq-item';
  item.style.cssText = 'margin-bottom:16px;padding:16px;background:var(--bo-surface-1);border-radius:var(--bo-radius-sm);';
  item.innerHTML = `
    <div class="bo-form-group"><label>Question ${count}</label><input class="bo-input faq-q" placeholder="Enter question..."></div>
    <div class="bo-form-group"><label>Answer ${count}</label><textarea class="bo-textarea faq-a" rows="2" placeholder="Enter answer..."></textarea></div>
  `;
  container.appendChild(item);
};

function buildSchema(type) {
  const val = id => document.getElementById(id)?.value?.trim() || '';

  if (type === 'LocalBusiness') {
    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": val('sf-name'),
      "description": val('sf-description'),
      "telephone": val('sf-phone'),
      "email": val('sf-email'),
      "url": val('sf-url'),
      "address": {
        "@type": "PostalAddress",
        "streetAddress": val('sf-street'),
        "addressLocality": val('sf-city'),
        "addressRegion": val('sf-state'),
        "postalCode": val('sf-zip'),
        "addressCountry": "US"
      }
    };
  }

  if (type === 'FAQPage') {
    const questions = document.querySelectorAll('.faq-q');
    const answers = document.querySelectorAll('.faq-a');
    const mainEntity = [];
    questions.forEach((q, i) => {
      if (q.value.trim() && answers[i]?.value?.trim()) {
        mainEntity.push({
          "@type": "Question",
          "name": q.value.trim(),
          "acceptedAnswer": {
            "@type": "Answer",
            "text": answers[i].value.trim()
          }
        });
      }
    });
    return { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": mainEntity };
  }

  if (type === 'Product') {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": val('sf-pname'),
      "description": val('sf-pdesc'),
      "brand": { "@type": "Brand", "name": val('sf-brand') },
      "offers": {
        "@type": "Offer",
        "price": val('sf-price'),
        "priceCurrency": "USD"
      }
    };
  }

  return {};
}

/* ================================================================
   REPORTS
   ================================================================ */
function initReportsPanel() {
  renderReportHistory();

  const exportBtn = document.getElementById('export-report-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const history = JSON.parse(localStorage.getItem('seoAuditHistory') || '[]');
      if (history.length === 0) { showToast('No audit data to export'); return; }

      const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-audit-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Report exported!');
    });
  }

  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      localStorage.removeItem('seoAuditHistory');
      renderReportHistory();
      showToast('History cleared');
    });
  }
}

function saveAuditToHistory(result) {
  const history = JSON.parse(localStorage.getItem('seoAuditHistory') || '[]');
  history.unshift({
    date: new Date().toISOString(),
    score: result.score,
    issueCount: result.issues.length,
    criticalCount: result.issues.filter(i => i.severity === 'critical').length,
    categories: Object.fromEntries(
      Object.entries(result.results).map(([k, v]) => [k, v.score])
    )
  });

  // Keep last 50
  if (history.length > 50) history.length = 50;
  localStorage.setItem('seoAuditHistory', JSON.stringify(history));
  renderReportHistory();
}

function renderReportHistory() {
  const container = document.getElementById('report-history');
  if (!container) return;

  const history = JSON.parse(localStorage.getItem('seoAuditHistory') || '[]');

  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        <h3>No Audit History</h3>
        <p>Run your first SEO audit to start tracking scores over time.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="report-list">
      ${history.map((item, i) => {
        const date = new Date(item.date);
        const scoreColor = item.score >= 90 ? 'var(--bo-success)' : item.score >= 70 ? 'var(--bo-accent-light)' : item.score >= 50 ? 'var(--bo-warning)' : 'var(--bo-danger)';
        const trend = i < history.length - 1 ? (item.score > history[i + 1].score ? '↑' : item.score < history[i + 1].score ? '↓' : '→') : '';

        return `
          <div class="report-item">
            <div class="report-item-info">
              <div class="report-item-score" style="color:${scoreColor};">${item.score}${trend ? ` <span style="font-size:0.8rem;">${trend}</span>` : ''}</div>
              <div>
                <div style="font-size:0.85rem;">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div class="report-item-date">${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
            <div style="display:flex;gap:6px;">
              ${item.criticalCount > 0 ? `<span class="badge badge-critical">${item.criticalCount} critical</span>` : ''}
              <span class="badge badge-info">${item.issueCount} issues</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ================================================================
   UTILITIES
   ================================================================ */
function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

function showToast(text) {
  const existing = document.querySelector('.bo-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'bo-toast';
  toast.innerHTML = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

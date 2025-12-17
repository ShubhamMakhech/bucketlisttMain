// SEO Verification Utility
// This utility helps verify that all SEO improvements are properly implemented

export interface SEOCheckResult {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  recommendation?: string;
}

export const verifySEOImplementation = (): SEOCheckResult[] => {
  const results: SEOCheckResult[] = [];

  // Check Title Tag
  const title = document.title;
  results.push({
    category: 'Title Tag',
    item: 'Presence',
    status: title ? 'pass' : 'fail',
    message: title ? `Title present: "${title}"` : 'Title tag is missing',
    recommendation: title ? undefined : 'Add a descriptive title tag (50-60 characters)'
  });

  results.push({
    category: 'Title Tag',
    item: 'Length',
    status: title.length >= 50 && title.length <= 60 ? 'pass' : 'warning',
    message: `Title length: ${title.length} characters`,
    recommendation: title.length < 50 || title.length > 60 ? 'Optimize title length to 50-60 characters' : undefined
  });

  // Check Meta Description
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
  results.push({
    category: 'Meta Description',
    item: 'Presence',
    status: metaDescription ? 'pass' : 'fail',
    message: metaDescription ? `Meta description present: "${metaDescription}"` : 'Meta description is missing',
    recommendation: metaDescription ? undefined : 'Add a compelling meta description (120-160 characters)'
  });

  if (metaDescription) {
    results.push({
      category: 'Meta Description',
      item: 'Length',
      status: metaDescription.length >= 120 && metaDescription.length <= 160 ? 'pass' : 'warning',
      message: `Meta description length: ${metaDescription.length} characters`,
      recommendation: metaDescription.length < 120 || metaDescription.length > 160 ? 'Optimize meta description length to 120-160 characters' : undefined
    });
  }

  // Check H1 Tag
  const h1Tags = document.querySelectorAll('h1');
  results.push({
    category: 'Headings',
    item: 'H1 Count',
    status: h1Tags.length === 1 ? 'pass' : h1Tags.length === 0 ? 'fail' : 'warning',
    message: `Found ${h1Tags.length} H1 tag(s)`,
    recommendation: h1Tags.length !== 1 ? 'Use exactly one H1 tag per page' : undefined
  });

  // Check Canonical Tag
  const canonical = document.querySelector('link[rel="canonical"]');
  results.push({
    category: 'Canonical Tag',
    item: 'Presence',
    status: canonical ? 'pass' : 'fail',
    message: canonical ? `Canonical URL: ${canonical.getAttribute('href')}` : 'Canonical tag is missing',
    recommendation: canonical ? undefined : 'Add canonical tag to specify preferred page URL'
  });

  // Check Open Graph Tags
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');

  results.push({
    category: 'Open Graph',
    item: 'OG Title',
    status: ogTitle ? 'pass' : 'fail',
    message: ogTitle ? `OG Title: "${ogTitle}"` : 'OG title is missing',
    recommendation: ogTitle ? undefined : 'Add og:title for better social media sharing'
  });

  results.push({
    category: 'Open Graph',
    item: 'OG Description',
    status: ogDescription ? 'pass' : 'fail',
    message: ogDescription ? `OG Description: "${ogDescription}"` : 'OG description is missing',
    recommendation: ogDescription ? undefined : 'Add og:description for better social media sharing'
  });

  results.push({
    category: 'Open Graph',
    item: 'OG Image',
    status: ogImage ? 'pass' : 'fail',
    message: ogImage ? `OG Image: "${ogImage}"` : 'OG image is missing',
    recommendation: ogImage ? undefined : 'Add og:image for better social media sharing'
  });

  // Check Structured Data
  const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]');
  results.push({
    category: 'Structured Data',
    item: 'Presence',
    status: structuredDataScripts.length > 0 ? 'pass' : 'fail',
    message: `Found ${structuredDataScripts.length} structured data script(s)`,
    recommendation: structuredDataScripts.length === 0 ? 'Add structured data markup for better search engine understanding' : undefined
  });

  // Check Favicon
  const favicon = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
  results.push({
    category: 'Favicon',
    item: 'Presence',
    status: favicon ? 'pass' : 'warning',
    message: favicon ? `Favicon found: ${favicon.getAttribute('href')}` : 'Favicon not explicitly defined',
    recommendation: favicon ? undefined : 'Add explicit favicon link in head'
  });

  // Check Alt Attributes (sample check)
  const images = document.querySelectorAll('img');
  const imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt') || img.getAttribute('alt')?.trim() === '');
  results.push({
    category: 'Images',
    item: 'Alt Attributes',
    status: imagesWithoutAlt.length === 0 ? 'pass' : 'warning',
    message: `${imagesWithoutAlt.length} out of ${images.length} images missing alt attributes`,
    recommendation: imagesWithoutAlt.length > 0 ? 'Add descriptive alt attributes to all images' : undefined
  });

  // Check Internal Links
  const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
  results.push({
    category: 'Internal Linking',
    item: 'Count',
    status: internalLinks.length > 5 ? 'pass' : 'warning',
    message: `Found ${internalLinks.length} internal links`,
    recommendation: internalLinks.length <= 5 ? 'Add more contextual internal links for better navigation and SEO' : undefined
  });

  return results;
};

export const generateSEOReport = (): string => {
  const results = verifySEOImplementation();
  const passCount = results.filter(r => r.status === 'pass').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const failCount = results.filter(r => r.status === 'fail').length;

  let report = `SEO Verification Report\n`;
  report += `========================\n\n`;
  report += `Summary: ${passCount} passed, ${warningCount} warnings, ${failCount} failed\n\n`;

  const categories = [...new Set(results.map(r => r.category))];
  
  categories.forEach(category => {
    report += `${category}:\n`;
    report += `-`.repeat(category.length + 1) + `\n`;
    
    const categoryResults = results.filter(r => r.category === category);
    categoryResults.forEach(result => {
      const statusIcon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      report += `${statusIcon} ${result.item}: ${result.message}\n`;
      if (result.recommendation) {
        report += `   💡 ${result.recommendation}\n`;
      }
    });
    report += `\n`;
  });

  return report;
};

// Console logging function for development
export const logSEOReport = (): void => {
  console.log(generateSEOReport());
};
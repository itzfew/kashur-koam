// This script should be run periodically to generate/update sitemap.xml
// Can be run with Node.js: node js/sitemap.js

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://your-username.github.io'; // Replace with your GitHub Pages URL
const PAGES = [
    '',
    'contact.html',
    'privacy-policy.html',
    'terms-and-conditions.html'
];

async function generateSitemap() {
    try {
        // Get all posts
        const postsDir = path.join(__dirname, '..', '_posts');
        const postFiles = fs.readdirSync(postsDir).filter(file => file.endsWith('.json'));
        
        const posts = postFiles.map(file => {
            const postData = JSON.parse(fs.readFileSync(path.join(postsDir, file), 'utf8'));
            return {
                url: `post.html?title=${encodeURIComponent(postData.title)}`,
                lastmod: postData.date
            };
        });
        
        // Get all districts and schools (simplified for example)
        const districts = [...new Set(posts
            .filter(post => post.url.includes('district'))
            .map(post => `search.html?label=${encodeURIComponent(post.district)}`)
        )];
        
        const schools = [...new Set(posts
            .filter(post => post.url.includes('school'))
            .map(post => `search.html?label=school_${encodeURIComponent(post.district)}`)
        )];
        
        // Generate sitemap XML
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        
        // Add static pages
        PAGES.forEach(page => {
            sitemap += `  <url>
    <loc>${BASE_URL}/${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>\n`;
        });
        
        // Add posts
        posts.forEach(post => {
            sitemap += `  <url>
    <loc>${BASE_URL}/${post.url}</loc>
    <lastmod>${post.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
        });
        
        // Add districts and schools
        [...districts, ...schools].forEach(url => {
            sitemap += `  <url>
    <loc>${BASE_URL}/${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
        });
        
        sitemap += '</urlset>';
        
        // Write to file
        fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), sitemap);
        console.log('Sitemap generated successfully!');
    } catch (error) {
        console.error('Error generating sitemap:', error);
    }
}

generateSitemap();

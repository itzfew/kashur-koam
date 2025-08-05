// This script would be run as a build step to generate sitemap.xml
// For GitHub Pages, you would need to set up GitHub Actions to run this

const fs = require('fs');
const path = require('path');

function generateSitemap() {
    const baseUrl = 'https://itzme-eduhub.github.io';
    const today = new Date().toISOString().split('T')[0];
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/privacy-policy.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/terms-and-conditions.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/contact.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;
    
    // Add posts to sitemap
    const postsDir = path.join(__dirname, '..', '_posts');
    const postFiles = fs.readdirSync(postsDir);
    
    postFiles.forEach(file => {
        if (file.endsWith('.md')) {
            const postContent = fs.readFileSync(path.join(postsDir, file), 'utf8');
            const dateMatch = postContent.match(/date:\s*(.+)/);
            const date = dateMatch ? dateMatch[1].trim() : today;
            
            const titleMatch = postContent.match(/title:\s*"(.+)"/) || 
                              postContent.match(/title:\s*(.+)/);
            const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '');
            
            sitemap += `
    <url>
        <loc>${baseUrl}/post?title=${encodeURIComponent(title)}</loc>
        <lastmod>${date.split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`;
        }
    });
    
    sitemap += `
</urlset>`;
    
    fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), sitemap);
    console.log('Sitemap generated successfully');
}

generateSitemap();

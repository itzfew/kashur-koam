const fs = require('fs').promises;
const path = require('path');

async function generateSitemap() {
    const postsDir = path.join(__dirname, 'posts');
    const sitemapPath = path.join(__dirname, 'sitemap.xml');
    const baseUrl = 'https://yourusername.github.io'; // Replace with your GitHub Pages URL

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/pages/contact.html</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/pages/privacy-policy.html</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/pages/terms-and-conditions.html</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;

    try {
        const files = await fs.readdir(postsDir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const postData = JSON.parse(await fs.readFile(path.join(postsDir, file), 'utf-8'));
                sitemap += `
    <url>
        <loc>${baseUrl}/pages/post.html?title=${encodeURIComponent(postData.title)}</loc>
        <lastmod>${postData.date}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>`;
            }
        }
    } catch (error) {
        console.error('Error generating sitemap:', error);
    }

    sitemap += `
</urlset>`;

    await fs.writeFile(sitemapPath, sitemap);
    console.log('Sitemap generated successfully.');
}

generateSitemap();

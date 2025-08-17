async function generateAtomFeed() {
    showLoading();
    try {
        // Fetch the latest articles from the server
        const response = await fetch(`${SCRIPT_URL}?action=getLatestArticles`);
        const articles = await response.json();

        // Get the current date-time in ISO 8601 format for the feed's updated field
        const updated = new Date().toISOString();

        // Load the Atom XML template
        const atomTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>Kashurpedia</title>
    <link href="https://example.com/" rel="alternate"/>
    <link href="https://example.com/atom.xml" rel="self"/>
    <id>urn:uuid:12345678-1234-5678-1234-567812345678</id>
    <updated>${updated}</updated>
    <generator uri="https://example.com/" version="1.0">Kashurpedia</generator>
    {{entries}}
</feed>`;

        // Generate entries for each article
        let entries = '';
        articles.forEach(article => {
            // Assume article has id, title, shortDescription, and publishedDate
            // If publishedDate is not provided by the server, use current date as fallback
            const pubDate = article.publishedDate ? new Date(article.publishedDate).toISOString() : updated;
            const entry = `
    <entry>
        <title>${escapeXml(article.title)}</title>
        <link href="https://example.com/article.html?id=${encodeURIComponent(article.id)}" rel="alternate"/>
        <id>urn:uuid:${generateUUID(article.id)}</id>
        <updated>${pubDate}</updated>
        <summary>${escapeXml(article.shortDescription || 'No description available')}</summary>
    </entry>`;
            entries += entry;
        });

        // Replace {{entries}} in the template with the generated entries
        const atomFeed = atomTemplate.replace('{{entries}}', entries.trim());

        // Create a Blob for the XML content
        const blob = new Blob([atomFeed], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);

        // Trigger download of the atom.xml file
        const link = document.createElement('a');
        link.href = url;
        link.download = 'atom.xml';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error generating Atom feed: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Utility function to escape XML special characters
function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

// Utility function to generate a UUID based on article ID
function generateUUID(id) {
    // Simple UUID-like string based on article ID
    // In a real application, you might want to use a proper UUID library
    return `12345678-1234-5678-1234-${id.padStart(12, '0')}`;
}

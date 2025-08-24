// Form handling for article submission
document.addEventListener('DOMContentLoaded', function() {
  const articleForm = document.getElementById('article-form');
  if (!articleForm) return;
  
  articleForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const title = document.getElementById('article-title').value;
    const category = document.getElementById('article-category').value;
    const content = document.getElementById('article-content').value;
    const image = document.getElementById('article-image').value;
    const name = document.getElementById('your-name').value;
    const email = document.getElementById('your-email').value;
    
    // Generate markdown content
    const markdownContent = `---
title: ${title}
date: ${new Date().toISOString().split('T')[0]}
categories: [${category}]
${image ? `image: ${image}` : ''}
---

${content}

${name ? `\n*Submitted by: ${name}${email ? ` (${email})` : ''}*` : ''}
`;
    
    // Prepare email
    const subject = `New Article Submission: ${title}`;
    const body = `Please find below a new article submission for Kashurpedia:\n\n${encodeURIComponent(markdownContent)}`;
    
    // Open email client
    window.location.href = `mailto:${siteEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Show success message
    articleForm.style.display = 'none';
    document.getElementById('form-success').style.display = 'block';
  });
});

// Define site email (would typically come from a config)
const siteEmail = 'itzme.eduhub.contact@gmail.com';

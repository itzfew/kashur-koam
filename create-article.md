---
layout: page
title: Create Article
permalink: /create-article/
---

<section class="create-article-form">
  <h1>Submit a New Article</h1>
  <p>Help us grow Kashurpedia by submitting your article. Fill out the form below and we'll review your submission.</p>
  
  <form id="article-form">
    <div class="form-group">
      <label for="article-title">Article Title *</label>
      <input type="text" id="article-title" name="title" required>
    </div>
    
    <div class="form-group">
      <label for="article-category">Category *</label>
      <select id="article-category" name="category" required>
        <option value="">Select a category</option>
        <option value="Village">Village</option>
        <option value="Mosques">Mosques</option>
        <option value="Districts">Districts</option>
        <option value="Schools">Schools</option>
        <option value="Other">Other</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="article-content">Article Content (Markdown format) *</label>
      <textarea id="article-content" name="content" rows="15" required placeholder="Write your article in Markdown format. Use headings, lists, and other formatting as needed."></textarea>
    </div>
    
    <div class="form-group">
      <label for="article-image">Image URL (optional)</label>
      <input type="url" id="article-image" name="image" placeholder="https://example.com/image.jpg">
    </div>
    
    <div class="form-group">
      <label for="your-name">Your Name (optional)</label>
      <input type="text" id="your-name" name="name" placeholder="John Doe">
    </div>
    
    <div class="form-group">
      <label for="your-email">Your Email (optional)</label>
      <input type="email" id="your-email" name="email" placeholder="your@email.com">
    </div>
    
    <button type="submit" class="btn btn-primary">Submit Article</button>
  </form>
  
  <div id="form-success" class="success-message" style="display: none;">
    <h3>Thank you for your submission!</h3>
    <p>Your article has been prepared. Please check your email to complete the submission process.</p>
  </div>
</section>

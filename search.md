---
layout: default
title: Search Episodes
permalink: /search/
---

<div class="search-container">
  <div class="search-header">
    <h1>Search BEMA Episodes</h1>
    <p>Search through episode titles, descriptions, and notes content.</p>
  </div>

  <form id="search-form" class="search-form">
    <div class="search-input-container">
      <input 
        type="text" 
        id="search-input" 
        placeholder="Search episodes..." 
        autocomplete="off"
        class="search-input"
      >
      <button type="submit" class="search-button">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
        </svg>
        Search
      </button>
    </div>
  </form>

  <div id="search-results" class="search-results"></div>
</div>

<style>
.search-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.search-header {
  text-align: center;
  margin-bottom: 30px;
}

.search-header h1 {
  margin-bottom: 10px;
}

.search-header p {
  color: #666;
  margin: 0;
}

.search-form {
  margin-bottom: 30px;
}

.search-input-container {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: none;
  font-size: 16px;
  outline: none;
}

.search-input:focus {
  box-shadow: none;
}

.search-input-container:focus-within {
  border-color: #0969da;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
}

.search-button {
  padding: 12px 16px;
  border: none;
  background: #0969da;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.search-button:hover {
  background: #0860ca;
}

.search-results {
  min-height: 200px;
}

.search-results-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e1e5e9;
}

.search-results-header p {
  margin: 0;
  color: #656d76;
  font-size: 14px;
}

.search-result {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  background: white;
}

.search-result-title {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.search-result-title a {
  color: #0969da;
  text-decoration: none;
}

.search-result-title a:hover {
  text-decoration: underline;
}

.search-result-subtitle {
  margin: 0 0 8px 0;
  color: #656d76;
  font-style: italic;
  font-size: 14px;
}

.search-result-meta {
  margin: 0 0 8px 0;
  color: #656d76;
  font-size: 14px;
}

.search-result-description {
  margin: 0 0 12px 0;
  color: #24292f;
  line-height: 1.5;
}

.search-result-content {
  margin: 0;
  color: #656d76;
  font-size: 14px;
  line-height: 1.5;
}

.search-result-content mark {
  background: #fff8c5;
  padding: 2px 4px;
  border-radius: 3px;
}

.search-no-results {
  text-align: center;
  padding: 40px 20px;
  color: #656d76;
}

.search-no-results ul {
  display: inline-block;
  text-align: left;
  margin: 16px 0 0 0;
}

.search-error {
  text-align: center;
  padding: 40px 20px;
  color: #d1242f;
  background: #ffebee;
  border: 1px solid #f5c2c7;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .search-container {
    padding: 15px;
  }
  
  .search-input-container {
    flex-direction: column;
  }
  
  .search-button {
    justify-content: center;
  }
  
  .search-result {
    padding: 15px;
  }
}
</style>

<script src="https://unpkg.com/lunr.min/lunr.js"></script>
<script src="{{ '/assets/js/search.js' | relative_url }}"></script>
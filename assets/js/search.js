---
---
class BemaSearch {
  constructor() {
    this.searchData = [];
    this.lunrIndex = null;
    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    this.searchForm = document.getElementById('search-form');
    this.init();
  }

  async init() {
    try {
      await this.loadSearchData();
      this.createLunrIndex();
      this.bindEvents();
      this.handleURLParams();
    } catch (error) {
      console.error('Error initializing search:', error);
    }
  }

  async loadSearchData() {
    try {
      const response = await fetch('{{ "/search-data.json" | relative_url }}');
      this.searchData = await response.json();
    } catch (error) {
      console.error('Error loading search data:', error);
      throw error;
    }
  }

  createLunrIndex() {
    const searchData = this.searchData;
    
    this.lunrIndex = lunr(function () {
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('episode_title', { boost: 8 });
      this.field('subtitle', { boost: 5 });
      this.field('content', { boost: 1 });
      this.field('description', { boost: 3 });
      this.field('session', { boost: 2 });

      // Add documents to index
      searchData.forEach((doc) => {
        this.add(doc);
      }, this);
    });
  }

  bindEvents() {
    if (this.searchForm) {
      this.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.performSearch();
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          if (e.target.value.length > 2) {
            this.performSearch();
          } else if (e.target.value.length === 0) {
            this.clearResults();
          }
        }, 300);
      });
    }
  }

  handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query && this.searchInput) {
      this.searchInput.value = query;
      this.performSearch();
    }
  }

  performSearch() {
    const query = this.searchInput.value.trim();
    if (query.length === 0) {
      this.clearResults();
      return;
    }

    try {
      const results = this.lunrIndex.search(query);
      this.displayResults(results, query);
      
      // Update URL without page reload
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('q', query);
      window.history.replaceState({}, '', newUrl);
    } catch (error) {
      console.error('Search error:', error);
      this.displayError('Search error occurred. Please try a different query.');
    }
  }

  displayResults(results, query) {
    if (!this.searchResults) return;

    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="search-no-results">
          <p>No results found for "<strong>${this.escapeHtml(query)}</strong>"</p>
          <p>Try:</p>
          <ul>
            <li>Different keywords</li>
            <li>More general terms</li>
            <li>Check spelling</li>
          </ul>
        </div>
      `;
      return;
    }

    const resultsHtml = results.map(result => {
      const episode = this.searchData.find(item => item.id.toString() === result.ref);
      if (!episode) return '';

      return `
        <div class="search-result">
          <h3 class="search-result-title">
            <a href="${episode.url}">
              Session ${episode.session}: ${this.escapeHtml(episode.episode_title)}
            </a>
          </h3>
          ${episode.subtitle ? `<p class="search-result-subtitle">${this.escapeHtml(episode.subtitle)}</p>` : ''}
          ${episode.duration ? `<p class="search-result-meta">Duration: ${this.escapeHtml(episode.duration)}</p>` : ''}
          ${episode.description ? `<p class="search-result-description">${this.truncateText(this.escapeHtml(episode.description), 200)}</p>` : ''}
          <p class="search-result-content">${this.getSearchSnippet(episode.content, query)}</p>
        </div>
      `;
    }).join('');

    this.searchResults.innerHTML = `
      <div class="search-results-header">
        <p>Found ${results.length} result${results.length === 1 ? '' : 's'} for "<strong>${this.escapeHtml(query)}</strong>"</p>
      </div>
      ${resultsHtml}
    `;
  }

  getSearchSnippet(content, query, maxLength = 300) {
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // Find the first occurrence of any query word
    let bestIndex = -1;
    let bestWord = '';
    
    queryWords.forEach(word => {
      const index = cleanContent.toLowerCase().indexOf(word);
      if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
        bestIndex = index;
        bestWord = word;
      }
    });

    if (bestIndex === -1) {
      return this.truncateText(cleanContent, maxLength);
    }

    // Create snippet around the found word
    const start = Math.max(0, bestIndex - maxLength / 2);
    const end = Math.min(cleanContent.length, start + maxLength);
    let snippet = cleanContent.substring(start, end);

    // Add ellipsis
    if (start > 0) snippet = '...' + snippet;
    if (end < cleanContent.length) snippet = snippet + '...';

    // Highlight search terms
    queryWords.forEach(word => {
      const regex = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
      snippet = snippet.replace(regex, '<mark>$1</mark>');
    });

    return snippet;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  displayError(message) {
    if (!this.searchResults) return;
    
    this.searchResults.innerHTML = `
      <div class="search-error">
        <p>${message}</p>
      </div>
    `;
  }

  clearResults() {
    if (this.searchResults) {
      this.searchResults.innerHTML = '';
    }
    
    // Clear URL parameter
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('q');
    window.history.replaceState({}, '', newUrl);
  }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('search-input')) {
    window.bemaSearch = new BemaSearch();
  }
});
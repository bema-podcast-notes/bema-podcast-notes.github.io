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
      this.trackSearch(query, results.length);
      
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
        <div class="card card-elevated search-result">
          <h3 class="search-result-title">
            <a href="${this.escapeHtml(episode.url)}">
              Session ${this.escapeHtml(episode.session)}: ${this.escapeHtml(episode.episode_title)}
            </a>
          </h3>
          ${episode.subtitle ? `<p class="search-result-subtitle">${this.escapeHtml(episode.subtitle)}</p>` : ''}
          ${episode.duration ? `<p class="search-result-meta">Duration: ${this.escapeHtml(episode.duration)}</p>` : ''}
          ${episode.description ? `<p class="search-result-description">${this.escapeHtml(this.truncateText(episode.description, 200))}</p>` : ''}
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

  // Returns HTML: the snippet is escaped and matches are wrapped in <mark>
  getSearchSnippet(content, query, maxLength = 300) {
    const cleanContent = (content || '').replace(/\s+/g, ' ').trim();
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    
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
      return this.escapeHtml(this.truncateText(cleanContent, maxLength));
    }

    // Create snippet around the found word
    const start = Math.max(0, bestIndex - maxLength / 2);
    const end = Math.min(cleanContent.length, start + maxLength);
    let snippet = cleanContent.substring(start, end);

    // Add ellipsis
    if (start > 0) snippet = '...' + snippet;
    if (end < cleanContent.length) snippet = snippet + '...';

    return this.highlight(snippet, queryWords);
  }

  // Split the raw text on the query words, escape every piece, and wrap the
  // matches. Escaping first and highlighting after would let a word like
  // "amp" match inside an entity such as &amp; and break the markup.
  highlight(text, words) {
    if (words.length === 0) return this.escapeHtml(text);
    const pattern = new RegExp(`(${words.map(word => this.escapeRegex(word)).join('|')})`, 'gi');
    return text.split(pattern).map((part, i) =>
      i % 2 === 1 ? `<mark>${this.escapeHtml(part)}</mark>` : this.escapeHtml(part)
    ).join('');
  }

  // GA4 "search" event, sent once typing pauses so each keystroke isn't counted
  trackSearch(query, resultCount) {
    clearTimeout(this.trackTimeout);
    this.trackTimeout = setTimeout(() => {
      if (query === this.lastTrackedQuery || !window.BEMAAnalytics) return;
      this.lastTrackedQuery = query;
      window.BEMAAnalytics.track('search', { search_term: this.analyticsSafeTerm(query), search_results: resultCount });
    }, 1500);
  }

  // GA forbids personal data: mask emails and long digit runs (phone numbers),
  // and keep within GA's 100-character parameter value limit
  analyticsSafeTerm(query) {
    return query
      .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]')
      .replace(/\+?\d[\d\s().-]{6,}\d/g, '[number]')
      .slice(0, 100);
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Safe for element content and quoted attributes (textContent/innerHTML
  // round-tripping leaves quotes unescaped, which breaks href="...")
  escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
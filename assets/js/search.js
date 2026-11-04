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
      // strip_html leaves entities such as &amp; in the text; decode them so
      // they display correctly and phrases like "Marty & Brent" can match
      this.searchData.forEach(doc => {
        doc.content = this.decodeEntities(doc.content);
        doc.description = this.decodeEntities(doc.description);
      });
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
      const results = this.search(query);
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

  // Words in "double quotes" must appear together, in order. Lunr has no
  // phrase search, so it finds and ranks candidates from all the words, then
  // results without every phrase are dropped. Docs Lunr can't reach (a phrase
  // made only of stop words, like "to be") are found by scanning, ranked last.
  search(query) {
    const { phrases, words } = this.parseQuery(query);
    const lunrQuery = words.concat(...phrases.map(phrase => phrase.split(' '))).join(' ');
    const results = lunrQuery ? this.lunrIndex.search(lunrQuery) : [];
    if (phrases.length === 0) return results;

    const hasPhrases = doc => phrases.every(phrase => this.phraseText(doc).indexOf(phrase) !== -1);
    const byRef = new Map(this.searchData.map(doc => [doc.id.toString(), doc]));
    const matched = results.filter(result => byRef.has(result.ref) && hasPhrases(byRef.get(result.ref)));
    const found = new Set(matched.map(result => result.ref));
    this.searchData.forEach(doc => {
      const ref = doc.id.toString();
      if (!found.has(ref) && hasPhrases(doc)) matched.push({ ref: ref, score: 0 });
    });
    return matched;
  }

  // { phrases: ['son of man'], words: ['kingdom'] } for: kingdom "Son of Man"
  // An unclosed quote is ignored; the words after it are searched normally.
  parseQuery(query) {
    const phrases = [];
    const rest = this.normalize(query).replace(/"([^"]*)"/g, (match, phrase) => {
      phrase = phrase.trim();
      if (phrase) phrases.push(phrase);
      return ' ';
    }).replace(/"/g, ' ');
    return { phrases: phrases, words: rest.split(' ').filter(word => word.length > 0) };
  }

  // Lowercase with straight quotes and single spaces, so typed phrases match
  // the notes' curly apostrophes and line breaks
  normalize(text) {
    return String(text == null ? '' : text)
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Every searchable field of a doc, normalized once and cached
  phraseText(doc) {
    if (doc.phraseText === undefined) {
      doc.phraseText = this.normalize([doc.title, doc.episode_title, doc.subtitle, doc.description, doc.content].join(' '));
    }
    return doc.phraseText;
  }

  // Any named or numeric entity (&amp; &nbsp; &#160; &#x2019;). A <textarea>
  // decodes them without parsing markup or running anything; non-breaking
  // spaces become plain spaces so phrases match across them.
  decodeEntities(text) {
    text = String(text == null ? '' : text);
    if (text.indexOf('&') === -1) return text.replace(/\u00A0/g, ' ');
    this.decoder = this.decoder || document.createElement('textarea');
    this.decoder.innerHTML = text;
    return this.decoder.value.replace(/\u00A0/g, ' ');
  }

  displayResults(results, query) {
    if (!this.searchResults) return;

    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="search-no-results">
          <p>No results found for ${this.quotedQuery(query)}</p>
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
        <p>Found ${results.length} result${results.length === 1 ? '' : 's'} for ${this.quotedQuery(query)}</p>
      </div>
      ${resultsHtml}
    `;
  }

  // The query for the results header: "covenant", but a query that already
  // has quotes ("son of man") isn't wrapped in another pair
  quotedQuery(query) {
    const strong = `<strong>${this.escapeHtml(query)}</strong>`;
    return /["\u201C\u201D]/.test(query) ? strong : `"${strong}"`;
  }

  // Returns HTML: the snippet is escaped and matches are wrapped in <mark>
  getSearchSnippet(content, query, maxLength = 300) {
    const cleanContent = (content || '').replace(/\s+/g, ' ').trim();
    const { phrases, words } = this.parseQuery(query);

    // Center on the first phrase match, or else the first word match
    const firstMatch = terms => terms.reduce((best, term) => {
      const index = cleanContent.search(this.termPattern(term, 'i'));
      return index !== -1 && (best === -1 || index < best) ? index : best;
    }, -1);
    let bestIndex = firstMatch(phrases);
    if (bestIndex === -1) bestIndex = firstMatch(words);

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

    return this.highlight(snippet, phrases.concat(words));
  }

  // Matches a normalized term in the original text: any run of spaces between
  // words, and either style of apostrophe
  termPattern(term, flags) {
    const source = this.escapeRegex(term).replace(/ /g, '\\s+').replace(/'/g, "['\u2019]");
    return flags === undefined ? source : new RegExp(source, flags);
  }

  // Split the raw text on the query words, escape every piece, and wrap the
  // matches. Escaping first and highlighting after would let a word like
  // "amp" match inside an entity such as &amp; and break the markup.
  highlight(text, words) {
    if (words.length === 0) return this.escapeHtml(text);
    // Longest first, so a phrase is highlighted whole rather than word by word
    const sorted = words.slice().sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`(${sorted.map(word => this.termPattern(word)).join('|')})`, 'gi');
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
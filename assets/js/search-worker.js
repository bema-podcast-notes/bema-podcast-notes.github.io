---
---
/**
 * Builds the search index off the main thread (see search.js), so the page
 * stays responsive while the ~5 MB of notes are indexed (about 0.5 s on a
 * laptop, 2 s or more on a phone).
 *
 * In:  { url, fields: [[name, boost], ...] }
 * Out: { ok: true, docs, index }   index = lunr's serialized JSON
 *      { ok: false, error }
 *
 * The lunr version must match the one search.html loads, since the page
 * loads this serialized index with lunr.Index.load.
 */
self.onmessage = async function(event) {
  const { url, fields } = event.data;
  try {
    importScripts('https://unpkg.com/lunr@2.3.9/lunr.min.js');
    const response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const docs = await response.json();
    // Same as search.js decodeEntities, without the DOM (workers have none)
    docs.forEach(doc => {
      doc.content = decodeEntities(doc.content);
      doc.description = decodeEntities(doc.description);
    });
    const index = lunr(function () {
      this.ref('id');
      fields.forEach(([name, boost]) => this.field(name, { boost }));
      docs.forEach(doc => this.add(doc));
    });
    self.postMessage({ ok: true, docs, index: index.toJSON() });
  } catch (error) {
    self.postMessage({ ok: false, error: String(error && error.message || error) });
  }
};

// strip_html leaves entities; the notes only use a handful, plus numeric ones
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decodeEntities(text) {
  text = String(text == null ? '' : text);
  if (text.indexOf('&') !== -1) {
    text = text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
      if (code[0] === '#') {
        const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return n > 0 && n <= 0x10FFFF ? String.fromCodePoint(n) : match;
      }
      const named = NAMED[code.toLowerCase()];
      return named === undefined ? match : named;
    });
  }
  return text.replace(/ /g, ' ');
}

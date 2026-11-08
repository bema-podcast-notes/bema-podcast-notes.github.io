/**
 * My Notes for BEMA Podcast Notes
 * Lets readers keep their own notes on each episode page and discussion guide.
 * Notes live only in this browser's localStorage, keyed per page:
 *   bema-my-notes:ep-325 -> { "text": "...", "updated": "2026-11-03T16:40:00.000Z",
 *                             "title": "325: Sanctuary — ...", "url": "/ep/325" }
 *   bema-my-notes:guide-325   (the discussion guide at /guides/325)
 * "Export all" gathers every saved note into a single Markdown file, in
 * episode order with each guide after its episode.
 */

(function() {
    'use strict';

    const STORAGE_PREFIX = 'bema-my-notes:';
    const SAVE_DELAY_MS = 500;
    // Explicit fields rather than dateStyle/timeStyle, which older browsers
    // (Safari < 14.1, Chrome < 76) ignore. e.g. "Nov 3, 2026, 6:20 PM"
    const DATE_TIME = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    const DATE_MEDIUM = { year: 'numeric', month: 'short', day: 'numeric' };
    const DATE_LONG = { year: 'numeric', month: 'long', day: 'numeric' };
    // Keep download URLs alive long enough for browsers that open them in a tab
    // instead of downloading (iOS < 13 ignores the download attribute)
    const REVOKE_DELAY_MS = 60000;

    const section = document.querySelector('.my-notes');
    if (!section) return;

    const textarea = section.querySelector('.my-notes-text');
    const status = section.querySelector('.my-notes-status');
    const storageKey = STORAGE_PREFIX + section.dataset.notesKey;
    const title = section.dataset.notesTitle || document.title;
    const subject = section.dataset.notesSubject || 'this episode';
    const downloadBtn = section.querySelector('[data-notes-action="download"]');
    const clearBtn = section.querySelector('[data-notes-action="clear"]');
    const exportAllBtn = section.querySelector('[data-notes-action="export-all"]');
    const exportCount = exportAllBtn.querySelector('.export-count');
    let saveTimer = null;

    // localStorage can throw (private mode, blocked site data), so guard every access
    function load() {
        try {
            const raw = localStorage.getItem(storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    // Analytics (assets/js/analytics.js); a no-op if it isn't loaded
    function track(name, params) {
        if (window.BEMAAnalytics) window.BEMAAnalytics.track(name, params);
    }

    function save(text) {
        try {
            if (text.trim() === '') {
                localStorage.removeItem(storageKey);
                setStatus(null);
            } else {
                const note = {
                    text: text,
                    updated: new Date().toISOString(),
                    title: title,
                    url: window.location.pathname
                };
                const isNew = !localStorage.getItem(storageKey);
                localStorage.setItem(storageKey, JSON.stringify(note));
                setStatus(note.updated);
                if (isNew) track('my_notes_saved');
            }
            updateExportAllCount();
            return true;
        } catch (e) {
            showStatus('alert-triangle', 'Could not save — your browser is blocking local storage.');
            return false;
        }
    }

    function storageAvailable() {
        try {
            const probe = STORAGE_PREFIX + '__probe__';
            localStorage.setItem(probe, '1');
            localStorage.removeItem(probe);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Same markup as _includes/icon.html, for text set from script
    const SVG_NS = 'http://www.w3.org/2000/svg';
    // The icon sprite's URL as the page's own icons use it (versioned by
    // _includes/icon.html), so script-made icons share that cached copy
    const SPRITE = (function() {
        const use = document.querySelector('use[href*="icons.svg"]');
        return use ? use.getAttribute('href').split('#')[0] : '/assets/icons.svg';
    })();

    function icon(name) {
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'icon');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const use = document.createElementNS(SVG_NS, 'use');
        use.setAttribute('href', SPRITE + '#' + name);
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', SPRITE + '#' + name);
        svg.appendChild(use);
        return svg;
    }

    function showStatus(iconName, text) {
        status.textContent = '';
        if (iconName) status.appendChild(icon(iconName));
        status.appendChild(document.createTextNode((iconName ? ' ' : '') + text));
    }

    function setStatus(updated) {
        if (!updated) {
            status.textContent = '';
            return;
        }
        const when = new Date(updated).toLocaleString(undefined, DATE_TIME);
        showStatus('check', 'Saved on this device · ' + when);
    }

    function saveFile(filename, body) {
        const blob = new Blob([body], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function() { URL.revokeObjectURL(url); }, REVOKE_DELAY_MS);
    }

    function download() {
        const text = textarea.value.trim();
        if (!text) return;
        const body = '# My notes: ' + title + '\n\n' + text + '\n\n---\n' + window.location.href + '\n';
        saveFile('bema-' + section.dataset.notesKey.replace(/[^a-z0-9-]+/gi, '-') + '-my-notes.md', body);
        track('my_notes_download');
    }

    // "ep-325" -> episode 325; "guide-325" -> its guide, sorted right after it
    const KEY_PARTS = /^(ep|guide)-(-?\d+)$/;

    // "3 episodes and 1 guide" for a list of note keys
    function describeNotes(ids) {
        let episodes = 0, guides = 0, other = 0;
        ids.forEach(id => {
            const m = id.match(KEY_PARTS);
            if (!m) other++;
            else if (m[1] === 'guide') guides++;
            else episodes++;
        });
        const parts = [];
        if (episodes) parts.push(episodes + (episodes === 1 ? ' episode' : ' episodes'));
        if (guides) parts.push(guides + (guides === 1 ? ' guide' : ' guides'));
        if (other) parts.push(other + (other === 1 ? ' other page' : ' other pages'));
        return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : (parts[0] || '0 episodes');
    }

    // Every saved note in this browser, in episode order with each guide after
    // its episode (other pages last)
    function loadAllNotes() {
        const notes = [];
        let count = 0;
        try {
            count = localStorage.length;
        } catch (e) {
            return notes;
        }
        for (let i = 0; i < count; i++) {
            // Per entry, so one unreadable note doesn't drop the rest
            try {
                const key = localStorage.key(i);
                if (!key || key.indexOf(STORAGE_PREFIX) !== 0) continue;
                const note = JSON.parse(localStorage.getItem(key));
                if (!note || typeof note.text !== 'string' || !note.text.trim()) continue;
                const id = key.slice(STORAGE_PREFIX.length);
                const match = id.match(KEY_PARTS);
                const isGuide = !!match && match[1] === 'guide';
                notes.push({
                    id: id,
                    episode: match ? Number(match[2]) : Infinity,
                    kind: isGuide ? 1 : 0,
                    title: note.title || (match ? (isGuide ? 'Discussion Guide ' : 'Episode ') + match[2] : id),
                    url: note.url || (match ? (isGuide ? '/guides/' : '/ep/') + match[2] : id),
                    updated: note.updated,
                    text: note.text.trim()
                });
            } catch (e) {
                // Skip this entry
            }
        }
        return notes.sort((a, b) => a.episode - b.episode || a.kind - b.kind || a.title.localeCompare(b.title));
    }

    function exportAll() {
        const notes = loadAllNotes();
        if (notes.length === 0) return;
        const today = new Date();
        const lines = [
            '# My BEMA Podcast Notes',
            '',
            'Exported ' + today.toLocaleDateString(undefined, DATE_LONG) +
                ' · ' + describeNotes(notes.map(n => n.id)),
            ''
        ];
        notes.forEach(note => {
            lines.push('## ' + note.title, '', note.text, '');
            const edited = note.updated
                ? 'Last edited ' + new Date(note.updated).toLocaleDateString(undefined, DATE_MEDIUM) + ' · '
                : '';
            lines.push('_' + edited + new URL(note.url, window.location.origin).href + '_', '');
        });
        saveFile('bema-my-notes-' + today.toISOString().slice(0, 10) + '.md', lines.join('\n'));
        track('my_notes_export_all', { note_count: notes.length });
    }

    // Download and Clear only make sense once this page has a note. The
    // note's text is also mirrored into a print-only block (the textarea
    // itself prints poorly); without text the section is left off paper.
    const printCopy = section.querySelector('.my-notes-print');
    function updateNoteButtons() {
        const empty = textarea.value.trim() === '';
        downloadBtn.disabled = empty;
        clearBtn.disabled = empty;
        if (printCopy) printCopy.textContent = textarea.value.trim();
        section.classList.toggle('my-notes-has-text', !empty);
    }

    function updateExportAllCount() {
        const all = loadAllNotes();
        const count = all.length;
        exportCount.textContent = '(' + count + ')';
        exportAllBtn.disabled = count === 0;
        exportAllBtn.title = count === 0
            ? 'No saved notes yet'
            : 'Download your notes from ' + describeNotes(all.map(n => n.id)) + ' as one Markdown file';
    }

    function clear() {
        if (!textarea.value.trim()) return;
        if (!window.confirm('Delete your notes for ' + subject + '? This cannot be undone.')) return;
        clearTimeout(saveTimer);
        saveTimer = null;
        textarea.value = '';
        save('');
        updateNoteButtons();
    }

    function init() {
        if (!storageAvailable()) {
            textarea.disabled = true;
            textarea.placeholder = 'Notes are unavailable because your browser is blocking local storage (private browsing or site data disabled).';
            section.querySelectorAll('[data-notes-action]').forEach(btn => { btn.disabled = true; });
            return;
        }

        const note = load();
        if (note) {
            textarea.value = note.text;
            setStatus(note.updated);
        }

        textarea.addEventListener('input', function() {
            updateNoteButtons();
            clearTimeout(saveTimer);
            status.textContent = 'Saving…';
            saveTimer = setTimeout(function() {
                saveTimer = null;
                save(textarea.value);
            }, SAVE_DELAY_MS);
        });

        // Flush a pending save if the reader navigates away mid-typing
        window.addEventListener('pagehide', function() {
            if (saveTimer) {
                clearTimeout(saveTimer);
                save(textarea.value);
            }
        });

        // Keep other open tabs in sync: the export count for any note, the text for this page
        window.addEventListener('storage', function(e) {
            if (e.key === null || e.key.startsWith(STORAGE_PREFIX)) updateExportAllCount();
            if (e.key !== storageKey || document.activeElement === textarea) return;
            const updated = load();
            textarea.value = updated ? updated.text : '';
            setStatus(updated && updated.updated);
            updateNoteButtons();
        });

        downloadBtn.addEventListener('click', download);
        clearBtn.addEventListener('click', clear);
        exportAllBtn.addEventListener('click', exportAll);
        updateNoteButtons();
        updateExportAllCount();
    }

    init();
})();

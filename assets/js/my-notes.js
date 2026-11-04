/**
 * My Notes for BEMA Podcast Notes
 * Lets readers keep their own notes on each episode page.
 * Notes live only in this browser's localStorage, keyed per episode:
 *   bema-my-notes:ep-325 -> { "text": "...", "updated": "2026-11-03T16:40:00.000Z",
 *                             "title": "325: Sanctuary — ...", "url": "/ep/325" }
 * "Export all" gathers every saved note into a single Markdown file.
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
    const downloadBtn = section.querySelector('[data-notes-action="download"]');
    const clearBtn = section.querySelector('[data-notes-action="clear"]');
    const exportAllBtn = section.querySelector('[data-notes-action="export-all"]');
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
                localStorage.setItem(storageKey, JSON.stringify(note));
                setStatus(note.updated);
            }
            updateExportAllCount();
            return true;
        } catch (e) {
            status.textContent = '⚠️ Could not save — your browser is blocking local storage.';
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

    function setStatus(updated) {
        if (!updated) {
            status.textContent = '';
            return;
        }
        const when = new Date(updated).toLocaleString(undefined, DATE_TIME);
        status.textContent = '✓ Saved on this device · ' + when;
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
    }

    // Every saved note in this browser, sorted by episode number (non-episode pages last)
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
                const match = id.match(/^ep-(-?\d+)$/);
                notes.push({
                    episode: match ? Number(match[1]) : Infinity,
                    title: note.title || (match ? 'Episode ' + match[1] : id),
                    url: note.url || (match ? '/ep/' + match[1] : id),
                    updated: note.updated,
                    text: note.text.trim()
                });
            } catch (e) {
                // Skip this entry
            }
        }
        return notes.sort((a, b) => a.episode - b.episode || a.title.localeCompare(b.title));
    }

    function exportAll() {
        const notes = loadAllNotes();
        if (notes.length === 0) return;
        const today = new Date();
        const lines = [
            '# My BEMA Podcast Notes',
            '',
            'Exported ' + today.toLocaleDateString(undefined, DATE_LONG) +
                ' · ' + notes.length + (notes.length === 1 ? ' episode' : ' episodes'),
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
    }

    // Download and Clear only make sense once this episode has a note
    function updateNoteButtons() {
        const empty = textarea.value.trim() === '';
        downloadBtn.disabled = empty;
        clearBtn.disabled = empty;
    }

    function updateExportAllCount() {
        const count = loadAllNotes().length;
        exportAllBtn.textContent = '📚 Export all (' + count + ')';
        exportAllBtn.disabled = count === 0;
        exportAllBtn.title = count === 0
            ? 'No saved notes yet'
            : 'Download your notes from all ' + count + (count === 1 ? ' episode' : ' episodes') + ' as one Markdown file';
    }

    function clear() {
        if (!textarea.value.trim()) return;
        if (!window.confirm('Delete your notes for this episode? This cannot be undone.')) return;
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

        // Keep other open tabs in sync: the export count for any note, the text for this episode
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

/**
 * My Notes for BEMA Podcast Notes
 * Lets readers keep their own notes on each episode page.
 * Notes live only in this browser's localStorage, keyed per episode:
 *   bema-my-notes:ep-325 -> { "text": "...", "updated": "2026-11-03T16:40:00.000Z" }
 */

(function() {
    'use strict';

    const STORAGE_PREFIX = 'bema-my-notes:';
    const SAVE_DELAY_MS = 500;

    const section = document.querySelector('.my-notes');
    if (!section) return;

    const textarea = section.querySelector('.my-notes-text');
    const status = section.querySelector('.my-notes-status');
    const storageKey = STORAGE_PREFIX + section.dataset.notesKey;
    const title = section.dataset.notesTitle || document.title;
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
                const note = { text: text, updated: new Date().toISOString() };
                localStorage.setItem(storageKey, JSON.stringify(note));
                setStatus(note.updated);
            }
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
        const when = new Date(updated).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
        status.textContent = '✓ Saved on this device · ' + when;
    }

    function download() {
        const text = textarea.value.trim();
        if (!text) return;
        const body = '# My notes: ' + title + '\n\n' + text + '\n\n---\n' + window.location.href + '\n';
        const blob = new Blob([body], { type: 'text/markdown' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'bema-' + section.dataset.notesKey.replace(/[^a-z0-9-]+/gi, '-') + '-my-notes.md';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
    }

    function clear() {
        if (!textarea.value.trim()) return;
        if (!window.confirm('Delete your notes for this episode? This cannot be undone.')) return;
        clearTimeout(saveTimer);
        saveTimer = null;
        textarea.value = '';
        save('');
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

        // Keep multiple open tabs of the same episode in sync
        window.addEventListener('storage', function(e) {
            if (e.key !== storageKey || document.activeElement === textarea) return;
            const updated = load();
            textarea.value = updated ? updated.text : '';
            setStatus(updated && updated.updated);
        });

        section.querySelector('[data-notes-action="download"]').addEventListener('click', download);
        section.querySelector('[data-notes-action="clear"]').addEventListener('click', clear);
    }

    init();
})();

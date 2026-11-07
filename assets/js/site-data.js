/**
 * Site data for BEMA Podcast Notes: everything the site keeps in this
 * browser's localStorage, gathered into one JSON export (Settings page).
 *
 * What's included (keep in step with the scripts that store it):
 *   colorMode   'system' | 'light' | 'dark'      theme-switcher.js  bema-color-mode
 *   notes       { "ep-325": { title, url, updated, text } }
 *                                                my-notes.js        bema-my-notes:*
 * Not included: the analytics debug flag (a developer setting).
 *
 * Export format (versioned so an import can read older files):
 *   { "app": "BEMA Podcast Notes", "format": 1, "exported": ISO date,
 *     "site": origin, "data": { "colorMode": ..., "notes": { ... } } }
 *
 * BEMASiteData.collect() returns that object; the Settings page's
 * [data-site-data] block shows a summary and the Export button.
 *
 * Analytics: data_export with note_count (metric).
 */
(function() {
    'use strict';

    const FORMAT = 1;
    const NOTES_PREFIX = 'bema-my-notes:';
    const MODE_KEY = 'bema-color-mode';
    const REVOKE_DELAY_MS = 60000;

    // localStorage can throw (private mode, blocked site data)
    function storage() {
        try {
            return window.localStorage;
        } catch (e) {
            return null;
        }
    }

    function readNotes(store) {
        const notes = {};
        if (!store) return notes;
        for (let i = 0; i < store.length; i++) {
            // Per entry, so one unreadable note doesn't drop the rest
            try {
                const key = store.key(i);
                if (!key || key.indexOf(NOTES_PREFIX) !== 0) continue;
                const note = JSON.parse(store.getItem(key));
                if (!note || typeof note.text !== 'string' || !note.text.trim()) continue;
                notes[key.slice(NOTES_PREFIX.length)] = {
                    title: note.title || '',
                    url: note.url || '',
                    updated: note.updated || null,
                    text: note.text
                };
            } catch (e) {
                // Skip this entry
            }
        }
        // Episode order: ep--1, ep-0, ep-1 … then anything else
        const sorted = {};
        Object.keys(notes).sort(function(a, b) {
            const na = a.match(/^ep-(-?\d+)$/), nb = b.match(/^ep-(-?\d+)$/);
            if (na && nb) return Number(na[1]) - Number(nb[1]);
            if (na) return -1;
            if (nb) return 1;
            return a.localeCompare(b);
        }).forEach(function(k) { sorted[k] = notes[k]; });
        return sorted;
    }

    function readColorMode(store) {
        try {
            const saved = store && store.getItem(MODE_KEY);
            return saved === 'light' || saved === 'dark' ? saved : 'system';
        } catch (e) {
            return 'system';
        }
    }

    function collect() {
        const store = storage();
        return {
            app: 'BEMA Podcast Notes',
            format: FORMAT,
            exported: new Date().toISOString(),
            site: window.location.origin,
            data: {
                colorMode: readColorMode(store),
                notes: readNotes(store)
            }
        };
    }

    function download(filename, text) {
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function() { URL.revokeObjectURL(url); }, REVOKE_DELAY_MS);
    }

    function exportData() {
        const payload = collect();
        const date = payload.exported.slice(0, 10);
        download('bema-podcast-notes-data-' + date + '.json', JSON.stringify(payload, null, 2) + '\n');
        const count = Object.keys(payload.data.notes).length;
        if (window.BEMAAnalytics) window.BEMAAnalytics.track('data_export', { note_count: count });
        return payload;
    }

    window.BEMASiteData = { collect: collect, exportData: exportData, FORMAT: FORMAT };

    // ---- Settings page -------------------------------------------------

    const panel = document.querySelector('[data-site-data]');
    if (!panel) return;
    const notesOut = panel.querySelector('[data-site-data-notes]');
    const modeOut = panel.querySelector('[data-site-data-mode]');
    const button = panel.querySelector('[data-site-data-export]');
    const status = panel.querySelector('[data-site-data-status]');
    const MODE_NAMES = { system: 'System (matches your device)', light: 'Light', dark: 'Dark' };

    function refresh() {
        if (!storage()) {
            notesOut.textContent = 'Unavailable';
            modeOut.textContent = 'Unavailable';
            button.disabled = true;
            status.textContent = 'This browser is blocking site storage (for example, in a private window), so there’s nothing saved to export.';
            return;
        }
        const data = collect().data;
        const count = Object.keys(data.notes).length;
        notesOut.textContent = count === 0 ? 'None yet' : count + (count === 1 ? ' episode' : ' episodes');
        modeOut.textContent = MODE_NAMES[data.colorMode];
    }

    button.addEventListener('click', function() {
        const payload = exportData();
        const count = Object.keys(payload.data.notes).length;
        status.textContent = 'Downloaded bema-podcast-notes-data-' + payload.exported.slice(0, 10) + '.json (' +
            (count === 0 ? 'no notes' : count + (count === 1 ? ' episode’s notes' : ' episodes’ notes')) + ', plus your color mode).';
    });

    refresh();
    // Changes made in another tab, or with the color mode buttons on this page
    window.addEventListener('storage', refresh);
    document.addEventListener('click', function(e) {
        if (e.target.closest && e.target.closest('[data-mode-choice]')) setTimeout(refresh, 0);
    });
})();

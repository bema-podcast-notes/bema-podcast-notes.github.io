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
 * Import ([data-site-import] block): read a file, validate it, show what it
 * holds and how it overlaps this browser's notes, then apply on request:
 *   merge    keep notes from both; for an episode in both, the one with the
 *            later "updated" wins (a note without a date counts as oldest)
 *   replace  delete this browser's notes first, then write the file's
 *   plus, optionally, the file's color mode (via BEMAThemes.setMode).
 * Nothing is written until Import is pressed.
 *
 * Analytics: data_export with note_count (metric); data_import with
 * note_count (metric) and import_mode (merge|replace).
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

    // ---- Import --------------------------------------------------------

    const MAX_FILE_BYTES = 20 * 1024 * 1024;
    const KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/i;

    // Parse and check a file's text. Returns { payload } or { error }.
    function parseImport(text) {
        let payload;
        try {
            payload = JSON.parse(text);
        } catch (e) {
            return { error: 'That file isn’t valid JSON, so it can’t be imported.' };
        }
        if (!payload || typeof payload !== 'object' || payload.app !== 'BEMA Podcast Notes' || !payload.data || typeof payload.data !== 'object') {
            return { error: 'That file isn’t an export from BEMA Podcast Notes. Choose a file made with the Export button.' };
        }
        if (typeof payload.format !== 'number' || payload.format < 1) {
            return { error: 'That file’s format isn’t recognized, so it can’t be imported.' };
        }
        if (payload.format > FORMAT) {
            return { error: 'That file was made by a newer version of this site. Reload this page (or clear the browser cache) and try again.' };
        }
        const notes = {};
        let skipped = 0;
        const source = payload.data.notes && typeof payload.data.notes === 'object' ? payload.data.notes : {};
        Object.keys(source).forEach(function(key) {
            const note = source[key];
            if (!KEY_PATTERN.test(key) || !note || typeof note.text !== 'string' || !note.text.trim()) {
                skipped++;
                return;
            }
            const updated = typeof note.updated === 'string' && !isNaN(Date.parse(note.updated)) ? note.updated : null;
            notes[key] = {
                title: typeof note.title === 'string' ? note.title : '',
                url: typeof note.url === 'string' ? note.url : '',
                updated: updated,
                text: note.text
            };
        });
        const mode = payload.data.colorMode;
        return {
            payload: {
                exported: typeof payload.exported === 'string' && !isNaN(Date.parse(payload.exported)) ? payload.exported : null,
                notes: notes,
                colorMode: mode === 'system' || mode === 'light' || mode === 'dark' ? mode : null,
                skipped: skipped
            }
        };
    }

    function time(note) {
        return note && note.updated ? Date.parse(note.updated) : -Infinity;
    }

    // How the file's notes line up with this browser's
    function compare(incoming) {
        const existing = readNotes(storage());
        const result = { total: 0, added: 0, newerInFile: 0, newerHere: 0, same: 0, existingCount: Object.keys(existing).length };
        Object.keys(incoming).forEach(function(key) {
            result.total++;
            const here = existing[key];
            if (!here) result.added++;
            else if (here.text === incoming[key].text) result.same++;
            else if (time(incoming[key]) > time(here)) result.newerInFile++;
            else result.newerHere++;
        });
        return result;
    }

    // Write the file's notes. Returns counts, or throws if storage fails.
    function applyImport(incoming, mode) {
        const store = storage();
        if (!store) throw new Error('storage unavailable');
        const existing = readNotes(store);
        const counts = { written: 0, kept: 0, removed: 0 };
        if (mode === 'replace') {
            const doomed = [];
            for (let i = 0; i < store.length; i++) {
                const key = store.key(i);
                if (key && key.indexOf(NOTES_PREFIX) === 0) doomed.push(key);
            }
            doomed.forEach(function(key) { store.removeItem(key); });
            counts.removed = Object.keys(existing).length;
        }
        Object.keys(incoming).forEach(function(key) {
            const note = incoming[key];
            const here = mode === 'replace' ? null : existing[key];
            if (here && (here.text === note.text || time(here) >= time(note))) {
                counts.kept++;
                return;
            }
            // Same shape my-notes.js saves
            store.setItem(NOTES_PREFIX + key, JSON.stringify({
                text: note.text,
                updated: note.updated || new Date().toISOString(),
                title: note.title,
                url: note.url
            }));
            counts.written++;
        });
        return counts;
    }

    window.BEMASiteData = { collect: collect, exportData: exportData, parseImport: parseImport, FORMAT: FORMAT };

    // ---- Settings page -------------------------------------------------

    const panel = document.querySelector('[data-site-data]');
    if (!panel) return;
    const importPanel = document.querySelector('[data-site-import]');
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

    function plural(n, one, many) {
        return n + ' ' + (n === 1 ? one : many);
    }

    if (importPanel) {
        const chooseBtn = importPanel.querySelector('[data-import-choose]');
        const fileInput = importPanel.querySelector('[data-import-file]');
        const review = importPanel.querySelector('[data-import-review]');
        const summary = importPanel.querySelector('[data-import-summary]');
        const modes = importPanel.querySelector('[data-import-modes]');
        const colorRow = importPanel.querySelector('[data-import-color-row]');
        const colorBox = importPanel.querySelector('[data-import-color]');
        const colorName = importPanel.querySelector('[data-import-color-name]');
        const applyBtn = importPanel.querySelector('[data-import-apply]');
        const cancelBtn = importPanel.querySelector('[data-import-cancel]');
        const importStatus = importPanel.querySelector('[data-import-status]');
        let pending = null;

        function reset() {
            pending = null;
            review.hidden = true;
            fileInput.value = '';
        }

        if (!storage()) {
            chooseBtn.disabled = true;
            importStatus.textContent = 'This browser is blocking site storage (for example, in a private window), so nothing can be imported.';
        }

        chooseBtn.addEventListener('click', function() { fileInput.click(); });
        cancelBtn.addEventListener('click', function() {
            reset();
            importStatus.textContent = 'Import canceled. Nothing was changed.';
            chooseBtn.focus();
        });

        fileInput.addEventListener('change', function() {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            review.hidden = true;
            if (file.size > MAX_FILE_BYTES) {
                importStatus.textContent = 'That file is too large to be an export from this site.';
                fileInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function() {
                const parsed = parseImport(String(reader.result));
                if (parsed.error) {
                    importStatus.textContent = parsed.error;
                    fileInput.value = '';
                    return;
                }
                pending = parsed.payload;
                const c = compare(pending.notes);
                const when = pending.exported
                    ? ' exported ' + new Date(pending.exported).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                    : '';
                let text = '“' + file.name + '”' + when + ' has notes for ' + plural(c.total, 'episode', 'episodes');
                if (pending.colorMode) text += ' and the color mode ' + MODE_NAMES[pending.colorMode].replace(/ \(.*\)/, '');
                text += '.';
                if (c.total && c.existingCount) {
                    const parts = [];
                    if (c.added) parts.push(c.added + ' ' + (c.added === 1 ? 'is' : 'are') + ' new here');
                    if (c.same) parts.push(c.same + (c.same === 1 ? ' matches' : ' match') + ' what’s here');
                    if (c.newerInFile) parts.push(c.newerInFile + ' ' + (c.newerInFile === 1 ? 'is' : 'are') + ' newer in the file');
                    if (c.newerHere) parts.push(c.newerHere + ' ' + (c.newerHere === 1 ? 'is' : 'are') + ' newer here');
                    text += ' Of those, ' + parts.join(', ') + '. This browser has ' + plural(c.existingCount, 'episode', 'episodes') + ' with notes now.';
                }
                if (pending.skipped) text += ' ' + plural(pending.skipped, 'entry', 'entries') + ' in the file couldn’t be read and will be skipped.';
                summary.textContent = text;
                // Merge vs replace only matters when there's something to replace
                modes.hidden = c.existingCount === 0;
                colorRow.hidden = !pending.colorMode;
                if (pending.colorMode) colorName.textContent = MODE_NAMES[pending.colorMode];
                colorBox.checked = true;
                importStatus.textContent = '';
                review.hidden = false;
                applyBtn.disabled = c.total === 0 && !pending.colorMode;
                applyBtn.focus();
            };
            reader.onerror = function() {
                importStatus.textContent = 'That file couldn’t be read.';
                fileInput.value = '';
            };
            reader.readAsText(file);
        });

        applyBtn.addEventListener('click', function() {
            if (!pending) return;
            const checked = importPanel.querySelector('input[name="import-mode"]:checked');
            const mode = modes.hidden ? 'merge' : (checked ? checked.value : 'merge');
            if (mode === 'replace' && !window.confirm('Delete every note in this browser and replace them with the file’s notes? This can’t be undone.')) return;
            let counts;
            try {
                counts = applyImport(pending.notes, mode);
            } catch (e) {
                importStatus.textContent = 'The import stopped partway: this browser ran out of storage space or refused to save. Some notes may not have been imported.';
                refresh();
                return;
            }
            const parts = [];
            if (counts.removed) parts.push('removed ' + plural(counts.removed, 'episode’s', 'episodes’') + ' notes');
            parts.push('imported notes for ' + plural(counts.written, 'episode', 'episodes'));
            if (counts.kept) parts.push('kept your newer or identical notes for ' + plural(counts.kept, 'episode', 'episodes'));
            let done = parts.join(', ');
            done = done.charAt(0).toUpperCase() + done.slice(1) + '.';
            if (pending.colorMode && colorBox.checked && window.BEMAThemes) {
                window.BEMAThemes.setMode(pending.colorMode);
                done += ' Color mode set to ' + MODE_NAMES[pending.colorMode] + '.';
            }
            if (window.BEMAAnalytics) window.BEMAAnalytics.track('data_import', { note_count: counts.written, import_mode: mode });
            reset();
            importStatus.textContent = done;
            refresh();
            chooseBtn.focus();
        });
    }

    refresh();
    // Changes made in another tab, or with the color mode buttons on this page
    window.addEventListener('storage', refresh);
    document.addEventListener('click', function(e) {
        if (e.target.closest && e.target.closest('[data-mode-choice]')) setTimeout(refresh, 0);
    });
})();

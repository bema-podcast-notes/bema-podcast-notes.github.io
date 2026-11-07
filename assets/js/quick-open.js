/**
 * Quick open for BEMA Podcast Notes: ⌘K (Mac) or Ctrl+K anywhere on the site.
 *
 *   201 / ep 201 / #201   jump to an episode by number
 *   s3 / session 3        a session overview
 *   home, resources, …    site pages
 *   words                 episode titles and subtitles; the last result
 *                         always offers a full-text search of the notes
 *
 * ↑ ↓ move through results, Enter opens one (⌘/Ctrl+Enter in a new tab),
 * Esc closes. Any element with [data-quick-open] opens it on click too
 * (the header's Search link on every page but /search/, and the phone/tablet
 * search button in the episode nav); [data-quick-open-key] gets
 * the platform's shortcut text (⌘K or Ctrl K).
 *
 * The index (/quick-open.json, built by Jekyll, ~17 KB gzipped) is fetched
 * when ⌘/Ctrl is first pressed or the box opens. Markup is a <dialog> with an ARIA combobox + listbox, so
 * screen readers hear the highlighted result as it changes. Browsers
 * without <dialog> (Safari < 15.4) go straight to the search page instead.
 *
 * Analytics: quick_open_select with quick_open_type
 * (episode|session|page|search|action).
 */
(function() {
    'use strict';

    const BASE = ''; // the site is served from the domain root
    const INDEX_URL = BASE + '/quick-open.json';
    const SEARCH_URL = BASE + '/search/';
    const MAX_RESULTS = 8;
    const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

    let dialog, input, list, status, tip;
    let index = null;
    let loading = null;
    let results = [];
    let active = 0;
    let returnFocus = null;
    let statusTimer = null;

    // ---- Text matching -------------------------------------------------

    function normalize(text) {
        return String(text || '')
            .normalize('NFD').replace(/[̀-ͯ]/g, '') // drop accents
            .toLowerCase()
            .replace(/[ \s]+/g, ' ')
            .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9' -]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function prepare(data) {
        data.pages.forEach(function(p) {
            p.type = p.a ? 'action' : p.se ? 'session' : 'page';
            p.title = normalize(p.t);
            p.extra = normalize(p.k);
        });
        data.episodes.forEach(function(e) {
            e.type = 'episode';
            e.title = normalize(e.t);
            e.extra = normalize(e.s);
        });
        return data;
    }

    // Score how well one query word matches a field: start of the field >
    // start of a word > anywhere inside.
    function wordScore(word, field, weight) {
        const at = field.indexOf(word);
        if (at === -1) return 0;
        if (at === 0) return 3 * weight;
        const before = field.charAt(at - 1);
        return (before === ' ' || before === "'" || before === '-' ? 2 : 1) * weight;
    }

    function textScore(item, words, phrase) {
        let total = 0;
        for (let i = 0; i < words.length; i++) {
            const s = Math.max(wordScore(words[i], item.title, 10), wordScore(words[i], item.extra, 4));
            if (!s) return 0; // every word has to match somewhere
            total += s;
        }
        if (item.title === phrase) total += 60;
        else if (item.title.indexOf(phrase) === 0) total += 30;
        else if (item.title.indexOf(phrase) !== -1) total += 15;
        if (item.type !== 'episode') total += 8; // "home" → the Home page before an episode mentioning home
        return total;
    }

    function search(raw) {
        const query = raw.trim();
        const phrase = normalize(query);
        const found = [];

        if (!phrase) {
            // Nothing typed yet: the main pages
            return index.pages.filter(function(p) { return p.type === 'page'; }).slice(0, MAX_RESULTS);
        }

        // Episode number: "201", "ep 201", "episode 201", "#201", "e201", "-1"
        const num = query.toLowerCase().match(/^(?:#|e|ep|ep\.|episode)?\s*(-?\d+)$/);
        // Session: "s3", "session 3", "season 3"
        const ses = query.toLowerCase().match(/^(?:s|session|season)\s*(\d+)$/);

        if (ses) {
            index.pages.forEach(function(p) {
                if (p.type === 'session' && String(p.se) === ses[1]) found.push({ item: p, score: 1000 });
            });
        }
        if (num) {
            index.episodes.forEach(function(e) {
                if (e.n === num[1]) found.push({ item: e, score: 1000 });
                else if (e.n.indexOf(num[1]) === 0) found.push({ item: e, score: 500 - e.n.length });
            });
        }

        const words = phrase.split(' ');
        const seen = found.map(function(f) { return f.item; });
        index.pages.concat(index.episodes).forEach(function(item) {
            if (seen.indexOf(item) !== -1) return;
            const s = textScore(item, words, phrase);
            if (s) found.push({ item: item, score: s });
        });

        found.sort(function(a, b) {
            if (b.score !== a.score) return b.score - a.score;
            // Ties: pages first, then episodes in order
            const an = a.item.type === 'episode' ? parseInt(a.item.n, 10) : -Infinity;
            const bn = b.item.type === 'episode' ? parseInt(b.item.n, 10) : -Infinity;
            return an - bn;
        });

        const top = found.slice(0, MAX_RESULTS).map(function(f) { return f.item; });
        // Always offer a full-text search of the notes last, even when a number
        // matched an episode ("60" may also appear in the notes as a verse or year)
        top.push({ type: 'search', q: query });
        return top;
    }

    // ---- Rendering -----------------------------------------------------

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function urlFor(item) {
        return item.type === 'search' ? SEARCH_URL + '?q=' + encodeURIComponent(item.q) : item.u;
    }

    function renderItem(item, i) {
        const li = el('li', 'quick-open-item');
        li.id = 'quick-open-item-' + i;
        li.setAttribute('role', 'option');
        li.setAttribute('data-index', i);

        const main = el('span', 'quick-open-main');
        const meta = el('span', 'quick-open-meta');

        if (item.type === 'episode') {
            main.appendChild(el('span', 'quick-open-number', item.n));
            const text = el('span', 'quick-open-text');
            text.appendChild(el('span', 'quick-open-title', item.t));
            if (item.s) text.appendChild(el('span', 'quick-open-sub', item.s));
            main.appendChild(text);
            const heard = window.BEMAListened && window.BEMAListened.get('ep-' + item.n);
            meta.textContent = (heard ? '✓ Listened · ' : '') + 'Session ' + item.se + (item.x ? ' · no notes yet' : '');
        } else if (item.type === 'search') {
            const text = el('span', 'quick-open-text');
            text.appendChild(el('span', 'quick-open-title', 'Search the notes for “' + item.q + '”'));
            main.appendChild(text);
            meta.textContent = 'Full-text search';
        } else {
            const text = el('span', 'quick-open-text');
            text.appendChild(el('span', 'quick-open-title', item.t));
            main.appendChild(text);
            meta.textContent = item.type === 'session' ? 'Session overview' : item.type === 'action' ? 'Help' : 'Page';
        }

        li.appendChild(main);
        li.appendChild(meta);
        return li;
    }

    function render() {
        list.innerHTML = '';
        // Empty-state tip (hidden when tips are off, via html.tips-off)
        if (tip) tip.hidden = !!input.value.trim();
        results.forEach(function(item, i) { list.appendChild(renderItem(item, i)); });
        setActive(results.length ? 0 : -1);
        announce(results.length === 0 ? 'No matches' :
            results.length + (results.length === 1 ? ' result' : ' results'));
    }

    function setActive(i) {
        const items = list.children;
        if (items[active]) items[active].setAttribute('aria-selected', 'false');
        active = i;
        if (items[active]) {
            items[active].setAttribute('aria-selected', 'true');
            input.setAttribute('aria-activedescendant', items[active].id);
            items[active].scrollIntoView({ block: 'nearest' });
        } else {
            input.removeAttribute('aria-activedescendant');
        }
    }

    // Debounced so screen readers aren't flooded while typing
    function announce(text) {
        clearTimeout(statusTimer);
        statusTimer = setTimeout(function() { status.textContent = text; }, 400);
    }

    // ---- Opening, closing, choosing ------------------------------------

    function build() {
        dialog = el('dialog', 'quick-open');
        dialog.setAttribute('aria-label', 'Quick open');

        const form = el('div', 'quick-open-box');
        const field = el('div', 'quick-open-field');
        field.innerHTML = '<svg class="icon" aria-hidden="true" focusable="false"><use href="' + BASE +
            '/assets/icons.svg#search" xlink:href="' + BASE + '/assets/icons.svg#search"></use></svg>';

        input = el('input', 'quick-open-input');
        input.type = 'text';
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-expanded', 'true');
        input.setAttribute('aria-controls', 'quick-open-list');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-label', 'Go to an episode number, page, or title, or search the notes');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');
        input.placeholder = 'Episode number, title, page, or search…';
        field.appendChild(input);
        field.appendChild(el('kbd', 'quick-open-esc', 'esc'));

        tip = el('p', 'tip-line quick-open-tip', 'Try an episode number like 201 or -1, a session like s3, a page like settings, or words from a title.');

        list = el('ul', 'quick-open-list');
        list.id = 'quick-open-list';
        list.setAttribute('role', 'listbox');
        list.setAttribute('aria-label', 'Results');

        status = el('div', 'visually-hidden');
        status.setAttribute('role', 'status');

        const help = el('p', 'quick-open-help');
        help.setAttribute('aria-hidden', 'true');
        help.innerHTML = '<span><kbd>↑</kbd><kbd>↓</kbd> choose</span><span><kbd>↵</kbd> open</span>' +
            '<span><kbd>' + (IS_MAC ? '⌘' : 'Ctrl') + '</kbd><kbd>↵</kbd> new tab</span><span><kbd>esc</kbd> close</span>';

        form.appendChild(field);
        form.appendChild(tip);
        form.appendChild(list);
        form.appendChild(status);
        form.appendChild(help);
        dialog.appendChild(form);
        document.body.appendChild(dialog);

        input.addEventListener('input', update);
        input.addEventListener('keydown', onKey);
        list.addEventListener('mousemove', function(e) {
            const li = e.target.closest && e.target.closest('[role="option"]');
            if (li) {
                const i = parseInt(li.getAttribute('data-index'), 10);
                if (i !== active) setActive(i);
            }
        });
        list.addEventListener('click', function(e) {
            const li = e.target.closest && e.target.closest('[role="option"]');
            if (li) choose(parseInt(li.getAttribute('data-index'), 10), e.metaKey || e.ctrlKey);
        });
        // Click on the backdrop (the dialog itself, outside the box) closes it
        dialog.addEventListener('click', function(e) { if (e.target === dialog) close(); });
        dialog.addEventListener('close', function() {
            document.documentElement.classList.remove('quick-open-active');
            if (returnFocus && returnFocus.focus) returnFocus.focus();
        });
    }

    function loadIndex() {
        if (index) return Promise.resolve(index);
        if (!loading) {
            loading = fetch(INDEX_URL)
                .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
                .then(function(data) { index = prepare(data); return index; })
                .catch(function(err) { loading = null; throw err; });
        }
        return loading;
    }

    function update() {
        if (!index) return;
        results = search(input.value);
        render();
    }

    function open() {
        if (typeof HTMLDialogElement !== 'function') {
            window.location.href = SEARCH_URL;
            return;
        }
        if (!dialog) build();
        if (dialog.open) { input.select(); return; }
        returnFocus = document.activeElement;
        input.value = '';
        list.innerHTML = '';
        dialog.showModal();
        document.documentElement.classList.add('quick-open-active');
        input.focus();
        if (index) {
            update();
        } else {
            list.innerHTML = '<li class="quick-open-empty" role="presentation">Loading…</li>';
            loadIndex().then(update, function() {
                list.innerHTML = '<li class="quick-open-empty" role="presentation">Couldn’t load the episode list. Press Enter to search instead.</li>';
                results = [];
            });
        }
    }

    function close() {
        if (dialog && dialog.open) dialog.close();
    }

    function choose(i, newTab) {
        let item = results[i];
        if (!item) {
            // Index failed to load: still let Enter run a full search
            if (!input.value.trim()) return;
            item = { type: 'search', q: input.value.trim() };
        }
        if (window.BEMAAnalytics) window.BEMAAnalytics.track('quick_open_select', { quick_open_type: item.type });
        if (item.type === 'action') {
            returnFocus = null;
            close();
            if (item.a === 'shortcuts' && window.BEMAShortcuts) window.BEMAShortcuts.open('quick_open');
            return;
        }
        const url = urlFor(item);
        if (newTab) {
            window.open(url, '_blank', 'noopener');
            return;
        }
        returnFocus = null;
        close();
        window.location.href = url;
    }

    function onKey(e) {
        if (e.isComposing || e.keyCode === 229) return;
        const count = results.length;
        switch (e.key) {
            case 'ArrowDown':
            case 'Down':
                e.preventDefault();
                if (count) setActive((active + 1) % count);
                break;
            case 'ArrowUp':
            case 'Up':
                e.preventDefault();
                if (count) setActive((active - 1 + count) % count);
                break;
            case 'Enter':
                e.preventDefault();
                choose(active, e.metaKey || e.ctrlKey);
                break;
            case 'Tab':
                // Only one focusable control; keep focus here
                e.preventDefault();
                break;
        }
    }

    // ---- Shortcut ------------------------------------------------------

    document.addEventListener('keydown', function(e) {
        const isK = e.key === 'k' || e.key === 'K' || e.keyCode === 75;
        if (!isK || e.altKey || e.shiftKey || !(e.metaKey || e.ctrlKey)) return;
        e.preventDefault();
        if (dialog && dialog.open) close();
        else open();
    });

    // Triggers are links to /search/ (so they work without JS); here they
    // become buttons that open the dialog, with the right key hint.
    const triggers = document.querySelectorAll('[data-quick-open]');
    for (let i = 0; i < triggers.length; i++) {
        triggers[i].setAttribute('role', 'button');
        triggers[i].setAttribute('aria-haspopup', 'dialog');
        if (!IS_MAC) triggers[i].title = (triggers[i].title || '').replace('⌘K or ', '');
    }
    const keyHints = document.querySelectorAll('[data-quick-open-key]');
    for (let i = 0; i < keyHints.length; i++) keyHints[i].textContent = IS_MAC ? '⌘K' : 'Ctrl K';

    document.addEventListener('click', function(e) {
        const trigger = e.target.closest && e.target.closest('[data-quick-open]');
        if (!trigger) return;
        // ⌘/Ctrl/Shift-click or middle-click: let the link open /search/ as usual
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e.button && e.button !== 0)) return;
        e.preventDefault();
        open();
    });

    // role="button" links should also open with Space, like real buttons
    document.addEventListener('keydown', function(e) {
        if (e.key !== ' ' && e.key !== 'Spacebar') return;
        const trigger = e.target.closest && e.target.closest('[data-quick-open]');
        if (!trigger) return;
        e.preventDefault();
        open();
    });

    // Start fetching the index as soon as ⌘ or Ctrl goes down (or a trigger
    // is hovered), so it's usually ready by the time K is pressed, without
    // every visitor downloading it on every page.
    function prefetch() { loadIndex().catch(function() {}); }
    document.addEventListener('keydown', function(e) {
        if (!index && (e.key === 'Meta' || e.key === 'Control')) prefetch();
    });
    document.addEventListener('pointerover', function(e) {
        if (!index && e.target.closest && e.target.closest('[data-quick-open]')) prefetch();
    });

    window.BEMAQuickOpen = { open: open, close: close };
})();

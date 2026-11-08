/**
 * Listened episodes for BEMA Podcast Notes.
 *
 * Stored in this browser only, as one localStorage entry:
 *   bema-listened -> { "ep-325": { "count": 2, "first": ISO date, "last": ISO date } }
 * count is how many times the reader has marked it listened (1 = once).
 *
 * BEMAListened API (also used by quick-open.js and site-data.js):
 *   get(key)        -> { count, first, last } or null
 *   all()           -> the whole map
 *   setCount(key, n) n = 0 removes the episode
 *   replaceAll(map) used by import
 *
 * On the page:
 *   [data-listened="ep-325"]  episode page control: Mark as listened, then
 *                             ✓ Listened with − n× + to count repeat listens
 *   episode links (a[href^="/ep/"]) in the homepage and session lists get a
 *   ✓ when listened, and homepage session headers get "· n listened".
 * Changes in another tab update this one (storage event).
 *
 * Analytics: listened with listen_action (mark|unmark|again|fewer).
 */
(function() {
    'use strict';

    const KEY = 'bema-listened';
    // The icon sprite's URL as the page's own icons use it (versioned by
    // _includes/icon.html), so script-made icons share that cached copy
    const SPRITE = (function() {
        const use = document.querySelector('use[href*="icons.svg"]');
        return use ? use.getAttribute('href').split('#')[0] : '/assets/icons.svg';
    })();
    const ICON = SPRITE + '#check';

    function store() {
        try {
            return window.localStorage;
        } catch (e) {
            return null;
        }
    }

    function clean(entry) {
        if (!entry || typeof entry !== 'object') return null;
        const count = Math.floor(Number(entry.count));
        if (!(count >= 1)) return null;
        return {
            count: Math.min(count, 9999),
            first: typeof entry.first === 'string' ? entry.first : null,
            last: typeof entry.last === 'string' ? entry.last : null
        };
    }

    function all() {
        const s = store();
        if (!s) return {};
        try {
            const raw = JSON.parse(s.getItem(KEY) || '{}');
            const out = {};
            Object.keys(raw || {}).forEach(function(k) {
                const e = clean(raw[k]);
                if (e) out[k] = e;
            });
            return out;
        } catch (e) {
            return {};
        }
    }

    function save(map) {
        const s = store();
        if (!s) return false;
        try {
            if (Object.keys(map).length) s.setItem(KEY, JSON.stringify(map));
            else s.removeItem(KEY);
            return true;
        } catch (e) {
            return false;
        }
    }

    function get(key) {
        return all()[key] || null;
    }

    function setCount(key, n) {
        const map = all();
        const now = new Date().toISOString();
        if (n <= 0) {
            delete map[key];
        } else {
            const prev = map[key];
            map[key] = {
                count: Math.min(Math.floor(n), 9999),
                first: prev && prev.first ? prev.first : now,
                last: !prev || n > prev.count ? now : prev.last
            };
        }
        const ok = save(map);
        decorate();
        return ok;
    }

    function replaceAll(map) {
        const out = {};
        Object.keys(map || {}).forEach(function(k) {
            const e = clean(map[k]);
            if (e) out[k] = e;
        });
        const ok = save(out);
        decorate();
        return ok;
    }

    function track(action) {
        if (window.BEMAAnalytics) window.BEMAAnalytics.track('listened', { listen_action: action });
    }

    // ---- Episode page control ------------------------------------------

    const control = document.querySelector('[data-listened]');
    let toggle, label, counter, times, fewer;

    function renderControl() {
        if (!control) return;
        const entry = get(control.getAttribute('data-listened'));
        const count = entry ? entry.count : 0;
        toggle.setAttribute('aria-pressed', count ? 'true' : 'false');
        label.textContent = count ? 'Listened' : 'Mark as listened';
        counter.hidden = !count;
        times.textContent = count + '×';
        times.setAttribute('aria-label', 'Listened ' + (count === 1 ? 'once' : count + ' times'));
        fewer.disabled = count <= 1;
    }

    if (control && store()) {
        toggle = control.querySelector('[data-listened-toggle]');
        label = control.querySelector('[data-listened-label]');
        counter = control.querySelector('[data-listened-counter]');
        times = control.querySelector('[data-listened-times]');
        fewer = control.querySelector('[data-listened-step="-1"]');
        const key = control.getAttribute('data-listened');
        control.hidden = false;

        toggle.addEventListener('click', function() {
            const entry = get(key);
            if (entry) {
                if (entry.count > 1 && !window.confirm('Unmark this episode? Its listen count (' + entry.count + ') will be cleared.')) return;
                setCount(key, 0);
                track('unmark');
            } else {
                setCount(key, 1);
                track('mark');
            }
            renderControl();
        });
        control.querySelectorAll('[data-listened-step]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const step = Number(btn.getAttribute('data-listened-step'));
                const entry = get(key);
                const count = entry ? entry.count : 0;
                if (step < 0 && count <= 1) return;
                setCount(key, count + step);
                track(step > 0 ? 'again' : 'fewer');
                renderControl();
            });
        });
        renderControl();
    }

    // ---- Lists ---------------------------------------------------------

    function keyForHref(href) {
        const m = /^\/ep\/(-?\d+)\/?$/.exec(href || '');
        return m ? 'ep-' + m[1] : null;
    }

    function mark(link, entry) {
        let badge = link.querySelector('.listened-mark');
        if (!entry) {
            if (badge) badge.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'listened-mark';
            badge.innerHTML = '<svg class="icon" aria-hidden="true" focusable="false"><use href="' + ICON + '" xlink:href="' + ICON + '"></use></svg><span class="visually-hidden"> (listened)</span>';
            link.appendChild(badge);
        }
        badge.title = entry.count > 1 ? 'Listened ' + entry.count + ' times' : 'Listened';
    }

    function decorate() {
        const map = all();
        const links = document.querySelectorAll('.episode-item > a, .session-episodes a');
        for (let i = 0; i < links.length; i++) {
            const key = keyForHref(links[i].getAttribute('href'));
            if (key) mark(links[i], map[key]);
        }
        // Homepage session headers: "(70 episodes · 12 listened)"
        const groups = document.querySelectorAll('.session-group');
        for (let g = 0; g < groups.length; g++) {
            const countEl = groups[g].querySelector('.session-count');
            if (!countEl) continue;
            if (!countEl.hasAttribute('data-base')) countEl.setAttribute('data-base', countEl.textContent.replace(/^\(|\)$/g, ''));
            const items = groups[g].querySelectorAll('.episode-item > a');
            let listened = 0;
            for (let i = 0; i < items.length; i++) if (map[keyForHref(items[i].getAttribute('href'))]) listened++;
            countEl.textContent = '(' + countEl.getAttribute('data-base') + (listened ? ' · ' + listened + ' listened' : '') + ')';
        }
    }

    decorate();
    window.addEventListener('storage', function(e) {
        if (e.key === KEY || e.key === null) {
            decorate();
            renderControl();
        }
    });

    window.BEMAListened = { get: get, all: all, setCount: setCount, replaceAll: replaceAll, KEY: KEY };
})();

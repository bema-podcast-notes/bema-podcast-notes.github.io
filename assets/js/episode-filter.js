/**
 * All Episodes filter on the homepage: Show All / With notes / With guides.
 *
 * Rows carry has-notes / no-notes / has-guide (_includes/session-list.html).
 * The choice goes on #episodes as data-filter, and CSS hides the rows that
 * don't match (homepage.css). Sessions with no matching episodes are hidden
 * too, and the status line says what's showing. Open/closed sessions are
 * left as the reader set them.
 *
 * The choice is remembered in this browser (bema-episode-filter). Without
 * JS the control stays hidden and every episode shows.
 *
 * Analytics: episode_filter with filter_value (all|notes|guides).
 */
(function() {
    'use strict';

    const KEY = 'bema-episode-filter';
    const list = document.getElementById('episodes');
    const bar = document.querySelector('[data-episode-filter]');
    if (!list || !bar) return;
    const buttons = bar.querySelectorAll('[data-filter]');
    const status = bar.querySelector('[data-episode-filter-status]');
    const MATCH = { notes: '.episode-item.has-notes', guides: '.episode-item.has-guide' };
    const WHAT = { notes: ['episode with notes', 'episodes with notes'], guides: ['episode with a discussion guide', 'episodes with discussion guides'] };

    function load() {
        try {
            const v = localStorage.getItem(KEY);
            return v === 'notes' || v === 'guides' ? v : 'all';
        } catch (e) {
            return 'all';
        }
    }

    function save(value) {
        try {
            if (value === 'all') localStorage.removeItem(KEY);
            else localStorage.setItem(KEY, value);
        } catch (e) {
            // Not remembered; harmless
        }
    }

    function apply(value) {
        list.setAttribute('data-filter', value);
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].setAttribute('aria-pressed', buttons[i].getAttribute('data-filter') === value ? 'true' : 'false');
        }
        const groups = list.querySelectorAll('.session-group');
        if (value === 'all') {
            for (let g = 0; g < groups.length; g++) groups[g].classList.remove('filter-empty');
            status.textContent = '';
            return;
        }
        let total = 0;
        const shown = [];
        for (let g = 0; g < groups.length; g++) {
            const n = groups[g].querySelectorAll(MATCH[value]).length;
            groups[g].classList.toggle('filter-empty', n === 0);
            if (n) {
                total += n;
                shown.push(groups[g].getAttribute('data-session-name') || 'a session');
            }
        }
        const what = total === 1 ? WHAT[value][0] : WHAT[value][1];
        if (total === 0) status.textContent = 'No ' + WHAT[value][1] + ' yet.';
        else if (shown.length <= 2) status.textContent = 'Showing ' + total + ' ' + what + ', in ' + shown.join(' and ') + '.';
        else status.textContent = 'Showing ' + total + ' ' + what + ', in ' + shown.length + ' sessions.';
    }

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function() {
            const value = this.getAttribute('data-filter');
            if (list.getAttribute('data-filter') === value) return;
            apply(value);
            save(value);
            if (window.BEMAAnalytics) window.BEMAAnalytics.track('episode_filter', { filter_value: value });
        });
    }

    bar.hidden = false;
    apply(load());
})();

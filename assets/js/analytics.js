/**
 * Analytics events for BEMA Podcast Notes (GA4 via gtag, production only).
 *
 *   BEMAAnalytics.track(name, params)        send an event
 *   BEMAAnalytics.setUserProperties(props)   e.g. { color_mode: 'dark' }
 *
 * Without gtag (local builds) calls are no-ops. Every call is also kept in
 * BEMAAnalytics.events, and logged to the console when
 * localStorage['bema-analytics-debug'] is '1', for checking locally.
 * Never send note text or anything personal. Parameter names are specific
 * (nav_method, not method) so they can't collide with GA's own parameters,
 * and numbers that should be summed (note_count, search_results) are meant
 * to be registered as custom metrics, not dimensions.
 *
 * Events and parameters:
 *   episode_nav             nav_direction (next|prev), nav_method (button|hotkey|up_next)
 *   notes_progress          notes_percent (25|50|75|100)
 *   my_notes_saved, my_notes_download
 *   my_notes_export_all     note_count (metric)
 *   copy_episode_info       copy_success (true|false)
 *   previous_versions_open
 *   version_tab             notes_version (earlier|original)
 *   color_mode              mode_choice (system|light|dark), mode_applied (light|dark)
 *   search                  search_term (built in), search_results (metric)
 *   quick_open_select       quick_open_type (episode|session|page|search|action)
 *   shortcuts_open          shortcuts_method (key|footer|quick_open)
 *   data_export             note_count (metric)
 *
 * Handled here: episode_nav for prev/next buttons and the Next episode card,
 * and notes_progress (25/50/75/100% of an episode's notes read). Feature
 * scripts send their own events: my-notes.js, copy-episode.js,
 * previous-versions.js, theme-switcher.js, episode-hotkeys.js, search.js,
 * quick-open.js, shortcuts.js, site-data.js.
 */

(function() {
    'use strict';

    const DEBUG_KEY = 'bema-analytics-debug';
    const events = [];

    function debugging() {
        try {
            return localStorage.getItem(DEBUG_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function record(name, params) {
        events.push({ name: name, params: params });
        if (debugging() && window.console) console.info('[analytics]', name, params);
    }

    function track(name, params) {
        params = params || {};
        record(name, params);
        if (typeof window.gtag === 'function') window.gtag('event', name, params);
    }

    function setUserProperties(props) {
        record('user_properties', props);
        if (typeof window.gtag === 'function') window.gtag('set', 'user_properties', props);
    }

    window.BEMAAnalytics = { track: track, setUserProperties: setUserProperties, events: events };

    // Prev/next buttons (top and bottom nav) and the Next episode card.
    // Hotkeys report themselves (method "hotkey") in episode-hotkeys.js.
    document.addEventListener('click', function(e) {
        let link = e.target;
        while (link && link.nodeName !== 'A') link = link.parentNode;
        if (!link) return;
        const rel = link.getAttribute('rel');
        if (rel !== 'next' && rel !== 'prev') return;
        const isCard = (' ' + link.className + ' ').indexOf(' up-next ') !== -1;
        track('episode_nav', { nav_direction: rel, nav_method: isCard ? 'up_next' : 'button' });
    });

    // Reading depth through an episode's notes (only pages that have notes)
    function watchNotesProgress() {
        if (!document.querySelector('.episode-notes-section[itemprop="articleBody"]')) return;
        const notes = document.querySelector('.notes-content');
        if (!notes) return;
        const thresholds = [25, 50, 75, 100];
        let next = 0;
        let ticking = false;

        function check() {
            ticking = false;
            const rect = notes.getBoundingClientRect();
            if (rect.height <= 0) return;
            const seen = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / rect.height));
            while (next < thresholds.length && seen * 100 >= thresholds[next]) {
                track('notes_progress', { notes_percent: thresholds[next] });
                next++;
            }
            if (next >= thresholds.length) window.removeEventListener('scroll', onScroll);
        }

        function onScroll() {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(check);
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        check(); // short notes may already be fully on screen
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', watchNotesProgress);
    } else {
        watchNotesProgress();
    }
})();

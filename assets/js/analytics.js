/**
 * Analytics events for BEMA Podcast Notes (GA4 via gtag, production only).
 *
 *   BEMAAnalytics.track(name, params)        send an event
 *   BEMAAnalytics.setUserProperties(props)   e.g. { color_mode: 'dark' }
 *
 * Without gtag (local builds) calls are no-ops. Every event is also
 * dispatched on document as 'bema:track' ({ name, params }) for tips.js.
 * Every call is also kept in BEMAAnalytics.events, and logged to the console when
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
 *   data_import             note_count (metric), import_mode (merge|replace)
 *   listened                listen_action (mark|unmark|again|fewer)
 *   reader_visit            visit_number (metric), visit_bucket (1|2|3-5|6-10|11-25|26+),
 *                           days_since_last (metric; not on a first visit),
 *                           return_gap (first|same day|1-7 days|8-30 days|31-90 days|90+ days)
 *                           Once per visit (30+ min without activity starts a new one),
 *                           counted in this browser only (localStorage bema-visits).
 *                           Also sets user property visit_bucket.
 *   notes_section_view      section_name, section_index (1-based). A notes or guide heading
 *                           half visible for 1s, once per heading per page view.
 *                           Episodes: Title & Source Summary | Key Takeaways |
 *                           Main Concepts & Theories | Examples & Applications |
 *                           Further Exploration | Comprehension Questions |
 *                           Discussion Questions | Original Notes | Summary | Other.
 *                           Guides: Series overview | About this episode | Opening |
 *                           Reflection questions | Closing | Looking ahead | References | Discussion.
 *   notes_feedback          feedback_value (yes|no)               notes-feedback.js
 *   notes_feedback_reason   feedback_value, feedback_reason (fixed list, no free text)
 *
 * Handled here: episode_nav for prev/next buttons and the Next episode card,
 * notes_progress (25/50/75/100% of an episode's notes read), reader_visit and
 * notes_section_view. Feature scripts send their own events: my-notes.js,
 * copy-episode.js, previous-versions.js, theme-switcher.js, episode-hotkeys.js,
 * search.js, quick-open.js, shortcuts.js, site-data.js, listened.js,
 * notes-feedback.js.
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
        // Also announced on the page, so features like tips.js can react to
        // what the reader just did without each script calling them
        try {
            document.dispatchEvent(new CustomEvent('bema:track', { detail: { name: name, params: params } }));
        } catch (e) {
            // Old browsers without CustomEvent: nothing listens there anyway
        }
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

    // Visits: a count kept only in this browser (bema-visits), so return
    // visits can be measured without relying on GA's cookie, which Safari
    // clears after 7 days. A visit starts after 30+ minutes without activity.
    const VISITS_KEY = 'bema-visits';
    const VISIT_GAP = 30 * 60 * 1000;

    function readVisits() {
        try {
            const v = JSON.parse(localStorage.getItem(VISITS_KEY) || 'null');
            return v && typeof v.count === 'number' && typeof v.last === 'number' ? v : null;
        } catch (e) {
            return undefined; // storage blocked: don't count at all
        }
    }

    function writeVisits(v) {
        try {
            localStorage.setItem(VISITS_KEY, JSON.stringify(v));
        } catch (e) {
            // Storage full or blocked
        }
    }

    function visitBucket(n) {
        return n <= 2 ? String(n) : n <= 5 ? '3-5' : n <= 10 ? '6-10' : n <= 25 ? '11-25' : '26+';
    }

    function returnGap(days) {
        if (days == null) return 'first';
        return days === 0 ? 'same day' : days <= 7 ? '1-7 days' : days <= 30 ? '8-30 days' : days <= 90 ? '31-90 days' : '90+ days';
    }

    function localDay(ms) {
        const d = new Date(ms);
        return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5;
    }

    function trackVisit() {
        const rec = readVisits();
        if (rec === undefined) return;
        const now = Date.now();
        if (rec && now - rec.last < VISIT_GAP) {
            rec.last = now;
            writeVisits(rec);
            return;
        }
        const count = (rec ? rec.count : 0) + 1;
        const days = rec ? Math.max(0, localDay(now) - localDay(rec.last)) : null;
        const today = new Date(now);
        const first = (rec && rec.first) || (today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0'));
        writeVisits({ count: count, first: first, last: now });
        const params = { visit_number: count, visit_bucket: visitBucket(count), return_gap: returnGap(days) };
        if (days != null) params.days_since_last = days;
        setUserProperties({ visit_bucket: params.visit_bucket });
        track('reader_visit', params);
    }

    // Keep the visit going while the reader is active on one long page
    let lastTouch = Date.now();
    function touchVisit() {
        const now = Date.now();
        if (now - lastTouch < 60 * 1000) return;
        lastTouch = now;
        const rec = readVisits();
        if (rec) {
            rec.last = now;
            writeVisits(rec);
        }
    }

    trackVisit();
    ['scroll', 'click', 'keydown'].forEach(function(type) {
        window.addEventListener(type, touchVisit, { passive: true });
    });

    // Which parts of the notes get read: a heading at least half visible for
    // a second counts once per page view. Headings map to a short, fixed
    // list of names so reports stay readable. Only the current notes (and
    // guide content) are watched, not Previous versions.
    const EPISODE_SECTIONS = [
        [/title\s*&?\s*(and\s*)?source/i, 'Title & Source Summary'],
        [/key\s+takeaway/i, 'Key Takeaways'],
        [/main\s+concept/i, 'Main Concepts & Theories'],
        [/example/i, 'Examples & Applications'],
        [/further\s+exploration|areas\s+for/i, 'Further Exploration'],
        [/comprehension/i, 'Comprehension Questions'],
        [/discussion/i, 'Discussion Questions'],
        [/original\s+notes/i, 'Original Notes'],
        [/summary/i, 'Summary'],
    ];
    const GUIDE_SECTIONS = [
        [/at a glance|series/i, 'Series overview'],
        [/about this episode/i, 'About this episode'],
        [/^opening/i, 'Opening'],
        [/reflection question/i, 'Reflection questions'],
        [/^closing/i, 'Closing'],
        [/looking ahead/i, 'Looking ahead'],
        [/^references/i, 'References'],
    ];

    function sectionName(text, isGuide) {
        if (!isGuide && /^bema\b.*|study notes\s*$/i.test(text)) return null; // the notes' own title
        const list = isGuide ? GUIDE_SECTIONS : EPISODE_SECTIONS;
        for (let i = 0; i < list.length; i++) if (list[i][0].test(text)) return list[i][1];
        return isGuide ? 'Discussion' : 'Other';
    }

    function watchSections() {
        if (!('IntersectionObserver' in window)) return;
        const notes = document.querySelector('.episode-notes-section[itemprop="articleBody"] .notes-content');
        const guide = document.querySelector('.guide-content');
        const root = notes || guide;
        if (!root) return;
        const isGuide = !notes;
        const headings = root.querySelectorAll(isGuide ? 'h3' : 'h3, h4');
        const tracked = [];
        for (let i = 0; i < headings.length; i++) {
            const h = headings[i].cloneNode(true);
            const badge = h.querySelector('.guide-time');
            if (badge) badge.remove();
            const name = sectionName(h.textContent.replace(/\s+/g, ' ').trim(), isGuide);
            if (name) tracked.push({ el: headings[i], name: name, index: tracked.length + 1, timer: null, sent: false });
        }
        if (!tracked.length) return;
        const byEl = new Map(tracked.map(function(t) { return [t.el, t]; }));
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                const t = byEl.get(entry.target);
                if (!t || t.sent) return;
                if (entry.intersectionRatio >= 0.5) {
                    if (!t.timer) {
                        t.timer = setTimeout(function() {
                            t.sent = true;
                            observer.unobserve(t.el);
                            track('notes_section_view', { section_name: t.name, section_index: t.index });
                        }, 1000);
                    }
                } else if (t.timer) {
                    clearTimeout(t.timer);
                    t.timer = null;
                }
            });
        }, { threshold: [0, 0.5, 1] });
        tracked.forEach(function(t) { observer.observe(t.el); });
    }

    function onReady() {
        watchNotesProgress();
        watchSections();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }
})();

/**
 * Previous versions of episode notes (the "Previous versions" accordion).
 * Without JavaScript every older version is listed in the accordion under its
 * own label. This turns them into tabs so one version shows at a time, and
 * opens the accordion on the right tab when a link targets something inside
 * an older version (e.g. #discussion).
 */

(function() {
    'use strict';

    const section = document.querySelector('.previous-versions');
    if (!section) return;

    const details = section.querySelector('details');
    const tabBar = section.querySelector('.pv-tabs');
    const tabs = tabBar ? Array.prototype.slice.call(tabBar.querySelectorAll('.pv-tab')) : [];
    const panes = Array.prototype.slice.call(section.querySelectorAll('.pv-pane'));

    // Analytics (assets/js/analytics.js); a no-op if it isn't loaded
    function track(name, params) {
        if (window.BEMAAnalytics) window.BEMAAnalytics.track(name, params);
    }

    function select(paneId) {
        tabs.forEach(function(tab) {
            const selected = tab.getAttribute('data-pane') === paneId;
            tab.classList.toggle('active', selected);
            tab.setAttribute('aria-pressed', String(selected));
        });
        panes.forEach(function(pane) {
            pane.hidden = pane.id !== paneId;
        });
    }

    if (tabs.length > 1) {
        tabBar.hidden = false;
        section.classList.add('pv-tabs-ready');
        select(panes[0].id);
        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                select(tab.getAttribute('data-pane'));
                track('version_tab', { notes_version: /original/i.test(tab.textContent) ? 'original' : 'earlier' });
            });
        });
    }

    // Reveal a linked heading/element that lives inside an older version
    function revealTarget() {
        if (!location.hash) return;
        let target = null;
        try {
            target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        } catch (e) {
            return;
        }
        if (!target || !section.contains(target)) return;
        let pane = target;
        while (pane && !(pane.classList && pane.classList.contains('pv-pane'))) pane = pane.parentNode;
        details.open = true;
        if (pane && tabs.length > 1) select(pane.id);
        target.scrollIntoView();
    }

    let reportedOpen = false;
    details.addEventListener('toggle', function() {
        if (details.open && !reportedOpen) {
            reportedOpen = true;
            track('previous_versions_open');
        }
    });

    revealTarget();
    window.addEventListener('hashchange', revealTarget);
})();

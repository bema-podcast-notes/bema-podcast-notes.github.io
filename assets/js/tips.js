/**
 * Tips for BEMA Podcast Notes: small, non-invasive help.
 *
 *   Tip lines (.tip-line): quiet one-liners in otherwise empty spots (an
 *     empty My Notes box, the search page, quick open with nothing typed).
 *   Hints: a small bubble next to a control, shown once ever, right after
 *     the reader does something it relates to. It fades after a while, or
 *     closes with its ✕; it never takes focus, and at most one appears per
 *     page view.
 *   Settings page ([data-tips-settings]): a Show tips switch and Show hints
 *   again.
 *
 * Stored in this browser: bema-tips -> { off, seen: [hint ids], counts: {} }.
 * html.tips-off (set in <head> by theme-switcher.js) hides tip lines.
 * Reacts to the 'bema:track' events analytics.js dispatches.
 *
 * Hints:
 *   nav-keys        after Previous/Next buttons are used 3 times: ← → / P N
 *   shortcuts-panel after arrow-key navigation is used twice: ? lists all
 *   notes-backup    after the first note is saved: back up from Settings
 *   listened-lists  after the first episode is marked listened: ✓ and +
 *   search-quotes   after a multi-word search without quotes: "exact phrase"
 * Keyboard hints only appear on devices with a mouse or trackpad.
 */
(function() {
    'use strict';

    const KEY = 'bema-tips';
    const SHOW_MS = 12000;
    const root = document.documentElement;
    const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    const hasKeyboard = !window.matchMedia || window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ---- State ---------------------------------------------------------

    function load() {
        try {
            const s = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
            return { off: s.off === true, seen: Array.isArray(s.seen) ? s.seen : [], counts: s.counts && typeof s.counts === 'object' ? s.counts : {} };
        } catch (e) {
            return { off: false, seen: [], counts: {} };
        }
    }

    function save(state) {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
        } catch (e) {
            // Tips just won't remember; harmless
        }
    }

    function enabled() {
        return !load().off;
    }

    function setEnabled(on) {
        const state = load();
        state.off = !on;
        save(state);
        root.classList.toggle('tips-off', !on);
        if (!on) hideHint();
    }

    function resetSeen() {
        const state = load();
        state.seen = [];
        state.counts = {};
        save(state);
    }

    function bump(name) {
        const state = load();
        state.counts[name] = (state.counts[name] || 0) + 1;
        save(state);
        return state.counts[name];
    }

    function count(name) {
        return load().counts[name] || 0;
    }

    function seen(id) {
        return load().seen.indexOf(id) !== -1;
    }

    // ---- Hint bubble ---------------------------------------------------

    let bubble = null, anchor = null, hideTimer = null, shownThisPage = false, raf = 0;

    function place() {
        raf = 0;
        if (!bubble || !anchor) return;
        const r = anchor.getBoundingClientRect();
        const vh = window.innerHeight, vw = document.documentElement.clientWidth;
        // Anchor scrolled out of view: tuck the bubble away until it's back
        const visible = r.bottom > 0 && r.top < vh && (r.width || r.height);
        bubble.style.visibility = visible ? '' : 'hidden';
        if (!visible) return;
        const bw = bubble.offsetWidth, bh = bubble.offsetHeight, gap = 10;
        const below = r.bottom + gap + bh <= vh || r.top - gap - bh < 0;
        const top = below ? r.bottom + gap : r.top - gap - bh;
        let left = r.left + r.width / 2 - bw / 2;
        left = Math.max(12, Math.min(left, vw - bw - 12));
        bubble.style.top = Math.round(top) + 'px';
        bubble.style.left = Math.round(left) + 'px';
        bubble.classList.toggle('tip-hint-above', !below);
        // Point the arrow at the anchor's middle
        bubble.style.setProperty('--tip-arrow-x', Math.round(Math.max(16, Math.min(bw - 16, r.left + r.width / 2 - left))) + 'px');
    }

    function schedulePlace() {
        if (!raf) raf = window.requestAnimationFrame(place);
    }

    function hideHint() {
        clearTimeout(hideTimer);
        if (!bubble) return;
        const b = bubble;
        bubble = null;
        anchor = null;
        b.classList.remove('is-visible');
        setTimeout(function() { b.remove(); }, 250);
        window.removeEventListener('scroll', schedulePlace, true);
        window.removeEventListener('resize', schedulePlace);
    }

    function startHideTimer() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hideHint, SHOW_MS);
    }

    // html: trusted markup written in this file only (may contain a link or kbd)
    function hint(id, target, html) {
        if (!target || shownThisPage || seen(id) || !enabled()) return false;
        if (document.querySelector('dialog[open]')) return false;
        shownThisPage = true;
        const state = load();
        state.seen.push(id);
        save(state);

        bubble = document.createElement('div');
        bubble.className = 'tip-hint';
        bubble.setAttribute('role', 'status');
        bubble.innerHTML = '<span class="tip-hint-label">Tip</span><span class="tip-hint-text">' + html +
            '</span><button type="button" class="tip-hint-close" aria-label="Dismiss tip">×</button>';
        bubble.querySelector('.tip-hint-close').addEventListener('click', hideHint);
        bubble.addEventListener('mouseenter', function() { clearTimeout(hideTimer); });
        bubble.addEventListener('mouseleave', startHideTimer);
        bubble.addEventListener('focusin', function() { clearTimeout(hideTimer); });
        bubble.addEventListener('focusout', startHideTimer);
        document.body.appendChild(bubble);
        anchor = target;
        place();
        window.addEventListener('scroll', schedulePlace, true);
        window.addEventListener('resize', schedulePlace);
        // Next frame, so the fade-in transition runs
        window.requestAnimationFrame(function() { if (bubble) bubble.classList.add('is-visible'); });
        startHideTimer();
        return true;
    }

    document.addEventListener('keydown', function(e) {
        if ((e.key === 'Escape' || e.key === 'Esc') && bubble) hideHint();
    });

    // ---- Triggers ------------------------------------------------------

    const kbd = function(k) { return '<kbd>' + k + '</kbd>'; };

    function navLink() {
        // The top (sticky) nav's Next, or Previous on the last page
        return document.querySelector('.episode-nav a[rel="next"], .session-nav a[rel="next"]') ||
            document.querySelector('.episode-nav a[rel="prev"], .session-nav a[rel="prev"]');
    }

    // On page load: hints earned on earlier pages
    function onLoad() {
        if (!enabled() || !hasKeyboard) return;
        const link = navLink();
        if (!link) return;
        const what = document.querySelector('.session-nav') ? 'session' : 'episode';
        if (count('navButton') >= 3 && !seen('nav-keys')) {
            setTimeout(function() {
                hint('nav-keys', link, 'Press ' + kbd('→') + ' or ' + kbd('N') + ' for the next ' + what + ', and ' +
                    kbd('←') + ' or ' + kbd('P') + ' for the previous one.');
            }, 800);
        } else if (count('navHotkey') >= 2 && !seen('shortcuts-panel')) {
            setTimeout(function() {
                hint('shortcuts-panel', link, 'Press ' + kbd('?') + ' to see every keyboard shortcut.');
            }, 800);
        }
    }

    let searchHintTimer = null;
    document.addEventListener('bema:track', function(e) {
        const name = e.detail && e.detail.name, p = (e.detail && e.detail.params) || {};
        if (name === 'episode_nav') {
            if (p.nav_method === 'button') bump('navButton');
            if (p.nav_method === 'hotkey') bump('navHotkey');
        } else if (name === 'my_notes_saved') {
            setTimeout(function() {
                hint('notes-backup', document.querySelector('.my-notes-text'),
                    'Your notes stay in this browser. Back them up, or move them to another browser, from <a href="/settings/">Settings</a>.');
            }, 600);
        } else if (name === 'listened' && p.listen_action === 'mark') {
            hint('listened-lists', document.querySelector('.listened'),
                'Listened episodes get a ✓ in the episode lists. Press + when you listen again.');
        } else if (name === 'search') {
            const term = String(p.search_term || '');
            clearTimeout(searchHintTimer);
            if (term.indexOf('"') === -1 && term.trim().split(/\s+/).length >= 2 && p.search_results > 0) {
                // Wait for typing to settle
                searchHintTimer = setTimeout(function() {
                    hint('search-quotes', document.getElementById('search-input'),
                        'Put words in "quotes" to find that exact phrase, like "son of man".');
                }, 1500);
            }
        }
    });

    // ---- Tip lines: platform shortcut text ------------------------------

    const keyHints = document.querySelectorAll('[data-tip-key]');
    for (let i = 0; i < keyHints.length; i++) keyHints[i].textContent = IS_MAC ? '⌘K' : 'Ctrl+K';

    // ---- Settings page ---------------------------------------------------

    const panel = document.querySelector('[data-tips-settings]');
    if (panel) {
        const toggle = panel.querySelector('[data-tips-toggle]');
        const reset = panel.querySelector('[data-tips-reset]');
        const status = panel.querySelector('[data-tips-status]');
        const sync = function() { toggle.checked = enabled(); reset.disabled = !enabled(); };
        toggle.addEventListener('change', function() {
            setEnabled(toggle.checked);
            sync();
            status.textContent = toggle.checked ? 'Tips are on.' : 'Tips are off. No hints or tip lines will appear.';
        });
        reset.addEventListener('click', function() {
            resetSeen();
            status.textContent = 'Hints will appear again, once each, when they’re useful.';
        });
        sync();
    }

    onLoad();

    window.BEMATips = { hint: hint, enabled: enabled, setEnabled: setEnabled, resetSeen: resetSeen };
})();

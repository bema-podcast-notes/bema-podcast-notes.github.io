/**
 * Theme Switcher for BEMA Podcast Notes
 * The site's palette is Helvetia (Sanzo Wada combination 218), defined in
 * common.css, with a light and a dark mode:
 * - Mode follows the OS setting until the reader picks one with the header
 *   toggle; the choice is then remembered in localStorage.
 * - The mode is applied as <html data-mode="light|dark"> while <head> is
 *   still loading, so the page never flashes the wrong colors.
 *
 * Alternate palettes (purple, adobe, space, menswear) are kept but hidden.
 * They can be previewed for the current page from the console:
 *   BEMAThemes.switchTheme('space')   BEMAThemes.switchTheme('default')
 */

(function() {
    'use strict';

    const MODE_KEY = 'bema-color-mode';
    const LEGACY_THEME_KEY = 'bema-theme-preference';
    const HIDDEN_THEMES = ['purple', 'adobe', 'space', 'menswear'];
    const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    // localStorage can throw (private mode, blocked site data)
    function getSavedMode() {
        try {
            const mode = localStorage.getItem(MODE_KEY);
            return mode === 'light' || mode === 'dark' ? mode : null;
        } catch (e) {
            return null;
        }
    }

    function saveMode(mode) {
        try {
            localStorage.setItem(MODE_KEY, mode);
        } catch (e) {
            // Not persisted; the toggle still works for this page
        }
    }

    function systemMode() {
        return darkQuery && darkQuery.matches ? 'dark' : 'light';
    }

    function currentMode() {
        return document.documentElement.dataset.mode || 'light';
    }

    function applyMode(mode) {
        document.documentElement.dataset.mode = mode;
        updateToggles(mode);
    }

    // The toggle offers the *other* mode
    function updateToggles(mode) {
        document.querySelectorAll('.mode-toggle').forEach(btn => {
            const isDark = mode === 'dark';
            btn.textContent = isDark ? '☀️ Light' : '🌙 Dark';
            btn.setAttribute('aria-pressed', String(isDark));
            btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
        });
    }

    // Hidden alternate palettes: preview only, never saved
    function switchTheme(theme) {
        let link = document.getElementById('theme-stylesheet');
        if (!theme || theme === 'default') {
            if (link) link.remove();
            return;
        }
        if (!HIDDEN_THEMES.includes(theme)) {
            console.warn('Unknown theme "' + theme + '". Available: default, ' + HIDDEN_THEMES.join(', '));
            return;
        }
        if (!link) {
            link = document.createElement('link');
            link.id = 'theme-stylesheet';
            link.rel = 'stylesheet';
            // After the page stylesheets so its :root overrides win
            document.head.appendChild(link);
        }
        link.href = '/assets/css/theme-' + theme + '.css';
    }

    function setupToggle() {
        updateToggles(currentMode());
        document.querySelectorAll('.mode-toggle').forEach(btn => {
            btn.addEventListener('click', function() {
                const next = currentMode() === 'dark' ? 'light' : 'dark';
                saveMode(next);
                applyMode(next);
            });
        });
    }

    function init() {
        // Drop the old palette choice from when the alternate themes were selectable
        try {
            localStorage.removeItem(LEGACY_THEME_KEY);
        } catch (e) {
            // Ignore
        }

        applyMode(getSavedMode() || systemMode());

        // Follow OS changes until the reader has picked a mode themselves
        if (darkQuery) {
            darkQuery.addEventListener('change', function() {
                if (!getSavedMode()) applyMode(systemMode());
            });
        }

        // Keep other open tabs in step with the toggle
        window.addEventListener('storage', function(e) {
            if (e.key === MODE_KEY || e.key === null) applyMode(getSavedMode() || systemMode());
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupToggle);
        } else {
            setupToggle();
        }
    }

    init();

    // Expose API for debugging
    window.BEMAThemes = {
        switchTheme: switchTheme,
        setMode: function(mode) {
            saveMode(mode);
            applyMode(mode);
        },
        getMode: currentMode,
        themes: ['default'].concat(HIDDEN_THEMES)
    };
})();

/**
 * Theme Switcher for BEMA Podcast Notes
 * The site's palette is Helvetia (Sanzo Wada combination 218), defined in
 * common.css, with a light and a dark mode:
 * - The header switch offers System / Light / Dark. System (the default)
 *   follows the OS setting, including live changes; Light or Dark is
 *   remembered in localStorage.
 * - The resulting mode is applied as <html data-mode="light|dark"> while
 *   <head> is still loading, so the page never flashes the wrong colors.
 *
 * Also flags browsers without flex `gap` (Safari < 14.1) with
 * <html class="no-flex-gap"> so CSS can fall back to margins before first paint.
 *
 * Alternate palettes (purple, adobe, space, menswear) are kept but hidden.
 * They can be previewed for the current page from the console:
 *   BEMAThemes.switchTheme('space')   BEMAThemes.switchTheme('default')
 */

(function() {
    'use strict';

    const MODE_KEY = 'bema-color-mode';
    const LEGACY_THEME_KEY = 'bema-theme-preference';
    const CHOICES = ['system', 'light', 'dark'];
    const HIDDEN_THEMES = ['purple', 'adobe', 'space', 'menswear'];
    const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    // The reader's pick: 'light', 'dark', or 'system' when nothing is saved.
    // localStorage can throw (private mode, blocked site data).
    function getChoice() {
        try {
            const saved = localStorage.getItem(MODE_KEY);
            return saved === 'light' || saved === 'dark' ? saved : 'system';
        } catch (e) {
            return 'system';
        }
    }

    function saveChoice(choice) {
        try {
            if (choice === 'system') {
                localStorage.removeItem(MODE_KEY);
            } else {
                localStorage.setItem(MODE_KEY, choice);
            }
        } catch (e) {
            // Not persisted; the switch still works for this page
        }
    }

    function systemMode() {
        return darkQuery && darkQuery.matches ? 'dark' : 'light';
    }

    // Older Safari (iOS 12-13) supports the query but only the legacy addListener.
    // Live updates are a nice-to-have, so never let them break the rest of setup.
    function watchSystemMode(onChange) {
        if (!darkQuery) return;
        try {
            if (typeof darkQuery.addEventListener === 'function') {
                darkQuery.addEventListener('change', onChange);
            } else if (typeof darkQuery.addListener === 'function') {
                darkQuery.addListener(onChange);
            }
        } catch (e) {
            // No live updates; the mode is still applied on each page load
        }
    }

    function resolveMode(choice) {
        return choice === 'system' ? systemMode() : choice;
    }

    function currentMode() {
        return document.documentElement.dataset.mode || 'light';
    }

    function apply(choice) {
        document.documentElement.dataset.mode = resolveMode(choice);
        updateSwitch(choice);
    }

    function updateSwitch(choice) {
        document.querySelectorAll('[data-mode-choice]').forEach(btn => {
            const selected = btn.dataset.modeChoice === choice;
            btn.classList.toggle('active', selected);
            btn.setAttribute('aria-pressed', String(selected));
            if (btn.dataset.modeChoice === 'system') {
                btn.title = 'Match your device setting (currently ' + systemMode() + ')';
            }
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

    function setMode(choice) {
        if (!CHOICES.includes(choice)) {
            console.warn('Unknown mode "' + choice + '". Available: ' + CHOICES.join(', '));
            return;
        }
        saveChoice(choice);
        apply(choice);
    }

    function setupSwitch() {
        updateSwitch(getChoice());
        document.querySelectorAll('[data-mode-choice]').forEach(btn => {
            btn.addEventListener('click', function() {
                const choice = this.dataset.modeChoice;
                setMode(choice);
                if (window.BEMAAnalytics) {
                    window.BEMAAnalytics.track('color_mode', { mode_choice: choice, mode_applied: currentMode() });
                    window.BEMAAnalytics.setUserProperties({ color_mode: choice });
                }
            });
        });
    }

    // Flex gap can't be detected with @supports (grid gap makes it report true),
    // so measure it: two empty items in a column with a 1px row gap
    function detectFlexGap() {
        try {
            const box = document.createElement('div');
            box.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';
            box.appendChild(document.createElement('div'));
            box.appendChild(document.createElement('div'));
            document.documentElement.appendChild(box);
            const supported = box.scrollHeight === 1;
            box.parentNode.removeChild(box);
            if (!supported) document.documentElement.classList.add('no-flex-gap');
        } catch (e) {
            // Leave the modern layout in place
        }
    }

    function init() {
        detectFlexGap();

        // Drop the old palette choice from when the alternate themes were selectable
        try {
            localStorage.removeItem(LEGACY_THEME_KEY);
        } catch (e) {
            // Ignore
        }

        apply(getChoice());

        // Under System, follow OS changes live
        watchSystemMode(function() {
            const choice = getChoice();
            if (choice === 'system') {
                apply(choice);
            } else {
                updateSwitch(choice); // refresh the "(currently …)" hint
            }
        });

        // Keep other open tabs in step with the switch
        window.addEventListener('storage', function(e) {
            if (e.key === MODE_KEY || e.key === null) apply(getChoice());
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupSwitch);
        } else {
            setupSwitch();
        }
    }

    init();

    // Expose API for debugging
    window.BEMAThemes = {
        switchTheme: switchTheme,
        setMode: setMode,
        getMode: currentMode,
        getChoice: getChoice,
        themes: ['default'].concat(HIDDEN_THEMES)
    };
})();

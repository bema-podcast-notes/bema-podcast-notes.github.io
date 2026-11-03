/**
 * Theme Switcher for BEMA Podcast Notes
 * Handles switching between five color themes:
 * - default (Purple gradient)
 * - adobe (Southwest Adobe)
 * - space (Deep Space Noir)
 * - menswear (Classic Menswear)
 * - helvetia (Sanzo Wada combination 218)
 */

(function() {
    'use strict';

    const THEMES = {
        DEFAULT: 'default',
        ADOBE: 'adobe',
        SPACE: 'space',
        MENSWEAR: 'menswear',
        HELVETIA: 'helvetia'
    };

    const THEME_LABELS = {
        [THEMES.DEFAULT]: 'Purple',
        [THEMES.ADOBE]: 'Adobe',
        [THEMES.SPACE]: 'Space',
        [THEMES.MENSWEAR]: 'Menswear',
        [THEMES.HELVETIA]: 'Helvetia'
    };

    const STORAGE_KEY = 'bema-theme-preference';

    // Get theme link element or create if it doesn't exist
    function getThemeLinkElement() {
        let link = document.getElementById('theme-stylesheet');

        if (!link) {
            link = document.createElement('link');
            link.id = 'theme-stylesheet';
            link.rel = 'stylesheet';

            // Insert after common.css
            const commonCss = document.querySelector('link[href*="common.css"]');
            if (commonCss && commonCss.nextSibling) {
                commonCss.parentNode.insertBefore(link, commonCss.nextSibling);
            } else {
                document.head.appendChild(link);
            }
        }

        return link;
    }

    // Apply theme by adding/removing stylesheet
    function applyTheme(theme) {
        const link = getThemeLinkElement();

        if (theme === THEMES.DEFAULT) {
            // Remove theme stylesheet for default theme
            link.href = '';
            link.disabled = true;
        } else {
            // Load theme-specific stylesheet
            const baseUrl = link.href ? new URL(link.href).origin : window.location.origin;
            const cssPath = `/assets/css/theme-${theme}.css`;
            link.href = cssPath;
            link.disabled = false;
        }

        // Store preference
        localStorage.setItem(STORAGE_KEY, theme);

        // Update UI
        updateThemeSwitcherUI(theme);
    }

    // Update the theme switcher UI to reflect current theme
    function updateThemeSwitcherUI(currentTheme) {
        const buttons = document.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            const btnTheme = btn.dataset.theme;
            if (btnTheme === currentTheme) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    }

    // Get saved theme preference or default
    function getSavedTheme() {
        return localStorage.getItem(STORAGE_KEY) || THEMES.DEFAULT;
    }

    // Initialize theme switcher
    function init() {
        // Apply saved theme immediately (before page renders)
        const savedTheme = getSavedTheme();
        applyTheme(savedTheme);

        // Set up event listeners when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupEventListeners);
        } else {
            setupEventListeners();
        }
    }

    // Set up click handlers for theme buttons
    function setupEventListeners() {
        const buttons = document.querySelectorAll('.theme-btn');

        // Buttons didn't exist yet when the theme was applied in <head>
        updateThemeSwitcherUI(getSavedTheme());

        buttons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const theme = this.dataset.theme;
                if (theme && THEMES[theme.toUpperCase()]) {
                    applyTheme(theme);
                }
            });
        });
    }

    // Initialize immediately
    init();

    // Expose API for debugging
    window.BEMAThemes = {
        switchTheme: applyTheme,
        getCurrentTheme: getSavedTheme,
        themes: THEMES
    };
})();

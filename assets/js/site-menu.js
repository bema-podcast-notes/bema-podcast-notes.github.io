/**
 * Phone/tablet menu for the site header (_includes/site-header.html).
 * At ≤768px the nav links and color mode switch collapse behind a menu
 * button; this shows the button and toggles the menu open and closed.
 * Above 768px the button is hidden by CSS and the menu is always shown.
 *
 * Disclosure pattern: the button's aria-expanded says whether the menu is
 * open; focus stays on the button. Esc, a click outside the header, or
 * following one of the links closes it.
 *
 * Loaded right after the header markup so the button works as soon as it's
 * visible. Avoids Element.closest for older browsers.
 */
(function() {
    'use strict';

    const button = document.querySelector('.menu-toggle');
    const menu = document.getElementById('site-menu');
    if (!button || !menu) return;
    const header = button.parentNode;

    button.hidden = false;

    function isOpen() {
        return button.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open) {
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        header.classList.toggle('menu-open', open);
    }

    button.addEventListener('click', function() {
        setOpen(!isOpen());
    });

    document.addEventListener('keydown', function(e) {
        if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()) {
            setOpen(false);
            button.focus();
        }
    });

    // Click outside the header closes it
    document.addEventListener('click', function(e) {
        if (isOpen() && !header.contains(e.target)) setOpen(false);
    });

    // Following a link closes it (matters for in-page links like #episodes,
    // and for Search, which opens quick open instead of leaving the page)
    menu.addEventListener('click', function(e) {
        for (let node = e.target; node && node !== menu; node = node.parentNode) {
            if (node.tagName === 'A') {
                setOpen(false);
                return;
            }
        }
    });

    // Back to desktop width: reset so the menu isn't stuck open later
    if (window.matchMedia) {
        const desktop = window.matchMedia('(min-width: 769px)');
        const onChange = function() { if (desktop.matches) setOpen(false); };
        if (desktop.addEventListener) desktop.addEventListener('change', onChange);
        else if (desktop.addListener) desktop.addListener(onChange);
    }
})();

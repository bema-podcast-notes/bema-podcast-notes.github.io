/**
 * Compact header + menu for the site header (_includes/site-header.html).
 *
 * The header switches to its compact form (title + menu button; the nav
 * links and color mode switch move into a menu) the moment the one-line
 * header would no longer fit, i.e. before any link or label wraps. That
 * point depends on fonts, zoom and the platform's shortcut hint (⌘K vs
 * Ctrl K), so it's measured rather than set as a breakpoint. It allows for
 * the widest color mode label, so switching modes never flips it. At ≤768px it's always compact; theme-switcher.js
 * applies that in <head> so phones never flash the full header.
 *
 * Measuring: with html.header-measure on (nothing may wrap or shrink, see
 * common.css), the header overflows exactly when it doesn't fit; the
 * rightmost edge is compared in fractional pixels. The class
 * is added and removed in the same task, so it's never painted.
 *
 * Menu: disclosure pattern; the button's aria-expanded says whether it's
 * open and focus stays on the button. Esc, a click outside the header, or
 * following one of the links closes it.
 *
 * Avoids Element.closest for older browsers.
 */
(function() {
    'use strict';

    const root = document.documentElement;
    const button = document.querySelector('.menu-toggle');
    const menu = document.getElementById('site-menu');
    if (!button || !menu) return;
    const content = button.parentNode;
    const small = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null;

    button.hidden = false;

    // ---- Compact or full? ----------------------------------------------

    // Rightmost edge of the header's items, in fractional pixels (scrollWidth
    // rounds them away and was off by one). header-menu is display:contents
    // (no box of its own), so its children are checked too.
    function rightEdge() {
        let right = -Infinity;
        const groups = [content.children, menu.children];
        for (let g = 0; g < groups.length; g++) {
            for (let i = 0; i < groups[g].length; i++) {
                const child = groups[g][i];
                const r = child.getBoundingClientRect();
                if (r.width) right = Math.max(right, r.right + (parseFloat(getComputedStyle(child).marginRight) || 0));
            }
        }
        return right;
    }

    // Does the one-line header fit with every color mode selected? Only the
    // selected option shows its label, so the header's width depends on the
    // mode; testing all of them makes the switch-over width the same
    // whichever is picked, so changing modes never flips the header (e.g.
    // Dark → System hiding the open menu). aria-pressed drives the label
    // CSS; it's set for each mode in turn and restored before anything is
    // painted.
    function fitsOnOneLine() {
        const wasCompact = root.classList.contains('header-compact');
        const modeButtons = menu.querySelectorAll('[data-mode-choice]');
        const saved = [];
        for (let i = 0; i < modeButtons.length; i++) saved.push(modeButtons[i].getAttribute('aria-pressed'));

        root.classList.remove('header-compact');
        root.classList.add('header-measure');
        const limit = content.getBoundingClientRect().right + 0.01;
        let fits = true;
        for (let m = 0; m < Math.max(modeButtons.length, 1) && fits; m++) {
            for (let i = 0; i < modeButtons.length; i++) modeButtons[i].setAttribute('aria-pressed', i === m ? 'true' : 'false');
            fits = rightEdge() <= limit;
        }
        for (let i = 0; i < modeButtons.length; i++) modeButtons[i].setAttribute('aria-pressed', saved[i]);
        root.classList.remove('header-measure');
        if (wasCompact) root.classList.add('header-compact');
        return fits;
    }

    function update() {
        const compact = (small && small.matches) || !fitsOnOneLine();
        root.classList.toggle('header-compact', compact);
        if (!compact) setOpen(false);
    }

    let pending = false;
    function scheduleUpdate() {
        if (pending) return;
        pending = true;
        window.requestAnimationFrame(function() {
            pending = false;
            update();
        });
    }

    // ---- Menu ----------------------------------------------------------

    function isOpen() {
        return button.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open) {
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        content.classList.toggle('menu-open', open);
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
        if (isOpen() && !content.contains(e.target)) setOpen(false);
    });

    // Following a link closes it (matters for in-page links like #episodes,
    // and for Search, which opens quick open instead of leaving the page).
    // Picking a color mode leaves it open, and can't change compact/full
    // (fitsOnOneLine allows for every mode's label).
    menu.addEventListener('click', function(e) {
        for (let node = e.target; node && node !== menu; node = node.parentNode) {
            if (node.tagName === 'A') {
                setOpen(false);
                return;
            }
        }
    });

    // ---- When to re-measure --------------------------------------------

    update();
    window.addEventListener('resize', scheduleUpdate);
    // Web fonts and later scripts (quick-open.js swaps ⌘K for Ctrl K) can
    // change the header's width after this first measurement
    window.addEventListener('load', scheduleUpdate);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleUpdate);
    document.addEventListener('DOMContentLoaded', scheduleUpdate);
})();

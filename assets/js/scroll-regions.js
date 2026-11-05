/**
 * Keyboard and screen reader access for wide tables in the notes.
 * On narrow screens a wide table scrolls sideways. Each table is wrapped in a
 * scrolling container (the table itself stays a plain table, so screen readers
 * keep its rows and columns; styling a table display:block can drop that).
 * When the container actually overflows it becomes a focusable, named region
 * so keyboard users can scroll it. Re-checked on resize.
 */

(function() {
    'use strict';

    const tables = document.querySelectorAll('.content-area table');
    if (!tables.length) return;

    // Name a table after the heading above it, e.g. "Key Hebrew Terms (table, scrolls sideways)"
    function labelFor(table, index) {
        for (let el = table.previousElementSibling; el; el = el.previousElementSibling) {
            if (/^H[1-6]$/.test(el.tagName)) {
                return el.textContent.trim() + ' (table, scrolls sideways)';
            }
        }
        return 'Table ' + (index + 1) + ' (scrolls sideways)';
    }

    const wrappers = [];
    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const wrapper = document.createElement('div');
        wrapper.className = 'table-scroll';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
        table.classList.add('is-wrapped');
        wrappers.push({ el: wrapper, label: labelFor(wrapper, i) });
    }

    function update() {
        wrappers.forEach(function(w) {
            if (w.el.scrollWidth > w.el.clientWidth + 1) {
                w.el.setAttribute('tabindex', '0');
                w.el.setAttribute('role', 'region');
                w.el.setAttribute('aria-label', w.label);
            } else {
                w.el.removeAttribute('tabindex');
                w.el.removeAttribute('role');
                w.el.removeAttribute('aria-label');
            }
        });
    }

    let timer = null;
    window.addEventListener('resize', function() {
        clearTimeout(timer);
        timer = setTimeout(update, 200);
    });
    update();
})();

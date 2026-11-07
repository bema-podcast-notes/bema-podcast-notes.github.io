/**
 * Keyboard shortcuts panel for BEMA Podcast Notes.
 *
 * Opens with ? (when not typing), the footer's "Keyboard shortcuts" link,
 * or the Keyboard Shortcuts entry in quick open (BEMAShortcuts.open()).
 * Esc, the close button or a click on the backdrop closes it.
 *
 * The list is the single source of truth for what's documented; keep it in
 * step with episode-hotkeys.js, quick-open.js and site-menu.js. Sections
 * that apply to the current page come first, marked "On this page".
 * ⌘ is shown on Apple devices, Ctrl elsewhere.
 *
 * The footer link is hidden on touch-only devices (no keyboard to use the
 * shortcuts with) and without JS. Browsers without <dialog> skip the panel.
 *
 * Analytics: shortcuts_open with shortcuts_method (key|footer|quick_open).
 */
(function() {
    'use strict';

    const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    const MOD = IS_MAC ? '⌘' : 'Ctrl';
    const HAS_DIALOG = typeof HTMLDialogElement === 'function';

    // keys: array of alternatives; each alternative is an array of keys pressed together
    const SECTIONS = [
        {
            id: 'anywhere',
            title: 'Anywhere',
            applies: function() { return true; },
            rows: [
                { keys: [[MOD, 'K']], text: 'Quick open: jump to an episode number, page or title, or search the notes' },
                { keys: [['?']], text: 'Show this list of shortcuts' },
                { keys: [['Esc']], text: 'Close a panel or the menu' }
            ]
        },
        {
            id: 'episode',
            title: 'Episode pages',
            applies: function() { return !!document.querySelector('.episode-nav'); },
            rows: [
                { keys: [['←'], ['P']], text: 'Previous episode' },
                { keys: [['→'], ['N']], text: 'Next episode' }
            ]
        },
        {
            id: 'session',
            title: 'Session overview pages',
            applies: function() { return !!document.querySelector('.session-nav'); },
            rows: [
                { keys: [['←'], ['P']], text: 'Previous session' },
                { keys: [['→'], ['N']], text: 'Next session' }
            ]
        },
        {
            id: 'quick-open',
            title: 'In quick open',
            applies: function() { return false; },
            rows: [
                { keys: [['↑'], ['↓']], text: 'Move through the results' },
                { keys: [['Enter']], text: 'Open the highlighted result' },
                { keys: [[MOD, 'Enter']], text: 'Open it in a new tab' },
                { keys: [['Esc']], text: 'Close quick open' }
            ]
        }
    ];

    const KEY_NAMES = { '←': 'Left arrow', '→': 'Right arrow', '↑': 'Up arrow', '↓': 'Down arrow', '⌘': 'Command', '?': 'Question mark' };

    let dialog = null;
    let returnFocus = null;

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function keysCell(alternatives) {
        const dt = el('dt', 'shortcuts-keys');
        alternatives.forEach(function(combo, a) {
            if (a > 0) dt.appendChild(el('span', 'shortcuts-or', 'or'));
            combo.forEach(function(key, k) {
                if (k > 0) dt.appendChild(el('span', 'shortcuts-plus', '+'));
                const kbd = el('kbd', null, key);
                if (KEY_NAMES[key]) kbd.setAttribute('aria-label', KEY_NAMES[key]);
                dt.appendChild(kbd);
            });
        });
        return dt;
    }

    function build() {
        dialog = el('dialog', 'shortcuts');
        dialog.setAttribute('aria-labelledby', 'shortcuts-title');

        const head = el('div', 'shortcuts-head');
        const h2 = el('h2', null, 'Keyboard shortcuts');
        h2.id = 'shortcuts-title';
        const close = el('button', 'shortcuts-close');
        close.type = 'button';
        close.innerHTML = '<svg class="icon" aria-hidden="true" focusable="false"><use href="/assets/icons.svg#x" xlink:href="/assets/icons.svg#x"></use></svg><span class="visually-hidden">Close</span>';
        close.addEventListener('click', function() { dialog.close(); });
        head.appendChild(h2);
        head.appendChild(close);

        const body = el('div', 'shortcuts-body');
        // Focusable so keyboard users can scroll it when it overflows
        body.tabIndex = 0;
        body.setAttribute('role', 'group');
        body.setAttribute('aria-label', 'Shortcuts');
        // This page's sections first
        const ordered = SECTIONS.filter(function(s) { return s.id === 'anywhere'; })
            .concat(SECTIONS.filter(function(s) { return s.id !== 'anywhere' && s.applies(); }))
            .concat(SECTIONS.filter(function(s) { return s.id !== 'anywhere' && !s.applies(); }));
        ordered.forEach(function(section) {
            const box = el('section', 'shortcuts-section');
            const h3 = el('h3', null, section.title);
            if (section.id !== 'anywhere' && section.applies()) h3.appendChild(el('span', 'shortcuts-here', 'On this page'));
            box.appendChild(h3);
            const dl = el('dl');
            section.rows.forEach(function(row) {
                const item = el('div', 'shortcuts-row');
                item.appendChild(keysCell(row.keys));
                item.appendChild(el('dd', null, row.text));
                dl.appendChild(item);
            });
            box.appendChild(dl);
            body.appendChild(box);
        });
        body.appendChild(el('p', 'shortcuts-note', 'Single-key shortcuts are ignored while you’re typing in a box.'));

        dialog.appendChild(head);
        dialog.appendChild(body);
        document.body.appendChild(dialog);

        dialog.addEventListener('click', function(e) { if (e.target === dialog) dialog.close(); });
        dialog.addEventListener('close', function() {
            if (returnFocus && returnFocus.focus) returnFocus.focus();
            returnFocus = null;
        });
    }

    function open(method) {
        if (!HAS_DIALOG) return;
        if (!dialog) build();
        if (dialog.open) return;
        returnFocus = document.activeElement;
        dialog.showModal();
        // Focus the dialog itself (not the close button) so screen readers
        // start at the title and Enter/Space can't close it by accident
        dialog.setAttribute('tabindex', '-1');
        dialog.focus();
        if (window.BEMAAnalytics) window.BEMAAnalytics.track('shortcuts_open', { shortcuts_method: method || 'key' });
    }

    function close() {
        if (dialog && dialog.open) dialog.close();
    }

    // Same rule as episode-hotkeys.js: is this key press meant for a field?
    function isTyping(node) {
        if (!node || node === document.body) return false;
        if (node.isContentEditable) return true;
        const tag = node.tagName;
        if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (tag === 'INPUT') {
            return ['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image']
                .indexOf((node.type || 'text').toLowerCase()) === -1;
        }
        for (let n = node; n && n.nodeType === 1; n = n.parentNode) {
            if (['textbox', 'combobox', 'slider', 'listbox'].indexOf(n.getAttribute('role')) !== -1) return true;
        }
        return false;
    }

    document.addEventListener('keydown', function(e) {
        if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey || e.repeat || e.isComposing) return;
        if (isTyping(e.target) || isTyping(document.activeElement)) return;
        // Not over another dialog (quick open has its own keys)
        const openDialog = document.querySelector('dialog[open]');
        if (openDialog && openDialog !== dialog) return;
        e.preventDefault();
        if (dialog && dialog.open) close();
        else open('key');
    });

    // Footer link: shown only with JS, <dialog> and a fine pointer (a mouse or
    // trackpad, so likely a keyboard too); touch-only devices don't need it
    const wrap = document.querySelector('.footer-shortcuts');
    const hasKeyboardish = !window.matchMedia || window.matchMedia('(hover: hover), (pointer: fine)').matches;
    if (wrap && HAS_DIALOG && hasKeyboardish) wrap.hidden = false;
    document.addEventListener('click', function(e) {
        for (let n = e.target; n && n.nodeType === 1; n = n.parentNode) {
            if (n.hasAttribute('data-shortcuts-open')) {
                e.preventDefault();
                open('footer');
                return;
            }
        }
    });

    window.BEMAShortcuts = { open: open, close: close };
})();

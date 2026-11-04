/**
 * Episode hotkeys for BEMA Podcast Notes
 *   ← or P  previous episode
 *   → or N  next episode
 * Follows the a[rel="prev"] / a[rel="next"] links in the episode nav.
 * Ignored while typing (notes, search, any input) or with modifier keys
 * held, so browser shortcuts like Alt+← still work.
 * Written to also work in older browsers: falls back to keyCode where
 * KeyboardEvent.key is missing and avoids Element.closest/Array.includes.
 */

(function() {
    'use strict';

    const KEYS = {
        ArrowLeft: 'prev',
        Left: 'prev', // IE / old Edge
        p: 'prev',
        P: 'prev',
        ArrowRight: 'next',
        Right: 'next', // IE / old Edge
        n: 'next',
        N: 'next'
    };

    // For browsers without KeyboardEvent.key (Safari < 10.1, Chrome < 51)
    const KEY_CODES = {
        37: 'prev', // ←
        80: 'prev', // P
        39: 'next', // →
        78: 'next'  // N
    };

    const NON_TEXT_INPUTS = ['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image'];
    const KEY_HANDLING_ROLES = ['textbox', 'combobox', 'slider', 'listbox'];

    function directionFor(e) {
        if (e.key && e.key !== 'Unidentified') return KEYS[e.key] || null;
        return KEY_CODES[e.keyCode || e.which] || null;
    }

    // True when the key press belongs to something that accepts keyboard input
    function isTyping(el) {
        if (!el || el === document.body) return false;
        if (el.isContentEditable) return true;
        const tag = el.tagName;
        if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (tag === 'INPUT') {
            // Buttons and checkboxes don't take text; everything else (text, search, number…) does
            return NON_TEXT_INPUTS.indexOf((el.type || 'text').toLowerCase()) === -1;
        }
        // Custom widgets that handle their own keys (e.g. role="textbox", sliders).
        // Walk up by hand rather than Element.closest, which older browsers lack.
        for (let node = el; node && node.nodeType === 1; node = node.parentNode) {
            if (KEY_HANDLING_ROLES.indexOf(node.getAttribute('role')) !== -1) return true;
        }
        return false;
    }

    document.addEventListener('keydown', function(e) {
        const direction = directionFor(e);
        if (!direction) return;
        // keyCode 229 = IME composition in browsers without isComposing
        if (e.defaultPrevented || e.repeat || e.isComposing || e.keyCode === 229) return;
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        if (isTyping(e.target) || isTyping(document.activeElement)) return;

        const link = document.querySelector('a[rel="' + direction + '"]');
        if (!link) return;

        e.preventDefault();
        window.location.href = link.href;
    });
})();

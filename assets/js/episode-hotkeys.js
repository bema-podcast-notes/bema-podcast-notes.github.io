/**
 * Episode hotkeys for BEMA Podcast Notes
 *   ← or P  previous episode
 *   → or N  next episode
 * Follows the a[rel="prev"] / a[rel="next"] links in the episode nav.
 * Ignored while typing (notes, search, any input) or with modifier keys
 * held, so browser shortcuts like Alt+← still work.
 */

(function() {
    'use strict';

    const KEYS = {
        ArrowLeft: 'prev',
        p: 'prev',
        P: 'prev',
        ArrowRight: 'next',
        n: 'next',
        N: 'next'
    };

    // True when the key press belongs to something that accepts keyboard input
    function isTyping(el) {
        if (!el || el === document.body) return false;
        if (el.isContentEditable) return true;
        const tag = el.tagName;
        if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (tag === 'INPUT') {
            // Buttons and checkboxes don't take text; everything else (text, search, number…) does
            const nonText = ['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image'];
            return !nonText.includes((el.type || 'text').toLowerCase());
        }
        // Custom widgets that handle their own keys (e.g. role="textbox", sliders)
        return el.closest('[role="textbox"], [role="combobox"], [role="slider"], [role="listbox"]') !== null;
    }

    document.addEventListener('keydown', function(e) {
        const direction = KEYS[e.key];
        if (!direction) return;
        if (e.defaultPrevented || e.repeat || e.isComposing) return;
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        if (isTyping(e.target) || isTyping(document.activeElement)) return;

        const link = document.querySelector('a[rel="' + direction + '"]');
        if (!link) return;

        e.preventDefault();
        window.location.href = link.href;
    });
})();

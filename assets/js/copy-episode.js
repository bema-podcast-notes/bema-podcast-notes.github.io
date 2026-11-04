/**
 * Hidden copy for episode pages: tapping the clock icon next to the
 * duration copies
 *   S6 325: Sanctuary — Waking Up in the Mishkan
 *   The Testimonies of Light and Darkness [1 hr 17 min]
 * The text is built at site-build time into the button's data-copy.
 * Uses the Clipboard API where available (HTTPS/localhost) and falls back
 * to execCommand('copy') elsewhere, e.g. on plain-HTTP local network testing.
 */

(function() {
    'use strict';

    const XLINK_NS = 'http://www.w3.org/1999/xlink';
    const FEEDBACK_MS = 1500;

    const button = document.querySelector('.copy-episode');
    if (!button) return;

    const use = button.querySelector('use');
    const status = document.querySelector('.copy-episode-status');
    const originalIcon = use.getAttribute('href');
    let resetTimer = null;

    function setIcon(url) {
        use.setAttribute('href', url);
        use.setAttributeNS(XLINK_NS, 'xlink:href', url);
    }

    function fallbackCopy(text) {
        const field = document.createElement('textarea');
        field.value = text;
        field.setAttribute('readonly', ''); // no keyboard on mobile
        field.style.position = 'fixed';
        field.style.top = '0';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        field.setSelectionRange(0, text.length); // iOS ignores select() alone
        let copied = false;
        try {
            copied = document.execCommand('copy');
        } catch (e) {
            copied = false;
        }
        document.body.removeChild(field);
        return copied;
    }

    function copy(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).then(
                function() { return true; },
                function() { return fallbackCopy(text); }
            );
        }
        return Promise.resolve(fallbackCopy(text));
    }

    function showResult(copied) {
        clearTimeout(resetTimer);
        setIcon(originalIcon.replace(/#.*$/, copied ? '#check' : '#alert-triangle'));
        if (status) status.textContent = copied ? 'Episode info copied' : 'Could not copy episode info';
        resetTimer = setTimeout(function() {
            setIcon(originalIcon);
            if (status) status.textContent = '';
        }, FEEDBACK_MS);
    }

    button.addEventListener('click', function() {
        // Titles use a non-breaking space after the em dash; paste a normal one
        const text = (button.getAttribute('data-copy') || '').replace(/ /g, ' ');
        copy(text).then(showResult);
    });
})();

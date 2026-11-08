/**
 * Discussion guide page actions (_layouts/discussion_guide.html).
 *   Print: prints just the guide (see the print rules in guide.css).
 *   Share: the system share sheet where there is one (phones), otherwise
 *   copies the page link. Both buttons stay hidden without JS.
 * Analytics: guide_print, guide_share with share_method (native|copy).
 */
(function() {
    'use strict';

    const printBtn = document.querySelector('[data-guide-print]');
    const shareBtn = document.querySelector('[data-guide-share]');
    const status = document.querySelector('[data-guide-status]');
    const track = function(name, params) {
        if (window.BEMAAnalytics) window.BEMAAnalytics.track(name, params || {});
    };

    if (printBtn && window.print) {
        printBtn.hidden = false;
        printBtn.addEventListener('click', function() {
            track('guide_print');
            window.print();
        });
    }

    if (!shareBtn) return;
    const label = shareBtn.querySelector('[data-guide-share-label]');
    const canShare = !!navigator.share && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const canCopy = !!(navigator.clipboard && navigator.clipboard.writeText);
    if (!canShare && !canCopy) return;
    shareBtn.hidden = false;
    if (!canShare) label.textContent = 'Copy link';

    let resetTimer = null;
    shareBtn.addEventListener('click', function() {
        const url = location.href.split('#')[0];
        if (canShare) {
            navigator.share({ title: document.title, url: url }).then(function() {
                track('guide_share', { share_method: 'native' });
            }).catch(function() {});
            return;
        }
        navigator.clipboard.writeText(url).then(function() {
            label.textContent = 'Link copied';
            status.textContent = 'Link copied to the clipboard';
            track('guide_share', { share_method: 'copy' });
            clearTimeout(resetTimer);
            resetTimer = setTimeout(function() { label.textContent = 'Copy link'; status.textContent = ''; }, 2000);
        });
    });
})();

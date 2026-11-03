/**
 * Sticky episode navigation for BEMA Podcast Notes
 * Adds .is-stuck to the top episode nav once it pins to the top of the
 * viewport, so CSS can switch it to a compact style.
 */

(function() {
    'use strict';

    const sticky = document.querySelector('.episode-nav-sticky');
    if (!sticky) return;

    let ticking = false;

    function update() {
        ticking = false;
        // position: sticky holds it at top: 0 once scrolled past; before that it sits lower
        sticky.classList.toggle('is-stuck', sticky.getBoundingClientRect().top <= 0 && window.scrollY > 0);
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
        }
    }, { passive: true });

    update();
})();

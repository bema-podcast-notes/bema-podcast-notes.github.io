/**
 * "Were these notes helpful?" (_includes/notes-feedback.html), at the end of
 * an episode's notes and of discussion guides.
 *
 * Yes / No sends notes_feedback right away. Then the reader can pick reasons
 * from a fixed list (no free text) and Send, which sends one
 * notes_feedback_reason per reason, or Skip. The answer is kept in this
 * browser as bema-feedback:<path> = { value, reasons, at }, so a return visit
 * shows the thank-you with Change answer instead of asking again.
 *
 * Analytics: notes_feedback        feedback_value (yes|no)
 *            notes_feedback_reason feedback_value, feedback_reason
 */
(function() {
    'use strict';

    const box = document.querySelector('[data-notes-feedback]');
    if (!box) return;

    const KEY = 'bema-feedback:' + location.pathname.replace(/\/+$/, '');
    const REASONS = {
        yes: ['Clear summary', 'Key takeaways', 'Scripture references', 'Questions to discuss', 'Saves me time', 'Helps me remember'],
        no: ['Too long', 'Too short', 'Missing something', 'Hard to follow', 'Has errors', 'Not what I expected'],
    };
    const isGuide = box.getAttribute('data-subject') === 'this guide';
    const ask = box.querySelector('[data-fb-ask]');
    const reasonsBox = box.querySelector('[data-fb-reasons]');
    const prompt = box.querySelector('[data-fb-prompt]');
    const chips = box.querySelector('[data-fb-chips]');
    const done = box.querySelector('[data-fb-done]');
    const thanks = box.querySelector('[data-fb-thanks]');
    const status = box.querySelector('[data-fb-status]');
    const choices = box.querySelectorAll('[data-fb-value]');
    let current = null;

    function load() {
        try {
            const v = JSON.parse(localStorage.getItem(KEY) || 'null');
            return v && (v.value === 'yes' || v.value === 'no') ? v : null;
        } catch (e) {
            return null;
        }
    }

    function save(record) {
        try {
            localStorage.setItem(KEY, JSON.stringify(record));
        } catch (e) {
            // Not remembered; the reader may be asked again next time
        }
    }

    function today() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function track(name, params) {
        if (window.BEMAAnalytics) window.BEMAAnalytics.track(name, params);
    }

    function show(state) {
        ask.hidden = state === 'done';
        reasonsBox.hidden = state !== 'reasons';
        done.hidden = state !== 'done';
    }

    function choose(value) {
        current = value;
        for (let i = 0; i < choices.length; i++) {
            choices[i].setAttribute('aria-pressed', choices[i].getAttribute('data-fb-value') === value ? 'true' : 'false');
        }
        save({ value: value, reasons: [], at: today() });
        track('notes_feedback', { feedback_value: value });
        prompt.textContent = value === 'yes'
            ? 'Thanks! What made ' + (isGuide ? 'it' : 'them') + ' helpful? Pick any that apply.'
            : 'Thanks. What would make ' + (isGuide ? 'it' : 'them') + ' better? Pick any that apply.';
        chips.innerHTML = '';
        REASONS[value].forEach(function(reason) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'notes-feedback-chip';
            b.setAttribute('aria-pressed', 'false');
            b.textContent = reason;
            chips.appendChild(b);
        });
        show('reasons');
        status.textContent = 'Answer saved. You can add reasons, or skip.';
        const first = chips.querySelector('button');
        if (first) first.focus();
    }

    function finish(sendReasons) {
        const picked = [];
        if (sendReasons) {
            const pressed = chips.querySelectorAll('[aria-pressed="true"]');
            for (let i = 0; i < pressed.length; i++) picked.push(pressed[i].textContent);
            picked.forEach(function(reason) {
                track('notes_feedback_reason', { feedback_value: current, feedback_reason: reason });
            });
        }
        save({ value: current, reasons: picked, at: today() });
        thanks.textContent = picked.length ? 'Thanks for the feedback and the details.' : 'Thanks for the feedback.';
        show('done');
        status.textContent = 'Thanks for the feedback.';
        box.querySelector('[data-fb-change]').focus();
    }

    for (let i = 0; i < choices.length; i++) {
        choices[i].addEventListener('click', function() { choose(this.getAttribute('data-fb-value')); });
    }
    chips.addEventListener('click', function(e) {
        const b = e.target.closest('button');
        if (!b) return;
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
    box.querySelector('[data-fb-send]').addEventListener('click', function() { finish(true); });
    box.querySelector('[data-fb-skip]').addEventListener('click', function() { finish(false); });
    box.querySelector('[data-fb-change]').addEventListener('click', function() {
        for (let i = 0; i < choices.length; i++) choices[i].setAttribute('aria-pressed', 'false');
        show('ask');
        status.textContent = '';
        choices[0].focus();
    });

    const saved = load();
    if (saved) {
        current = saved.value;
        show('done');
    } else {
        show('ask');
    }
    box.hidden = false;
})();

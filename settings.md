---
layout: page
title: Settings
description: Your data on this site, and how to take it with you
permalink: /settings/
---

## Your data

Everything you save on this site, such as your own notes on episodes and your color mode, is stored only in this browser. It isn't sent to a server, and it isn't shared between your devices or browsers. Clearing this browser's data for the site erases it.

<div class="site-data" data-site-data>
  <h3>Export</h3>
  <p>Download everything this site has saved in this browser as one JSON file, as a backup or to keep a copy of your notes.</p>
  <dl class="site-data-summary">
    <div><dt>My notes</dt><dd data-site-data-notes>…</dd></div>
    <div><dt>Color mode</dt><dd data-site-data-mode>…</dd></div>
  </dl>
  <p>
    <button type="button" class="btn btn-primary" data-site-data-export>{% include icon.html name="download" %} Export data (JSON)</button>
  </p>
  <p class="site-data-status" data-site-data-status role="status" aria-live="polite"></p>
  <noscript><p>Exporting needs JavaScript, which is turned off in this browser.</p></noscript>
</div>

<script src="{{ '/assets/js/site-data.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>

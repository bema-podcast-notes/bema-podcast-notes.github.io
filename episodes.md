---
layout: page
title: All Episodes
---
<h2>All podcast episodes on <a href="https://www.bemadiscipleship.com" title="bemadiscipleship.com">bemadiscipleship.com</a>.</h2>
<p>
{% for episode in site.data.episodes %}
<a href="{{ episode.link }}">{{ episode.title }}</a><br />
{% endfor %}
</p>

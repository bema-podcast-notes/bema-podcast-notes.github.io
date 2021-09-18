---
layout: page
title: BEMA Session 1
permalink: /session1/
---

{% assign sorted_pages = site.session_1 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
<a href="{{ page.url }}">{{ page.title }}</a><br />
{% endfor %}

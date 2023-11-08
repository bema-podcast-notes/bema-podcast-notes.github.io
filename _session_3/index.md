---
layout: page
title: BEMA Session 3
permalink: /session3/
---

{% assign sorted_pages = site.session_3 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
<a href="{{ page.url }}">{{ page.title }}</a><br />
{% endif %}
{% endfor %}

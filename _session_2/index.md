---
layout: page
title: BEMA Session 2
permalink: /session2/
---

{% assign sorted_pages = site.session_2 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
<a href="{{ page.url }}">{{ page.title }}</a><br />
{% endif %}
{% endfor %}

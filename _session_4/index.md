---
layout: page
title: BEMA Session 4
permalink: /session4/
---

{% assign sorted_pages = site.session_4 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
<a href="{{ page.url }}">{{ page.title }}</a><br />
{% endif %}
{% endfor %}

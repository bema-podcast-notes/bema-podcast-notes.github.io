---
layout: page
title: BEMA Session 1
permalink: /session1/
---

{% assign sorted_pages = site.session_1 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
<a href="{{ page.url }}">{{ page.title }}</a><br />
{% endif %}
{% endfor %}

---
layout: page
title: Sitemap
sitemap: false
output: false
hidefrompages: true
---
<ul>
{%- assign my_page = site.pages | where: "path", path | where_exp:'doc','doc.sitemap != false' | first -%}
{% assign pages = site.html_pages | where_exp:'doc','doc.sitemap != false' | where_exp:'doc','doc.url != "/404.html"' %}
{% for page in pages %}
<li><a href="{{ page.url | replace:'/index.html','/' | absolute_url | xml_escape }}" title="{{ page.title }}">{{ page.title }}</a> {% if page.last_modified_at or page.date %}Last Modified: {{ page.last_modified_at | default: page.date | date_to_xmlschema }}{% endif %}</li>{% endfor %}
{% assign collections = site.collections | where_exp:'collection','collection.output != false' %}
{% for collection in collections %}{% assign docs = collection.docs | where_exp:'doc','doc.sitemap != false' %}{% for doc in docs %}
<li><a href="{{ doc.url | replace:'/index.html','/' | absolute_url | xml_escape }}" title="{{ doc.title }}">{{ doc.title }}</a> {% if doc.last_modified_at or doc.date %}Last Modified: {{ doc.last_modified_at | default: doc.date | date_to_xmlschema }}{% endif %}</li>{% endfor %}{% endfor %}
{% assign static_files = page.static_files | where_exp:'page','page.sitemap != false' | where_exp:'page','page.name != "404.html"' %}
{% for file in static_files %}
<li><a href="{{ file.path | replace:'/index.html','/' | absolute_url | xml_escape }}" title="{{ file.title }}">{{ file.title }}</a> {% if file.last_modified_at or doc.date %}Last Modified: {{ file.last_modified_at | default: file.date | date_to_xmlschema }}{% endif %}</li>{% endfor %}
</ul>


---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---
<h1>Hi!</h1>

My name is Adam and I'm listening to the [BEMA Podcast](https://www.bemadiscipleship.com/) by [Marty Solomon](https://www.bemadiscipleship.com/hosts/marty) and co-hosted by [Brent Billings](https://www.bemadiscipleship.com/hosts/brent).  

As I listen through the podcast, I'm taking notes. These are my notes of the content presented on the podcast and are not intended to imply the beliefs of Marty or Brent.  

I reserve the right to be incorrect.

## My Notes

I have binged this podcast and did not take the time to take notes along the way. As I go back through the podcast, I'll take notes and publish them here.

### [Session 1]({{ '/session1' | relative_url }}) {#session1}

{% assign sorted_pages = site.session_1 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
{% assign episode = site.data.episodes[page.episodeIndex] %}
<a href="{{ page.url }}">{{ page.title }}</a> - {{ episode.subtitle }}
{% endif -%}
{% endfor %}

### [Session 2]({{ '/session2' | relative_url }}) {#session2}

{% assign sorted_pages = site.session_2 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
{% assign episode = site.data.episodes[page.episodeIndex] %}
<a href="{{ page.url }}">{{ page.title }}</a> - {{ episode.subtitle }}
{% endif -%}
{% endfor %}

### [Session 3]({{ '/session3' | relative_url }}) {#session3}

{% assign sorted_pages = site.session_3 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
{% assign episode = site.data.episodes[page.episodeIndex] %}
<a href="{{ page.url }}">{{ page.title }}</a> - {{ episode.subtitle }}
{% endif -%}
{% endfor %}

### [Session 4]({{ '/session4' | relative_url }}) {#session4}

{% assign sorted_pages = site.session_4 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
{% assign episode = site.data.episodes[page.episodeIndex] %}
<a href="{{ page.url }}">{{ page.title }}</a> - {{ episode.subtitle }}
{% endif -%}
{% endfor %}

### [Session 5]({{ '/session5' | relative_url }}) {#session5}

{% assign sorted_pages = site.session_5 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
{% assign episode = site.data.episodes[page.episodeIndex] %}
<a href="{{ page.url }}">{{ page.title }}</a> - {{ episode.subtitle }}
{% endif -%}
{% endfor %}

### [Session 6]({{ '/session6' | relative_url }}) {#session6}

{% assign sorted_pages = site.session_6 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
{% assign episode = site.data.episodes[page.episodeIndex] %}
<a href="{{ page.url }}">{{ page.title }}</a> - {{ episode.subtitle }}
{% endif -%}
{% endfor %}

### [Session 7]({{ '/session7' | relative_url }}) {#session7}

{% assign sorted_pages = site.session_7 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
{% assign episode = site.data.episodes[page.episodeIndex] %}
<a href="{{ page.url }}">{{ page.title }}</a> - {{ episode.subtitle }}
{% endif -%}
{% endfor %}

### [Session 8]({{ '/session8' | relative_url }}) {#session8}

{% assign sorted_pages = site.session_8 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
{% assign episode = site.data.episodes[page.episodeIndex] %}
<a href="{{ page.url }}">{{ page.title }}</a> - {{ episode.subtitle }}
{% endif -%}
{% endfor %}

### [Session 9]({{ '/session9' | relative_url }}) {#session8}

{% assign sorted_pages = site.session_9 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
{% assign episode = site.data.episodes[page.episodeIndex] %}
<a href="{{ page.url }}">{{ page.title }}</a> - {{ episode.subtitle }}
{% endif -%}
{% endfor %}

### [Session 10]({{ '/session10' | relative_url }}) {#session8}

{% assign sorted_pages = site.session_10 | sort:"episodeIndex" %}
{% for page in sorted_pages %}
{%- if page.episodeIndex %}  
{% assign episode = site.data.episodes[page.episodeIndex] %}
<a href="{{ page.url }}">{{ page.title }}</a> - {{ episode.subtitle }}
{% endif -%}
{% endfor %}

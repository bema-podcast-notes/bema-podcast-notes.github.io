#!/usr/bin/env python3
"""
Python version of gen-episodes-yaml.ps1
Fetches BEMA podcast RSS feed and generates episodes YAML file and episode markdown files.
"""

import re
import os
import xml.etree.ElementTree as ET
from pathlib import Path
import requests
import yaml


def fetch_rss_feed(url, output_file):
    """
    Fetch RSS feed and save to file.
    Returns the XML content as a string.
    """
    print(f"Fetching RSS feed from {url}...")
    response = requests.get(url)
    response.raise_for_status()

    # Save raw RSS to file
    with open(output_file, 'wb') as f:
        f.write(response.content)
    print(f"Saved RSS feed to {output_file}")

    return response.text


def parse_rss_feed(rss_content):
    """
    Parse RSS XML and extract episode data.
    Returns a list of episode dictionaries.
    """
    print("Parsing RSS feed...")
    root = ET.fromstring(rss_content)

    # Define namespaces used in the feed
    namespaces = {
        'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
        'content': 'http://purl.org/rss/1.0/modules/content/',
        'atom': 'http://www.w3.org/2005/Atom'
    }

    episodes = []

    # Find all items (episodes) in the feed
    for item in root.findall('.//item'):
        episode = {}

        # Extract basic fields
        episode['title'] = item.findtext('title', '')
        episode['link'] = item.findtext('link', '')
        episode['pubDate'] = item.findtext('pubDate', '')
        episode['description'] = item.findtext('description', '')

        # Extract iTunes-specific fields
        episode['subtitle'] = item.findtext('itunes:subtitle', '', namespaces)
        episode['duration'] = item.findtext('itunes:duration', '', namespaces)
        episode['season'] = item.findtext('itunes:season', '', namespaces)

        # Extract enclosure URL (audio file)
        enclosure = item.find('enclosure')
        if enclosure is not None:
            episode['enclosure.url'] = enclosure.get('url', '')
        else:
            episode['enclosure.url'] = ''

        # Extract player URL (custom field or construct from link)
        # The RSS feed might have a specific player URL field
        # For now, we'll construct it from the episode data
        # This might need adjustment based on actual feed structure
        episode['playerUrl'] = episode['link'].replace('https://www.bemadiscipleship.com', 'https://www.bemadiscipleship.com/player')

        episodes.append(episode)

    print(f"Parsed {len(episodes)} episodes")
    return episodes


def convert_to_yaml(episodes, output_file):
    """
    Convert episodes list to YAML and save to file.
    """
    print(f"Converting to YAML and saving to {output_file}...")

    # Convert to YAML
    yaml_content = yaml.dump(episodes, default_flow_style=False, allow_unicode=True, sort_keys=False)

    # Apply regex transformations
    # Wrap duration values in quotes
    duration_regex = r'(duration:\s)(([0-9]+:)*[0-9]{1,2}:[0-9]{1,2})'
    yaml_content = re.sub(duration_regex, r'\1"\2"', yaml_content)

    # Save YAML file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(yaml_content)

    print(f"Saved episodes YAML to {output_file}")
    return yaml_content


def extract_book_links(yaml_content, output_file):
    """
    Extract book links from YAML content and save to separate file.
    """
    print("Extracting book links...")

    book_links_regex = r'<a target=\\"_blank\\" href=\\"[-a-zA-Z0-9@:%_\+.~?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~?&//=]*)?\??([-a-zA-Z0-9@:%_\+.~?&//=]+)?\\\"><em>[A-z\s]*<\/em>\s?(&nbsp;)?(B|b)y [\(\)A-z''\.\s]*<\/a>'

    book_links = re.findall(book_links_regex, yaml_content)

    if book_links:
        with open(output_file, 'w', encoding='utf-8') as f:
            for link in book_links:
                f.write(str(link) + '\n')
        print(f"Saved {len(book_links)} book links to {output_file}")
    else:
        print("No book links found")


def extract_episode_number(title):
    """
    Extract episode number from title.
    Returns the first numeric sequence found, or None if not found.
    """
    # Look for episode number pattern at the start of the title
    # Matches: "123:", "123.", "123 ", "-1:", etc.
    match = re.search(r'^(-?\d+[a-z]?)', title)
    if match:
        return match.group(1)

    # Fallback: any number in the title
    match = re.search(r'\d+', title)
    if match:
        return match.group(0)

    return None


def create_episode_files(episodes, data_dir):
    """
    Create episode markdown files for episodes that don't have them yet.
    """
    print("\nCreating episode markdown files...")

    script_dir = Path(__file__).parent.parent  # Go up one level from _scripts
    created_count = 0

    for episode_index, episode in enumerate(episodes):
        episode_number = extract_episode_number(episode['title'])

        if episode_number:
            season = episode.get('season', '')
            if not season:
                # Try to infer season from episode number
                # This is a fallback if season is not in the feed
                episode_num_int = int(re.search(r'\d+', episode_number).group())
                if episode_num_int < 0:
                    season = '1'
                elif episode_num_int <= 32:
                    season = '1'
                elif episode_num_int <= 72:
                    season = '2'
                elif episode_num_int <= 133:
                    season = '3'
                elif episode_num_int <= 190:
                    season = '4'
                elif episode_num_int <= 204:
                    season = '5'
                elif episode_num_int <= 333:
                    season = '6'
                elif episode_num_int <= 360:
                    season = '7'
                elif episode_num_int <= 410:
                    season = '8'
                elif episode_num_int <= 465:
                    season = '9'
                else:
                    season = '10'

            episode_title = episode['title']
            episode_file_path = script_dir / f"_session_{season}" / f"{episode_number}.md"

            # Create session directory if it doesn't exist
            episode_file_path.parent.mkdir(exist_ok=True)

            if not episode_file_path.exists():
                # Create new episode file
                file_content = f"""---
layout: episode_notes
title: "{episode_title}"
episodeNumber: {episode_number}
episodeIndex: {episode_index}
permalink: /ep/{episode_number}
---
No notes yet.
"""
                with open(episode_file_path, 'w', encoding='utf-8') as f:
                    f.write(file_content)

                print(f"  Created: {episode_file_path.relative_to(script_dir)}")
                created_count += 1

    if created_count > 0:
        print(f"\nCreated {created_count} new episode files")
    else:
        print("\nNo new episode files needed")


def main():
    """
    Main function to orchestrate the RSS feed processing.
    """
    print("="*60)
    print("BEMA Podcast RSS Feed Processor")
    print("="*60)
    print()

    # Define paths
    script_dir = Path(__file__).parent.parent  # Go up one level from _scripts
    data_dir = script_dir / '_data'
    data_dir.mkdir(exist_ok=True)

    rss_url = 'https://feeds.fireside.fm/bema/rss'
    rss_file = data_dir / 'bema-rss.xml'
    episodes_yaml_file = data_dir / 'episodes.yaml'
    book_list_file = data_dir / 'book-list.yaml'

    try:
        # Fetch RSS feed
        rss_content = fetch_rss_feed(rss_url, rss_file)

        # Parse RSS feed
        episodes = parse_rss_feed(rss_content)

        # Convert to YAML and save
        yaml_content = convert_to_yaml(episodes, episodes_yaml_file)

        # Extract book links
        extract_book_links(yaml_content, book_list_file)

        # Create episode markdown files
        create_episode_files(episodes, data_dir)

        print()
        print("="*60)
        print("Processing complete!")
        print("="*60)

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == '__main__':
    exit(main())

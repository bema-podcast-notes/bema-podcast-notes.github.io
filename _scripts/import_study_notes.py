#!/usr/bin/env python3
"""
Script to import study notes from temp/episodes/ into corresponding _session_* files.
Only replaces content if the target file contains "No notes yet."
Adjusts markdown headings by adding two additional # characters.
"""

import os
import re
import glob
from pathlib import Path

def adjust_markdown_headings(content):
    """Add two additional # characters to each heading"""
    lines = content.split('\n')
    adjusted_lines = []
    
    for line in lines:
        # Check if line starts with # (markdown heading)
        if line.strip().startswith('#') and not line.strip().startswith('#!'):
            # Add two more # characters
            adjusted_lines.append('##' + line)
        else:
            adjusted_lines.append(line)
    
    return '\n'.join(adjusted_lines)

def find_session_file(episode_number):
    """Find the corresponding session file for an episode number"""
    # Search all _session_* directories for the episode file
    session_dirs = glob.glob('_session_*')
    
    for session_dir in session_dirs:
        episode_file = os.path.join(session_dir, f"{episode_number}.md")
        if os.path.exists(episode_file):
            return episode_file
    
    return None

def process_study_notes_file(study_notes_path):
    """Process a single study notes file"""
    filename = os.path.basename(study_notes_path)
    
    # Extract episode number from filename (e.g., "134-study-notes.md" -> "134")
    match = re.match(r'^(\d+)-study-notes\.md$', filename)
    if not match:
        return False, f"Filename {filename} doesn't match expected pattern (#-study-notes.md)"
    
    episode_number = match.group(1)
    
    # Find corresponding session file
    session_file = find_session_file(episode_number)
    if not session_file:
        return False, f"No session file found for episode {episode_number}"
    
    # Read the study notes content
    try:
        with open(study_notes_path, 'r', encoding='utf-8') as f:
            study_content = f.read()
    except Exception as e:
        return False, f"Error reading study notes file: {str(e)}"
    
    # Read the session file
    try:
        with open(session_file, 'r', encoding='utf-8') as f:
            session_content = f.read()
    except Exception as e:
        return False, f"Error reading session file: {str(e)}"
    
    # Check if session file contains "No notes yet."
    if "No notes yet." not in session_content:
        return False, f"Session file {session_file} doesn't contain 'No notes yet.' - skipping"
    
    # Adjust markdown headings in study content
    adjusted_study_content = adjust_markdown_headings(study_content)
    
    # Replace "No notes yet." with the adjusted study content
    updated_content = session_content.replace("No notes yet.", adjusted_study_content.strip())
    
    # Write back to session file
    try:
        with open(session_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)
    except Exception as e:
        return False, f"Error writing to session file: {str(e)}"
    
    return True, f"Successfully imported notes for episode {episode_number} into {session_file}"

def find_study_notes_files():
    """Find all study notes files in temp/ directory and temp/episodes/ subdirectories"""
    study_notes_files = []
    
    # Look for study notes files directly in temp/
    temp_path = "temp"
    if os.path.exists(temp_path):
        for file in os.listdir(temp_path):
            if file.endswith('-study-notes.md'):
                study_notes_files.append(os.path.join(temp_path, file))
    
    # Look for study notes files in temp/episodes/*/
    temp_episodes_path = "temp/episodes"
    if os.path.exists(temp_episodes_path):
        # Search recursively for *-study-notes.md files
        for root, dirs, files in os.walk(temp_episodes_path):
            for file in files:
                if file.endswith('-study-notes.md'):
                    study_notes_files.append(os.path.join(root, file))
    
    return study_notes_files

def main():
    """Main function to process all study notes files"""
    study_notes_files = find_study_notes_files()
    
    if not study_notes_files:
        print("No study notes files found in temp/episodes/")
        return
    
    print(f"Found {len(study_notes_files)} study notes files")
    print("Processing files...\n")
    
    successful = 0
    failed = 0
    
    for study_notes_file in sorted(study_notes_files):
        success, message = process_study_notes_file(study_notes_file)
        
        if success:
            successful += 1
            print(f"  ✓ {os.path.basename(study_notes_file)}: {message}")
        else:
            failed += 1
            print(f"  ✗ {os.path.basename(study_notes_file)}: {message}")
    
    print(f"\nSummary:")
    print(f"  Successfully imported: {successful}")
    print(f"  Failed or skipped: {failed}")

if __name__ == "__main__":
    main()
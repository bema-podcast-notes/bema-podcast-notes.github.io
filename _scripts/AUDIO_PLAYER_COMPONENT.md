# Audio Player Component

## Overview
Added a simple HTML5 audio player component to episode pages that plays the podcast MP3 directly from the RSS feed.

## Location
The audio player is located in the episode player section, below the embedded iframe player:
- **Template**: `_layouts/episode_notes.html` (lines 106-115)
- **Styles**: `assets/css/episode.css` (lines 108-144)

## Features
- ✅ HTML5 native audio controls (play, pause, seek, volume)
- ✅ Plays MP3 directly from RSS feed's `enclosure.url` field
- ✅ Preloads metadata (duration, etc.) without downloading full file
- ✅ Accessible with keyboard controls and screen readers
- ✅ Right-click to download MP3 file
- ✅ Responsive design
- ✅ Clean, modern styling with gradient background

## Component Structure

### HTML (in episode_notes.html)
```html
<div id="player-number-2" class="player-container custom-audio-player">
    <h3 class="audio-player-title">Direct MP3 Player</h3>
    <audio controls preload="metadata" class="audio-element">
        <source src="{{ episode['enclosure.url'] }}" type="audio/mpeg">
        Your browser does not support the audio element.
    </audio>
    <p class="audio-player-help">
        <small>Use this player to listen directly in your browser, or right-click to download the MP3 file.</small>
    </p>
</div>
```

### CSS Classes
- `.custom-audio-player` - Container with gradient background and padding
- `.audio-player-title` - Heading style for player title
- `.audio-element` - Styles for the native audio control
- `.audio-player-help` - Helper text styling

## Data Source
The audio player uses the `enclosure.url` field from the episode data:
- **YAML Field**: `enclosure.url`
- **Data Source**: RSS feed `<enclosure>` tag
- **Access Method**: Liquid bracket notation `{{ episode['enclosure.url'] }}`
- **Format**: Direct MP3 URL from Fireside.fm CDN

Example URL format:
```
https://aphid.fireside.fm/d/[podcast-id]/[episode-id].mp3
```

## Browser Compatibility
- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (all versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Audio Controls
Native browser controls provide:
- Play/Pause button
- Timeline scrubber
- Current time / Duration display
- Volume control
- Download option (via right-click or context menu)
- Playback speed control (browser-dependent)
- Keyboard shortcuts (Space = play/pause, Arrow keys = seek)

## Accessibility
- Semantic HTML5 `<audio>` element
- Keyboard accessible controls
- Screen reader compatible
- Focus indicators for keyboard navigation
- Alternative text for unsupported browsers

## Styling Details
- **Background**: Linear gradient (light gray to lighter gray)
- **Border Radius**: 12px (inherited from .player-container)
- **Shadow**: Subtle drop shadow (inherited)
- **Focus State**: 2px purple outline with 2px offset
- **Height**: 54px (standard browser audio control height)
- **Responsive**: Full width on all screen sizes

## Why Two Players?
The page now has two audio player options:
1. **Embedded iframe player** (line 104): BEMA's official player with their branding/features
2. **Direct MP3 player** (line 106): Simple, fast, native browser player

This gives users flexibility:
- Official player: More features, tracks analytics
- Direct player: Faster loading, works offline, downloadable

## Future Enhancements
Possible improvements:
- Custom controls with enhanced UI
- Playback speed selector
- Skip forward/backward buttons
- Timestamp markers for show notes
- Playlist functionality
- Remember playback position
- Keyboard shortcuts display

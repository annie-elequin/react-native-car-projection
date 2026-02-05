# CarPlay Integration Guide

This guide covers how to integrate CarPlay into your React Native / Expo app using `react-native-car-projection`.

## Overview

CarPlay integration supports two modes:

| Mode | Description | Apple Approval Required |
|------|-------------|------------------------|
| **Media-only** (default) | Uses `MPNowPlayingInfoCenter` via `react-native-track-player` | ❌ No |
| **Full Templates** (experimental) | Custom UI with CarPlay templates | ✅ Yes (MFi Program) |

## Media-Only Mode (Recommended)

Media-only mode is the simplest approach and works without Apple MFi approval. Your app's audio playback automatically appears in CarPlay's Now Playing screen.

### How It Works

1. Your app uses `react-native-track-player` for audio playback
2. Track Player automatically updates iOS's `MPNowPlayingInfoCenter`
3. CarPlay displays the Now Playing info when your app is playing audio
4. Play/pause/skip controls in CarPlay control your app's playback

### Configuration

In your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-car-projection",
        {
          "carPlayEnabled": true,
          "carPlayTemplates": false,
          "mediaOnly": true
        }
      ]
    ]
  }
}
```

### What Gets Added

The plugin adds to your iOS project:
- `UIBackgroundModes: ["audio"]` - Required for background audio playback
- No special CarPlay entitlement needed

### CarPlay Now Playing Features

| Feature | Supported |
|---------|-----------|
| Track title | ✅ |
| Artist name | ✅ |
| Album name | ✅ |
| Artwork (as blurred background) | ✅ |
| Play/Pause | ✅ |
| Skip Next/Previous | ✅ |
| Seek (progress bar) | ✅ |
| Playback speed | ✅ |
| Jump ±15s | ❌ (podcast apps only) |
| Clear artwork thumbnail | ❌ (Apple design) |
| Custom UI/screens | ❌ (requires templates) |

### Track Metadata

For best CarPlay display, include full metadata when adding tracks:

```javascript
await TrackPlayer.add({
  id: 'track-1',
  url: 'https://example.com/audio.mp3',
  title: 'Song Title',
  artist: 'Artist Name',
  album: 'Album Name',
  genre: 'Genre',
  artwork: 'https://example.com/artwork.jpg', // HTTPS required!
  duration: 180, // seconds
});
```

**Important:** Use HTTPS URLs for artwork. iOS blocks HTTP by default (App Transport Security).

### Recommended Capabilities

Configure Track Player with these capabilities:

```javascript
await TrackPlayer.updateOptions({
  capabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.Stop,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
    Capability.SeekTo,
  ],
  compactCapabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
  ],
});
```

## Full Template Mode (Experimental)

⚠️ **Requires Apple MFi Program approval**

Full template mode allows custom CarPlay UI with templates like lists, grids, and custom Now Playing screens.

### Requirements

1. Apple Developer Program membership
2. Apply to Apple's MFi Program for CarPlay
3. Get approval for `com.apple.developer.carplay-audio` entitlement
4. This process can take weeks to months

### Configuration

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-car-projection",
        {
          "carPlayEnabled": true,
          "carPlayTemplates": true
        }
      ]
    ]
  }
}
```

### What Gets Added

- `com.apple.developer.carplay-audio` entitlement
- iOS Scene configuration (`UIApplicationSceneManifest`)
- `CarPlaySceneDelegate.swift` - Handles CarPlay lifecycle
- `MainSceneDelegate.swift` - Handles phone app lifecycle

## Testing

### CarPlay Simulator (Xcode)

1. Connect your iPhone to your Mac
2. Open Xcode → Window → Devices and Simulators
3. Select your device → Enable "Connect via network" (optional)
4. Open Xcode → Open Developer Tool → CarPlay Simulator
5. Your connected iPhone appears in the simulator

### Physical Car Testing

For testing in an actual car, build a release version:

```bash
npx expo run:ios --device --configuration Release
```

This bundles the JavaScript so the app works without a Metro server.

## Troubleshooting

### Artwork not showing in CarPlay

- Ensure artwork URLs use HTTPS (not HTTP)
- Check that artwork is a valid image format (JPEG, PNG)
- Artwork appears as blurred background in Now Playing (Apple's design)

### Controls not responding

- Ensure audio is actually playing (not paused)
- Verify Track Player service is registered in `index.js`
- Check that capabilities are configured

### App not appearing in CarPlay

- Media-only apps don't get their own icon
- They appear in "Now Playing" when playing audio
- Start playback on the phone first

## Comparison: Media-Only vs Full Templates

| Aspect | Media-Only | Full Templates |
|--------|------------|----------------|
| Setup complexity | Simple | Complex |
| Apple approval | Not required | Required (MFi) |
| Custom UI | No | Yes |
| App icon in CarPlay | No | Yes |
| Now Playing controls | Standard | Customizable |
| Time to implement | Hours | Weeks/Months |
| Maintenance | Low | Higher |

## Related Documentation

- [react-native-track-player](https://react-native-track-player.js.org/)
- [Apple CarPlay Developer Guide](https://developer.apple.com/carplay/)
- [MFi Program](https://mfi.apple.com/)

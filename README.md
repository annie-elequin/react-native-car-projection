# React Native Car Projection [VIBE CODED]

## ⚠️ NOTE: I am not a native mobile developer, so I vibe-coded this for my own purposes. Use at your own risk.

A modern React Native module for integrating Android Auto and CarPlay functionality using the Car App Library and Expo Modules API. Built for Expo SDK 53+ with React Native 0.79 and React 19 support.

## 🚀 Features

- ✅ **Android Auto Support**: Full template UI and MediaBrowserService integration
- ✅ **CarPlay Support**: Media-only mode via `MPNowPlayingInfoCenter` (no MFi approval required)
- ✅ **Modern Architecture**: Built with Expo Modules API and Android Car App Library
- ✅ **Expo SDK 53+ Compatible**: Works with React Native 0.79 and React 19
- ✅ **TypeScript Support**: Full TypeScript definitions included
- ✅ **Template System**: ListTemplate, MessageTemplate, and more
- ✅ **Easy Integration**: Simple setup with config plugin
- ✅ **Event Handling**: React to user interactions and navigation changes
- ✅ **New Architecture Ready**: Supports React Native's new architecture

## 📋 Prerequisites

- Expo SDK 53 or later
- React Native 0.79+
- React 19+
- **Android**: API level 23+, Android Auto app installed
- **iOS**: iOS 14+, `react-native-track-player` for CarPlay media

## 🏁 Installation

### 1. Install the module

```bash
npm install react-native-car-projection
# or
yarn add react-native-car-projection
```

### 2. Add the config plugin

Add the plugin to your `app.json` or `expo.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-car-projection",
        {
          "carAppCategory": "navigation",
          "minCarApiLevel": 1,
          "targetCarApiLevel": 6
        }
      ]
    ]
  }
}
```

### 3. Rebuild your app

```bash
npx expo prebuild --clean
npx expo run:android
```

## Example apps (app types)

The plugin supports three app types. Example apps for each are available in the [TestCarProjection](https://github.com/annie-elequin/TestCarProjection) repository under the `examples/` directory:

| Type | Config | Description | Example app |
|------|--------|-------------|-------------|
| **Car App only (no media)** | `mediaSupport: false`, `mediaOnly: false`, `carAppCategory` e.g. `"navigation"` | No MediaBrowserService. Car App template UI only. | [examples/TestCarAppOnly](https://github.com/annie-elequin/TestCarProjection/tree/main/examples/TestCarAppOnly) |
| **Car App + media** | `mediaOnly: false`, `mediaSupport: true` | Car App Service and MediaBrowserService. Template UI and now-playing slot. | [examples/TestCarAppPlusMedia](https://github.com/annie-elequin/TestCarProjection/tree/main/examples/TestCarAppPlusMedia) |
| **Media only** | `mediaOnly: true`, `mediaSupport: true` | MediaBrowserService only (no Car App). Browse + now-playing, like Spotify. | [examples/TestMediaOnly](https://github.com/annie-elequin/TestCarProjection/tree/main/examples/TestMediaOnly) |

Each example app runs on both iOS and Android; Android Auto–specific behavior applies on Android when connected to a head unit or DHU. See [examples/README.md](https://github.com/annie-elequin/TestCarProjection/blob/main/examples/README.md) for how to run them.

## 🍎 CarPlay Integration (iOS)

CarPlay support uses a **media-only approach** that works without Apple MFi approval. Your app's audio playback automatically appears in CarPlay's Now Playing screen.

### How It Works

1. Your app uses `react-native-track-player` for audio playback
2. Track Player updates iOS's `MPNowPlayingInfoCenter`
3. CarPlay displays the Now Playing info when audio is playing
4. Play/pause/skip controls in CarPlay control your app's playback

### Configuration

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

### CarPlay Now Playing Features

| Feature | Supported |
|---------|-----------|
| Track title, artist, album | ✅ |
| Artwork (blurred background) | ✅ |
| Play/Pause/Skip controls | ✅ |
| Seek (progress bar) | ✅ |
| Custom UI/screens | ❌ (requires MFi approval) |

> **Note:** Media-only apps don't get their own icon in CarPlay. They appear in the "Now Playing" screen when audio is playing.

For full CarPlay documentation, see [docs/CARPLAY.md](./docs/CARPLAY.md).

## 🎯 Quick Start

```typescript
import React, { useEffect } from 'react';
import CarProjection, { createListTemplate } from 'react-native-car-projection';

export default function App() {
  useEffect(() => {
    // Register your root screen
    CarProjection.registerScreen({
      name: 'root',
      template: createListTemplate({
        title: 'My App',
        header: 'Main Menu',
        items: [
          {
            title: 'Navigation',
            texts: ['Start navigation'],
            onPress: () => {}
          }
        ]
      })
    });

    // Start the session
    CarProjection.startSession();
  }, []);

  return <YourAppContent />;
}
```

### Media-only mode: browse content (setMediaBrowseTree)

When using `mediaOnly: true`, you can set the MediaBrowser browse tree so the car shows available items (e.g. Recently Played, playlists, tracks). Call `setMediaBrowseTree` with a map where keys are parent IDs and values are arrays of `MediaItem`. The root key must be `"__ROOT__"`. Use `addMediaPlayFromIdListener` to start playback when the user taps a playable item.

```typescript
// Example: root with one folder and one track
await CarProjection.setMediaBrowseTree({
  __ROOT__: [
    { id: 'playlist_1', title: 'Recently Played', browsable: true, playable: false },
    { id: 'track_1', title: 'Song Title', artist: 'Artist', playable: true },
  ],
  playlist_1: [
    { id: 'track_2', title: 'Another Song', artist: 'Artist', playable: true },
  ],
});

CarProjection.addMediaPlayFromIdListener((event) => {
  // Start playing the track with id event.mediaId
  playTrackById(event.mediaId);
});
```

For more detailed documentation, see the full README in the repository.

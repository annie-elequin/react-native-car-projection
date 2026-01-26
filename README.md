# React Native Car Projection [VIBE CODED]

## ⚠️ NOTE: I am not a native mobile developer, so I vibe-coded this for my own purposes. Use at your own risk.

A modern React Native module for integrating Android Auto and CarPlay functionality using a unified API. Built for Expo SDK 53+ with React Native 0.79 and React 19 support.

## 🚀 Features

- ✅ **Unified API**: Single API for both Android Auto and CarPlay - write once, works on both platforms
- ✅ **Modern Architecture**: Built with Expo Modules API, Android Car App Library, and iOS CarPlay framework
- ✅ **Expo SDK 53+ Compatible**: Works with React Native 0.79 and React 19
- ✅ **TypeScript Support**: Full TypeScript definitions included
- ✅ **Template System**: ListTemplate, MessageTemplate, and more
- ✅ **Easy Integration**: Simple setup with config plugin
- ✅ **Event Handling**: React to user interactions and navigation changes
- ✅ **New Architecture Ready**: Supports React Native's new architecture
- ✅ **Cross-Platform**: Automatically routes to Android Auto or CarPlay based on platform

## 📋 Prerequisites

- Expo SDK 53 or later
- React Native 0.79+
- React 19+
- **Android**: Android API level 23+, Android Auto app installed on device
- **iOS**: iOS 14.0+, CarPlay-compatible device or simulator

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
          "android": {
            "carAppCategory": "media",
            "minCarApiLevel": 1,
            "targetCarApiLevel": 6
          },
          "ios": {
            "carAppCategory": "navigation"
          }
        }
      ]
    ]
  }
}
```

### 3. Rebuild your app

```bash
# For Android
npx expo prebuild --clean
npx expo run:android

# For iOS
npx expo prebuild --clean
npx expo run:ios
```

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

For more detailed documentation, see the full README in the repository.

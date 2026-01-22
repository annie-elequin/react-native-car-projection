# React Native Car Projection

A modern React Native module for integrating Android Auto and CarPlay functionality using the Car App Library and Expo Modules API. Built for Expo SDK 53+ with React Native 0.79 and React 19 support.

## 🚀 Features

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
- Android API level 23+
- Android Auto app installed on device

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

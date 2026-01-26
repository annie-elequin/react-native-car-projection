# Testing Guide

## Quick Local Test

### Step 1: Build the module
```bash
npm run build
```

### Step 2: Create a test Expo app
```bash
# Create a new Expo app
npx create-expo-app TestCarProjection --template blank

# Navigate to it
cd TestCarProjection
```

### Step 3: Install the local module
```bash
# Install your local module
npm install ../react-native-car-projection

# Or if you're in a different location:
npm install /path/to/react-native-car-projection
```

### Step 4: Configure the app

Edit `app.json` (or `app.config.js`):
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

### Step 5: Add test code

Edit `App.js` (or `App.tsx`):
```javascript
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import CarProjection, { createListTemplate } from 'react-native-car-projection';

export default function App() {
  useEffect(() => {
    // Register a test screen (works on both Android Auto and CarPlay)
    CarProjection.registerScreen({
      name: 'root',
      template: createListTemplate({
        title: 'Test App',
        header: 'Car Projection Test',
        items: [
          {
            title: 'Test Item 1',
            texts: ['This is a test'],
            onPress: () => {
              console.log('Item 1 pressed!');
            }
          },
          {
            title: 'Test Item 2',
            texts: ['Another test item'],
            onPress: () => {
              console.log('Item 2 pressed!');
            }
          }
        ]
      })
    });

    // Start the session
    CarProjection.startSession();

    // Listen for events
    const screenSub = CarProjection.addScreenChangedListener((screenName) => {
      console.log('Screen changed to:', screenName);
    });

    const sessionSub = CarProjection.addSessionStartedListener(() => {
      console.log('Car projection session started!');
    });

    return () => {
      screenSub.remove();
      sessionSub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Car Projection Test</Text>
      <Text style={styles.subtext}>
        {Platform.OS === 'android' 
          ? 'Connect to Android Auto to see the test screen'
          : 'Connect to CarPlay to see the test screen'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});
```

### Step 6: Prebuild and run
```bash
# Generate native code
npx expo prebuild --clean

# Run on Android
npx expo run:android

# Or run on iOS
npx expo run:ios
```

## Testing Android Auto

### Option 1: Android Auto Desktop Head Unit (AA Desktop Head Unit)
1. Install [AA Desktop Head Unit](https://github.com/martoreto/aauto-vex-vag) on your computer
2. Connect your Android device via USB
3. Enable USB debugging
4. Run the app on your device
5. Launch AA Desktop Head Unit to see your app

### Option 2: Physical Android Auto Device
1. Connect your Android phone to an Android Auto compatible car/head unit
2. Launch your app on the phone
3. Your app should appear in Android Auto

### Option 3: Android Emulator (Limited)
- Android Auto doesn't work well in emulators
- Use a physical device or AA Desktop Head Unit instead

## Testing CarPlay (iOS)

### Option 1: CarPlay Simulator (macOS)
1. Open Xcode
2. Go to **Window > External Displays > CarPlay**
3. Run your app on an iOS simulator
4. The CarPlay simulator will show your app

### Option 2: Physical CarPlay Device
1. Connect your iPhone to a CarPlay-compatible car/head unit via USB or wirelessly
2. Launch your app on the iPhone
3. Your app should appear in CarPlay

### Option 3: iOS Simulator with CarPlay
- Requires macOS and Xcode
- Use the CarPlay simulator option in Xcode

### CarPlay Requirements
- iOS 14.0 or later
- CarPlay entitlement configured in your app
- Physical device or CarPlay simulator (regular iOS simulator doesn't support CarPlay)

## Troubleshooting

### Module not found
- Make sure you ran `npm run build` in the module directory
- Check that the path to the module in `npm install` is correct

### Build errors
- **Android**: Make sure you have Android SDK installed
- **iOS**: Make sure you have Xcode and iOS SDK installed
- Check that `npx expo prebuild` completed successfully
- Try `npx expo prebuild --clean` to start fresh

### Android Auto not showing app
- Verify the plugin is in `app.json`
- Check that `carAppCategory` matches your use case
- Ensure the app is installed on the device
- Restart Android Auto after installing the app

### CarPlay not showing app
- Verify the plugin is in `app.json` and iOS configuration is present
- Check that CarPlay entitlements are configured
- Ensure you're using a physical device or CarPlay simulator
- Check that your app's CarPlay category matches Apple's requirements
- Verify Info.plist has CarPlay scene configuration

### Platform detection issues
- The unified API automatically detects the platform
- On Android, it uses Android Auto
- On iOS, it uses CarPlay
- Make sure you're testing on the correct platform

## Quick Test Script

You can also use the npm script:
```bash
npm run test-android
```
This will show you the commands to run (but won't execute them automatically).

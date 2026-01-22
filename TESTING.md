# Testing Guide

## Quick Local Test

### Step 1: Build the module
```bash
npm run build
```

### Step 2: Create a test Expo app
```bash
# Create a new Expo app
npx create-expo-app TestAndroidAuto --template blank

# Navigate to it
cd TestAndroidAuto
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
          "carAppCategory": "media",
          "minCarApiLevel": 1,
          "targetCarApiLevel": 6
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
import { View, Text, StyleSheet } from 'react-native';
import CarProjection, { createListTemplate } from 'react-native-car-projection';

export default function App() {
  useEffect(() => {
    // Register a test screen
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
      <Text style={styles.text}>Android Auto Module Test</Text>
      <Text style={styles.subtext}>
        Connect to Android Auto to see the test screen
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

## Troubleshooting

### Module not found
- Make sure you ran `npm run build` in the module directory
- Check that the path to the module in `npm install` is correct

### Build errors
- Make sure you have Android SDK installed
- Check that `npx expo prebuild` completed successfully
- Try `npx expo prebuild --clean` to start fresh

### Android Auto not showing app
- Verify the plugin is in `app.json`
- Check that `carAppCategory` matches your use case
- Ensure the app is installed on the device
- Restart Android Auto after installing the app

## Quick Test Script

You can also use the npm script:
```bash
npm run test-android
```
This will show you the commands to run (but won't execute them automatically).

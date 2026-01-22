# Development Guide

## 🔍 Catching Kotlin Errors Early

Since `npm run build` only compiles TypeScript, here are ways to catch Android/Kotlin errors during development:

### Method 1: Quick Test in Existing Android Project (Recommended)

1. **Test in a minimal Android app first:**
   ```bash
   # Create a test Expo app
   npx create-expo-app TestAndroidAuto
   cd TestAndroidAuto
   
   # Add your module
   npm install /path/to/react-native-car-projection
   
   # Try building
   npx expo run:android --no-install --no-bundler
   ```

2. **If errors occur, you caught them early!**

### Method 2: Use Android Studio

1. Open `android/` folder in Android Studio
2. Sync gradle files  
3. Look for red error indicators in Kotlin files
4. Fix issues before integration

### Method 3: CI/CD Integration

Add this to your GitHub Actions or CI:

```yaml
name: Test Kotlin Compilation
on: [push, pull_request]

jobs:
  test-kotlin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Test in minimal project
        run: |
          npx create-expo-app@latest TestApp --template blank
          cd TestApp
          npm install ../
          npx expo install --fix
          npx expo run:android --no-device
```

## 🐛 Common Kotlin Issues to Watch For

1. **Variable Assignment Issues**
   - `val` vs `var` confusion
   - Companion object scope issues

2. **API Version Mismatches** 
   - Android Car App Library updates
   - Expo Modules API changes

3. **Import Issues**
   - Missing dependencies
   - Incorrect package names

## 📝 Development Workflow

1. Edit Kotlin files
2. Run `npm run build` (TypeScript check)
3. Test in minimal Android project
4. Fix any Kotlin errors
5. Test in your main project
6. Success! 🎉

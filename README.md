# SpaceTuner Pro

A professional Progressive Web App (PWA) for tuning Handpans and Tongue Drums. Built with React, TailwindCSS, and the Web Audio API. Now also available as a native mobile app for Android and iOS!

## Project Structure

*   `index.html` - Entry point
*   `index.tsx` - React root
*   `App.tsx` - Main application logic
*   `components/` - UI Components (Tuner, Tone Generator, AI Chat, etc.)
*   `utils/` - Audio processing (Pitch detection, Synth) and AI logic
*   `constants.ts` - Scales, note definitions, and color themes
*   `types.ts` - TypeScript definitions
*   `android/` - Android native project (Capacitor)
*   `ios/` - iOS native project (Capacitor)

## Cleanup Instructions

This project has been migrated from Flutter to React. To remove the leftover Flutter files (`lib/` folder and `pubspec.yaml`), run the included cleanup script in your terminal:

```bash
sh cleanup.sh
```

## Mobile App (Android & iOS)

This project has been configured with Capacitor for native mobile deployment. The app runs exactly the same as the web version, including full microphone access for the tuner functionality.

### Prerequisites

- **Android**: Android Studio installed
- **iOS**: Xcode installed (macOS only)

### Development Workflow

1. **Build and sync web assets:**
   ```bash
   npm run cap:sync
   ```

2. **Open Android project:**
   ```bash
   npm run cap:android:open
   ```
   Then run the app from Android Studio (connect device or emulator)

3. **Open iOS project:**
   ```bash
   npm run cap:ios:open
   ```
   Then run the app from Xcode (connect device or simulator)

### Quick Commands

```bash
# Build web app
npm run build

# Build and sync for all platforms
npm run cap:sync

# Build and open Android
npm run cap:build:android

# Build and open iOS
npm run cap:build:ios
```

### Mobile Permissions

The following permissions have been configured:

**Android (`android/app/src/main/AndroidManifest.xml`):**
- `RECORD_AUDIO` - Required for microphone access in tuner
- `MODIFY_AUDIO_SETTINGS` - For audio configuration
- `VIBRATE` - For haptic feedback

**iOS (`ios/App/App/Info.plist`):**
- `NSMicrophoneUsageDescription` - Required for microphone access
- `UIBackgroundModes` (audio) - For audio playback in background
- `NSSpeechRecognitionUsageDescription` - For AI speech features

## Features

*   **Precision Tuner:** YIN algorithm-based frequency detection with cents deviation.
*   **Tone Generator:** Synthesizer for reference pitches (Sine, Triangle, Square, Sawtooth) with vibrato.
*   **AI Assistant:** Google Gemini-powered chat for tuning advice and instrument care.
*   **Offline Mode:** Fully functional PWA with offline fallback logic.
*   **Visualizer:** Real-time oscilloscope and spectral analysis.
*   **Native Mobile:** Full Android and iOS support with Capacitor.

## Web Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

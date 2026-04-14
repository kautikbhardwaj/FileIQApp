# FileIQ — Free Version

File manager for iOS (and Android) that lets users browse, categorize,
and offload large files to Google Drive — **no OAuth, no cost**.

---

## How the Drive integration works (Free)

Files are pushed via the native **iOS Share Sheet** / **Android Intent**.
Google Drive appears as a destination if it's installed on the device.
Files land in the **root of My Drive** by default.

```
User selects files  →  Tap "Upload to Drive"
→  iOS UIActivityViewController opens
→  User taps Google Drive in the share sheet
→  Drive app saves files to My Drive (root)
→  App prompts: "Delete from phone?"
```

Zero API keys. Zero OAuth. Zero cost. Forever.

---

## Setup

### 1. Install dependencies

```bash
cd FileIQApp
npm install

# iOS
cd ios && pod install && cd ..
```

### 2. iOS — Info.plist

Copy the entries from `ios/Info.plist.additions.xml` into your
`ios/FileIQApp/Info.plist` inside the root `<dict>`.

### 3. Android — AndroidManifest.xml

Copy the permissions from `android/AndroidManifest.additions.xml`
into `android/app/src/main/AndroidManifest.xml`.

### 4. Run

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

---

## Project structure

```
FileIQApp/
├── App.js                          # Entry point
├── src/
│   ├── context/
│   │   └── ScanContext.js          # Global scan state
│   ├── screens/
│   │   ├── FilesScreen.js          # Tab 1: File manager
│   │   ├── ByTypeScreen.js         # Tab 2: Category grid
│   │   └── TypeDetailScreen.js     # Files within one category
│   ├── services/
│   │   ├── FileScanner.js          # Scans device storage
│   │   └── DriveShare.js           # Pushes files to Drive app
│   ├── components/
│   │   └── SharedComponents.js     # Reusable UI pieces
│   ├── navigation/
│   │   └── AppNavigator.js         # Tab + stack navigation
│   └── utils/
│       ├── fileTypes.js            # Extension → category map
│       └── theme.js                # Design tokens
├── ios/
│   └── Info.plist.additions.xml    # Permissions to add
└── android/
    └── AndroidManifest.additions.xml
```

---

## Features (Free version)

| Feature | Status |
|---|---|
| Scan device storage | ✅ |
| Camera Roll (photos + videos) | ✅ iOS |
| Categorize by file type | ✅ |
| Filter by format (.mp4, .pdf…) | ✅ |
| Sort by size / date / name | ✅ |
| Select multiple files | ✅ |
| Push to Google Drive (root) | ✅ via Share Sheet |
| Delete from phone after upload | ✅ |
| Storage usage overview | ✅ |
| Works offline | ✅ |
| No API keys | ✅ |
| No OAuth | ✅ |
| No cost | ✅ |

---

## Pro version (future — OAuth)

To unlock silent background uploads to specific Drive folders,
replace `sendToDrive()` in `src/services/DriveShare.js` with a call
to the Drive REST API using an OAuth access token.

The rest of the app (scanner, UI, categories) stays identical.
Only the upload function changes.

```
Free:  sendToDrive() → UIActivityViewController → Drive app
Pro:   sendToDrive() → Drive REST API → specific folder path
```

---

## Key libraries

| Library | Purpose |
|---|---|
| `react-native-fs` | File system traversal |
| `@react-native-camera-roll/camera-roll` | Photos & videos (iOS) |
| `react-native-share` | Share Sheet / Intent |
| `react-native-permissions` | Runtime permission requests |
| `@shopify/flash-list` | Fast scrolling lists |
| `@react-navigation/*` | Navigation |

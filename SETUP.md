# How to push FileIQ to GitHub and trigger a build

## One-time setup (run these on your Windows machine)

### 1. Install Git for Windows
Download from https://git-scm.com/download/win and install with default settings.

### 2. Install Node.js
Download LTS from https://nodejs.org and install.

### 3. Clone your repo
Open PowerShell or Command Prompt:
```bash
git clone https://github.com/kautikbhardwaj/FileIQApp.git
cd FileIQApp
```

### 4. Copy the FileIQ source files
Copy all the files from the FileIQApp folder we built into this cloned folder.
Your folder structure should look like:
```
FileIQApp/
├── .github/
│   └── workflows/
│       ├── build-ios.yml       ← GitHub Actions iOS build
│       └── eas-build.yml       ← Expo EAS build
├── src/
│   ├── screens/
│   ├── services/
│   ├── components/
│   ├── navigation/
│   ├── context/
│   └── utils/
├── ios/
├── android/
├── App.js
├── package.json
├── eas.json
└── .gitignore
```

### 5. Push to GitHub
```bash
git add .
git commit -m "Initial FileIQ commit"
git push origin main
```

## That's it — the build starts automatically

After you push, go to:
https://github.com/kautikbhardwaj/FileIQApp/actions

You'll see the "Build FileIQ iOS" workflow running on GitHub's free Mac server.
First build takes ~15-20 minutes (downloading dependencies).
Subsequent builds take ~8-10 minutes (CocoaPods are cached).

## To trigger a manual build any time
1. Go to your repo on GitHub
2. Click the "Actions" tab
3. Click "Build FileIQ iOS" on the left
4. Click "Run workflow" → "Run workflow"

## To test on your real iPhone (Expo EAS)

### Setup (one time):
```bash
npm install -g eas-cli
eas login          # creates free account at expo.dev
eas build:configure
```

### Add your Expo token to GitHub:
1. Go to expo.dev → Account Settings → Access Tokens → Create token
2. Go to your GitHub repo → Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: EXPO_TOKEN
5. Value: (paste your token)

### Trigger EAS build:
1. GitHub repo → Actions → "Expo EAS Build" → Run workflow
2. Choose "preview" profile
3. Expo builds on their Mac servers and sends you a QR code
4. Scan with your iPhone to install FileIQ directly

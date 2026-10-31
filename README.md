<<<<<<< HEAD
<div align="center">

# PhotoMart
=======
# PhotoMart

PhotoMart is an [Expo](https://expo.dev) app for discovering and saving photos.
It supports persisted light/dark appearance and paginated photo feeds.
>>>>>>> main

### A React Native image discovery and wallpaper app built with Expo

Browse the app's image-focused experience, preview visual content, and build toward a smooth mobile-first photo workflow.

**Built with Expo · React Native · TypeScript · Expo Router**

</div>

---

## Overview

**PhotoMart** is a mobile application project built with Expo and React Native. The repository is configured for file-based navigation with Expo Router and includes a native-oriented stack for displaying images, accessing media-library functionality, sharing content, handling gestures, and integrating wallpaper-setting functionality on supported Android builds.

The repository's original README still contains the default `create-expo-app` starter instructions, and the Expo configuration currently contains the starter identifier `expenseTracker`. This document describes the project based on the files and dependencies visible in the repository. Features should be considered implemented only when confirmed in the corresponding app screens and native workflows.

- **Repository:** [Codewithajoydas/Photomart](https://github.com/Codewithajoydas/Photomart)
- **Platform:** Expo / React Native
- **Language:** TypeScript
- **Navigation:** Expo Router
- **Package manager:** npm

## Project goals

PhotoMart's image-focused technology foundation is intended to support workflows such as:

- Presenting images in a mobile interface.
- Rendering image content with Expo Image.
- Navigating between app screens using file-based routes.
- Working with device media-library capabilities.
- Sharing supported content through the native share sheet.
- Building gesture-driven interactions such as image viewing and navigation.
- Integrating wallpaper-setting functionality where supported by the native platform and development build.

The exact screens, image source, download behavior, account features, and backend/API integrations should be documented here once they are confirmed in the implementation. This README intentionally does not claim that an online image API, authentication system, or backend service exists.

## Technology stack

| Technology / package            | Purpose                                                 |
| ------------------------------- | ------------------------------------------------------- |
| Expo                            | React Native app development and native project tooling |
| React Native                    | Cross-platform mobile UI                                |
| TypeScript                      | Static typing for application code                      |
| Expo Router                     | File-based navigation                                   |
| Expo Image                      | Image rendering                                         |
| Expo Media Library              | Device media-library integration                        |
| Expo Sharing                    | Native sharing workflow                                 |
| React Native Gesture Handler    | Touch and gesture interactions                          |
| React Native Reanimated         | Animated UI and gesture-related animation               |
| React Native Worklets           | Worklet runtime used by the animation stack             |
| React Native Safe Area Context  | Safe-area-aware layouts                                 |
| React Native Screens            | Native screen primitives                                |
| React Navigation Bottom Tabs    | Bottom-tab navigation primitives                        |
| @gorhom/bottom-sheet            | Bottom-sheet UI                                         |
| NativeWind                      | Tailwind-style styling for React Native                 |
| Expo Vector Icons               | Icon set                                                |
| Expo Symbols                    | Platform symbol support                                 |
| Expo File System                | File-system operations                                  |
| Expo Linking                    | Deep links and external URL handling                    |
| Expo Web Browser                | In-app browser support                                  |
| react-native-set-live-wallpaper | Native live-wallpaper integration                       |
| Expo Build Properties           | Native build configuration                              |
| Prettier Tailwind plugin        | Consistent formatting of Tailwind classes               |

> Installed packages indicate available project dependencies, not proof that every package is currently used by an app screen.

## Repository structure

The visible repository includes the following top-level paths:

```text
Photomart/
├── .claude/                 # Project-specific Claude configuration
├── .vscode/                 # Editor configuration
├── assets/                  # App images, icons, and other static assets
├── components/              # Reusable UI components
├── lib/                     # Shared utilities and application logic
├── src/
│   └── app/                 # Expo Router routes and layouts
├── .gitignore
├── AGENTS.md                # Repository-specific agent instructions
├── LICENSE
├── README.md
├── app.json                 # Expo app configuration
├── babel.config.js
├── global.css
├── metro.config.js
├── nativewind-env.d.ts
├── package-lock.json
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

Some files and folders may change as development continues. Keep this tree synchronized with the actual repository.

## Requirements

Install the following before running the project:

- Node.js LTS compatible with the installed Expo SDK.
- npm.
- Git.
- Android Studio and an Android SDK for Android emulator/native builds.
- Xcode on macOS if you intend to build and run an iOS native app.

Check the Expo SDK and React Native versions in `package.json` before changing Node.js, Expo, or native dependency versions.

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/Codewithajoydas/Photomart.git
cd Photomart
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start Expo

```bash
npx expo start
```

Use the terminal's available Expo options to open the app in a compatible development environment.

### Run on Android

For a configured Android emulator or connected device:

```bash
npm run android
```

This runs the repository's `expo run:android` script and may require a correctly configured Android development environment.

### Run on iOS

On macOS with Xcode installed:

```bash
npm run ios
```

### Run on the web

```bash
npm run web
```

Native modules may not have equivalent browser behavior. In particular, wallpaper-setting and other native-only functionality should be tested on the target native platform.

## Development workflow

### File-based routing

The project uses Expo Router and places route files under `src/app`. To add or modify a screen, inspect the existing route files and layouts first, then follow the current naming and navigation conventions.

### Reusable components

Shared UI belongs in `components/` when that matches the existing project conventions. Keep screen-specific behavior close to its route and extract reusable pieces when doing so improves clarity.

### Shared logic

Use `lib/` for reusable helpers and application logic that do not belong exclusively to one screen. Avoid putting secrets in client-side source files.

### Styling

The repository includes NativeWind, Tailwind CSS configuration, and a global stylesheet. Follow the existing styling approach rather than mixing multiple styling systems without a clear reason.

## Image and native functionality notes

### Image rendering

`expo-image` is included in the dependency list and can be used to render remote or local images. For remote images, handle loading, failure, aspect ratio, and image sizing deliberately.

### Media library

`expo-media-library` is available for supported device-media workflows. Review its current permission requirements and request access only when the user invokes a feature that needs it.

### Sharing and file operations

`expo-sharing` and `expo-file-system` are installed. Validate file availability and platform support before offering a share or save action, and provide a useful error state if the operation fails.

### Gestures and animation

The project includes Gesture Handler, Reanimated, and Worklets. Gesture-driven screens should be tested on physical devices as well as emulators, especially when combining pan, pinch, and scrolling behavior.

### Wallpaper integration

The repository includes `react-native-set-live-wallpaper` and Expo build configuration for native functionality. Wallpaper features may require a development build and platform-specific configuration; they should not be assumed to work in Expo Go or on web. Verify the library's setup instructions and test the exact wallpaper workflow on a supported Android device.

## Available npm scripts

| Command                 | Description                               |
| ----------------------- | ----------------------------------------- |
| `npm start`             | Start the Expo development server         |
| `npm run android`       | Run the native Android project            |
| `npm run ios`           | Run the native iOS project                |
| `npm run web`           | Start the web target                      |
| `npm run lint`          | Run Expo's lint command                   |
| `npm run reset-project` | Run the repository's starter reset script |

The reset script is intended for resetting starter-project structure. Review its behavior before running it in a project containing work you want to preserve.

## Configuration

The Expo configuration lives in `app.json`. Review these fields before a release:

- `expo.name` — user-facing application name.
- `expo.slug` — Expo project identifier.
- `expo.version` — app version.
- `expo.scheme` — deep-link scheme.
- `expo.android.package` — Android application ID.
- `expo.ios` — iOS-specific configuration.
- `expo.plugins` — native module and config-plugin setup.
- `expo.web` — web output and browser assets.

**Repository cleanup note:** the currently visible `app.json` and `package.json` still use the name `expenseTracker` / `expensetracker` in their app identifiers. Update these values deliberately if PhotoMart is the intended product name. Changing the Android package ID or URL scheme can affect installed builds, deep links, and release identity, so do not change them blindly.

## Permissions, privacy, and security

- Request device media permissions only when needed and explain the purpose to users.
- Do not commit API keys, signing credentials, or private configuration.
- Keep any private service credentials on a trusted server, not in the mobile bundle.
- Treat remote image URLs and downloaded files as untrusted input.
- Handle network failures, denied permissions, unavailable files, and unsupported platform features.
- Review the privacy implications of any image hosting or analytics service added in the future.

## Troubleshooting

### Dependencies or Expo SDK mismatch

Run:

```bash
npx expo-doctor
```

Then follow its recommendations and verify that installed native package versions match the project's Expo SDK.

### Metro cache or stale bundling state

Try:

```bash
npx expo start --clear
```

### Native module does not work in Expo Go

Some native packages require a custom development build. Build and run the app with the repository's native workflow after checking the module's installation instructions.

### Android build errors

Confirm that Android Studio, the Android SDK, Java, and native build tools meet the versions required by the installed Expo SDK. Review the full build output rather than relying only on the final error line.

### Media or wallpaper permission issues

Test on the target Android version, confirm the permission and native setup required by the package, and handle denied or restricted access in the UI.

## Quality checklist

Before releasing a build, verify:

- [ ] App name, slug, package ID, and icons identify PhotoMart correctly.
- [ ] Main routes and navigation work.
- [ ] Image loading has loading and error states.
- [ ] Media permissions are requested at the correct time.
- [ ] Sharing and file operations handle failure cases.
- [ ] Gesture interactions work on real devices.
- [ ] Wallpaper behavior is tested on a supported native build, if part of the release.
- [ ] Linting and Expo diagnostics pass.
- [ ] No credentials or private keys are committed.
- [ ] README claims match the actual implementation.

## Roadmap

These are potential improvements, not claims that the features already exist:

- [ ] Replace the default starter identity in the Expo configuration.
- [ ] Document the actual screen flows and image source.
- [ ] Add screenshots and a short demonstration recording.
- [ ] Document image saving, sharing, and wallpaper workflows after verifying them.
- [ ] Add automated tests for critical UI and file workflows.
- [ ] Add release and build instructions for supported platforms.
- [ ] Document privacy behavior and any remote services.

## Contributing

1. Fork the repository.
2. Create a focused feature branch.
3. Keep changes consistent with the existing Expo Router and TypeScript structure.
4. Run linting and test relevant flows on the target platform.
5. Open a pull request describing the change and how it was tested.

## License

This repository includes an MIT license. Read the [`LICENSE`](LICENSE) file for the exact terms.

## Links

- **Repository:** https://github.com/Codewithajoydas/Photomart
- **Expo documentation:** https://docs.expo.dev/
- **Expo Router documentation:** https://docs.expo.dev/router/introduction/
- **React Native documentation:** https://reactnative.dev/docs/getting-started

---

<div align="center">

Made by **[Ajoy Das](https://github.com/Codewithajoydas)**

</div>

# Create Native Android App Project

This plan outlines the steps to create a fully functional Android Studio project within the `android-app/` directory, using the Kotlin source code blueprint found in the React project.

## Proposed Changes

### Project Structure & Configuration
- Create `android-app/` root directory.
- Setup Gradle wrapper and properties.
- Create `settings.gradle.kts` and project-level `build.gradle.kts`.
- Setup Version Catalog (`gradle/libs.versions.toml`).

### App Module
- Create `android-app/app/build.gradle.kts`.
- Create `android-app/app/src/main/AndroidManifest.xml`.
- Setup resource files (strings, themes, icons).

### Source Code Migration
- Migrate Kotlin files from the React project's `ANDROID_KOTLIN_FILES` data to their respective packages in `android-app/app/src/main/java/com/pocketmystic/app/`.
    - `MainActivity.kt`
    - `MysticViewModel.kt`
    - `ShakeToDrawScreen.kt`
    - `DeckImporter.kt`
    - `JournalEntities.kt`
    - `ShakeDetector.kt`
    - `HapticManager.kt`
    - `PhotoDeckImporter.kt`

## Verification Plan
- The project should be openable in Android Studio.
- Gradle sync should succeed.
- The app should build successfully.

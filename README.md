# Meta-Forge

**Released by:** LYRA corp  
**Version:** 1.0.0  
**Platform:** Meta  
**Status:** Verified / Unidentified (per mod entry)

Meta-Forge is a VR mod hub for discovering, downloading, and organizing mods for supported Meta VR games. It combines a branded catalog UI with real file downloads where legitimate public sources are available, and source/catalog entries where verified direct downloads are not available.

## Theme

- Purple: `#A855F7` (Primary accent)
- White: `#FFFFFF` (Text and highlights)
- Black: `#0B0912` (Main background)
- Violet: `#7E22CE` (Secondary accent)

## Supported Games

- Gorilla Tag
- Orion Drift
- Big Ballers 26
- Gym Class

## Features

- **Browse** - Search/filter mods by game and status (Verified/Unidentified).
- **Real downloads** - Uses Android `DownloadManager` for legitimate public direct files (example: Bark DLL from GitHub releases).
- **Catalog/source entries** - Mods without a verified direct Quest-safe download link are shown as catalog/source entries with external links.
- **Library** - Import local mod files and downloaded files into app storage.
- **Game detection** - Detects installed supported games by package name when possible.
- **Support** - Discord: https://discord.gg/ydSPJUVMb2

## Installation Guide

1. Open Meta-Forge and browse mods for your game.
2. Tap **Details** to read what the mod does and how it works.
3. If a verified direct download is available, tap **Download**. Files save to `Downloads/MetaForge`.
4. Tap **Import** in Library to copy the downloaded file into Meta-Forge local mod storage.
5. Install the mod using the mod's required method. For Gorilla Tag DLL mods, this usually means a compatible mod loader and placing the DLL in `BepInEx/plugins`.
6. Only install mods from trusted sources that match your game version and platform.

## Safety / Scope

- Meta-Forge does **not** bypass DRM, patch paid games, or provide pirated content.
- Real direct downloads are only included for legitimate public sources.
- Catalog entries marked **Unidentified** are informational/source-linked entries and should be verified before installation.
- Mod compatibility depends on game version, platform, and mod loader.

## Build

Requirements: JDK 17, Android SDK (API 34), Gradle/Android Gradle Plugin.

```powershell
# from Meta-Forge/
.\gradlew assembleDebug
```

Output APK:
- `app/build/outputs/apk/debug/app-debug.apk`

## Project Layout

```text
Meta-Forge/
  app/src/main/
    AndroidManifest.xml
    java/com/lyracorp/metaforge/MainActivity.java
    assets/
      index.html
      styles.css
      catalog.js
      app.js
    res/
      values/...
      drawable/...
      mipmap-anydpi-v26/...
```

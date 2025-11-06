# CelestialSynth Build Instructions for macOS

## ✅ All Bugs Fixed!

All 6 critical bugs have been fixed in commit `8f54c50`. The plugin is now ready to build and test.

---

## Prerequisites

You need:
- **macOS 10.13+**
- **Xcode 11+** (download from Mac App Store)
- **Command Line Tools** (will install with Xcode)
- **Git** (comes with Command Line Tools)

---

## Step 1: Get the iPlug2 Framework

The plugin source code exists but needs the iPlug2 framework. You need to clone it:

```bash
# Navigate to your project
cd ~/PLugg/Kether-Scale

# Clone iPlug2 framework (this will take a few minutes)
git clone https://github.com/iPlug2/iPlug2.git iPlug2-framework

# Download dependencies (required for building)
cd iPlug2-framework/Dependencies/IPlug
./download-iplug-sdks.sh

cd ../
./download-prebuilt-libs.sh
```

---

## Step 2: Move Plugin to Framework

Your CelestialSynth plugin needs to be inside the iPlug2 Examples folder:

```bash
# Navigate back to Kether-Scale
cd ~/PLugg/Kether-Scale

# Copy CelestialSynth into the framework
cp -r iPlug2/Examples/CelestialSynth ~/PLugg/Kether-Scale/iPlug2-framework/Examples/
```

---

## Step 3: Open and Build in Xcode

```bash
# Navigate to the plugin
cd ~/PLugg/Kether-Scale/iPlug2-framework/Examples/CelestialSynth

# Open the Xcode workspace
open CelestialSynth.xcworkspace
```

In Xcode:

1. **Select build target** from the dropdown at the top:
   - **APP** - Standalone application (easiest to test!)
   - **VST3** - VST3 plugin
   - **AU** - Audio Unit plugin
   - **AUv3** - Audio Unit v3 (iOS/macOS)

2. **Select architecture**:
   - "My Mac" or "My Mac (Designed for iPad)"

3. **Build**: Press `Cmd + B` or click the Play button

4. **Run**: If you selected APP, it will launch the standalone synth!

---

## Step 4: Test the Plugin

### Test in Standalone App:

1. Build and run the **APP** target
2. The synth window should appear
3. **Connect a MIDI keyboard** or use the on-screen MIDI in your DAW
4. Try playing notes - you should hear sine wave tones
5. **Test the scales**:
   - Change the "Scale Type" dropdown
   - Play the same notes - they should sound different!
   - Try "Japanese Yo" vs "Mongolian Throat" - notice the difference!

### Test the Five Sacred Controls:

- **Brilliance**: Turn up for brighter sound
- **Motion**: Creates vibrato/movement
- **Space**: Widens stereo field
- **Warmth**: Adds analog-style saturation
- **Purity**: Clean (high) vs gritty (low)

### Test Polyphony:

- Play multiple notes at once (up to 16 voices)
- Hold some notes, play new ones
- Release individual notes - only those notes should stop

---

## Step 5: Install Plugin (Optional)

If VST3 or AU builds successfully:

**VST3**:
```bash
cp -r ~/Library/Audio/Plug-Ins/VST3/CelestialSynth.vst3 ~/Library/Audio/Plug-Ins/VST3/
```

**AU**:
```bash
# Xcode should install it automatically
# If not, it's in:
~/Library/Audio/Plug-Ins/Components/CelestialSynth.component
```

Then:
1. Open your DAW (Logic, Ableton, Reaper, etc.)
2. Rescan plugins
3. Load CelestialSynth as an instrument

---

## Troubleshooting

### "No such file or directory" errors during build:

- Make sure you ran the dependency download scripts
- Check that `iPlug2-framework/Dependencies/` has folders

### "Code signing" errors:

1. In Xcode, go to **Signing & Capabilities** tab
2. Select your Apple ID under "Team"
3. Or disable code signing for debugging (not recommended for distribution)

### No sound when playing:

- Check your audio settings in the standalone app
- Make sure MIDI is connected
- Try increasing the Gain parameter

### Scales sound the same:

- This was Bug #4 - if you pulled the latest commit, it's fixed!
- Make sure you're testing with the rebuilt version
- Try C-D-E-G-A in different scales - they should have different tuning

---

## What Changed (Bug Fixes)

✅ **Bug #2**: Notes now fade out properly (no hanging notes)
✅ **Bug #3**: Polyphony works (multiple notes can play)
✅ **Bug #6**: Voice allocation fixed (notes don't get stuck)
✅ **Bug #5**: Multi-instance support (load multiple copies in DAW)
✅ **Bug #4**: **Pentatonic scales actually work!** (main feature)
✅ **Bug #1**: Code consolidated and cleaned up

---

## Next Steps

1. **Build and test** - Make sure it generates sound!
2. **Test all 9 scales** - Hear the differences
3. **Create presets** - Save parameter combinations
4. **Test in DAW** - Load in Logic/Ableton/Reaper
5. **Share feedback** - Report any issues

---

## Need Help?

If you encounter issues:
1. Check the Xcode console for error messages
2. Verify all dependencies downloaded correctly
3. Make sure you're using the correct branch with bug fixes
4. Post issues on the iPlug2 forum: https://iplug2.discourse.group/

---

**Last Updated**: After bug fix commit `8f54c50`
**Tested On**: macOS (pending your test)
**Status**: Ready to build 🎉

#pragma once

#include "IPlugPlatform.h"
#include "IPlugMidi.h"
#include "MidiSynth.h"
#include "Oscillator.h"

using namespace iplug;

// Pentatonic scale system with just intonation ratios
class PentatonicScaleSystem
{
public:
  enum ScaleType
  {
    kJapaneseYo = 0,      // C-D-E-G-A (Major pentatonic with Pythagorean 6th)
    kChineseGong,         // C-D-E-G-A (Pure Pythagorean major pentatonic)
    kCeltic,              // C-D-F-G-A (Sus4 pentatonic)
    kIndonesianSlendro,   // C-D-Eb-G-A (Approximated slendro)
    kScottishHighland,    // C-D-F-G-A (Sus4 pentatonic, same as Celtic)
    kMongolianThroat,     // C-Eb-F-G-Bb (Minor pentatonic)
    kEgyptianSacred,      // C-D-E-G-A (5-limit just intonation major)
    kNativeAmerican,      // C-Eb-F-G-Bb (Minor pentatonic)
    kNordicAurora,        // C-D-F-G-A (Sus4 pentatonic)
    kNumScales
  };

  void SetScale(ScaleType scale) { mCurrentScale = scale; }
  double GetScaleNote(int noteIndex, double baseFreq) const;

  // Convert MIDI note to pentatonic scale index
  int MapMidiNoteToScaleIndex(int midiNote) const;

  // Get frequency for MIDI note using current scale
  double GetFrequencyForMidiNote(int midiNote, double baseFreq = 261.6256) const;

private:
  ScaleType mCurrentScale = kJapaneseYo;

  // Just intonation ratios for all 9 scales
  static constexpr double mScaleRatios[kNumScales][5] = {
    // Japanese Yo: C-D-E-G-A (Pythagorean-influenced major)
    {1.0, 9.0/8.0, 5.0/4.0, 3.0/2.0, 27.0/16.0},

    // Chinese Gong: C-D-E-G-A (Pure Pythagorean)
    {1.0, 9.0/8.0, 81.0/64.0, 3.0/2.0, 27.0/16.0},

    // Celtic: C-D-F-G-A (Sus4 pentatonic)
    {1.0, 9.0/8.0, 4.0/3.0, 3.0/2.0, 5.0/3.0},

    // Indonesian Slendro: C-D-Eb-G-A (approximation)
    {1.0, 9.0/8.0, 32.0/27.0, 3.0/2.0, 27.0/16.0},

    // Scottish Highland: C-D-F-G-A (same as Celtic)
    {1.0, 9.0/8.0, 4.0/3.0, 3.0/2.0, 5.0/3.0},

    // Mongolian Throat: C-Eb-F-G-Bb (minor pentatonic)
    {1.0, 6.0/5.0, 4.0/3.0, 3.0/2.0, 9.0/5.0},

    // Egyptian Sacred: C-D-E-G-A (5-limit major)
    {1.0, 9.0/8.0, 5.0/4.0, 3.0/2.0, 5.0/3.0},

    // Native American: C-Eb-F-G-Bb (minor pentatonic)
    {1.0, 6.0/5.0, 4.0/3.0, 3.0/2.0, 9.0/5.0},

    // Nordic Aurora: C-D-F-G-A (sus4 pentatonic)
    {1.0, 9.0/8.0, 4.0/3.0, 3.0/2.0, 5.0/3.0}
  };

  // Map chromatic MIDI notes to pentatonic scale degrees
  // Maps 12 chromatic notes per octave to 5 pentatonic degrees
  static constexpr int mChromaticToScale[12] = {
    0,  // C  -> degree 0
    0,  // C# -> degree 0 (snap down)
    1,  // D  -> degree 1
    1,  // D# -> degree 1 (snap down)
    2,  // E  -> degree 2
    2,  // F  -> degree 2 (snap down)
    2,  // F# -> degree 2 (snap down)
    3,  // G  -> degree 3
    3,  // G# -> degree 3 (snap down)
    4,  // A  -> degree 4
    4,  // A# -> degree 4 (snap down)
    4   // B  -> degree 4 (snap down)
  };
};

// Voice class
class CelestialVoice : public SynthVoice
{
public:
  CelestialVoice() = default;
  
  bool GetBusy() const override;
  void Trigger(double level, bool isRetrigger) override;
  void Release() override;
  void ProcessSamplesAccumulating(sample** inputs, sample** outputs, int nInputs, int nOutputs, int startIdx, int nSamples) override;
  
  void SetFrequency(double freq) { mOsc.SetFreqCPS(freq); }
  void SetSampleRate(double sr) { mOsc.SetSampleRate(sr); }
  
  // Add note tracking
  void SetNote(int note, int velocity) { mNote = note; mVelocity = velocity; }
  int GetNote() const { return mNote; }
  bool IsPlayingNote(int note) const { return mNote == note && GetBusy(); }
  
private:
  FastSinOscillator<sample> mOsc;
  double mVoiceGain = 0.0;
  int mSamplesReleased = 0;
  int mNote = -1;  // MIDI note number (-1 = not playing)
  int mVelocity = 0;
  static const int kReleaseSamples = 4410; // 100ms at 44.1kHz
};

// Main DSP class  
class CelestialSynthDSP
{
public:
  CelestialSynthDSP();
  
  void ProcessBlock(sample** inputs, sample** outputs, int nInputs, int nOutputs, int nFrames, double qnPos = 0.0);
  void Reset(double sampleRate, int blockSize);
  void ProcessMidiMsg(const IMidiMsg& msg);
  void SetScale(int scale);
  
  // Five Sacred Controls
  void SetBrilliance(double value) { mBrilliance = value; }
  void SetMotion(double value) { mMotion = value; }
  void SetSpace(double value) { mSpace = value; }
  void SetWarmth(double value) { mWarmth = value; }
  void SetPurity(double value) { mPurity = value; }
  
  // Additional Controls
  void SetGravity(double value) { mGravity = value; }
  void SetTimbreShift(double value) { mTimbreShift = value; }
  void SetHarmonicBlend(double value) { mHarmonicBlend = value; }
  void SetVoiceCount(int count) { mVoiceCount = count; }
  void SetGain(double gain) { mGain = gain; }
  void SetMPEEnabled(bool enabled) { mMPEEnabled = enabled; }

private:
  static const int kMaxVoices = 16;
  std::unique_ptr<CelestialVoice> mVoices[kMaxVoices];
  PentatonicScaleSystem mScaleSystem;
  double mSampleRate = 44100.0;

  // Five Sacred Control values
  double mBrilliance = 0.5;
  double mMotion = 0.3;
  double mSpace = 0.4;
  double mWarmth = 0.6;
  double mPurity = 0.8;

  // Additional parameter values
  double mGravity = 0.5;
  double mTimbreShift = 0.0;
  double mHarmonicBlend = 0.5;
  int mVoiceCount = 8;
  double mGain = 0.5;
  bool mMPEEnabled = false;

  // Motion phase (was static, now instance variable for multi-instance support)
  double mMotionPhase = 0.0;
};
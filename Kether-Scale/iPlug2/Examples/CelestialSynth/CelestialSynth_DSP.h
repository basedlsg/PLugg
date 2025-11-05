#pragma once

#include "IPlugPlatform.h"
#include "IPlugMidi.h"
#include "MidiSynth.h"
#include "Oscillator.h"

using namespace iplug;

// Pentatonic scale system
class PentatonicScaleSystem
{
public:
  enum ScaleType
  {
    kJapaneseYo = 0,      // C-D-F-G-A (1-2-5-7-9)
    kChineseGong,         // C-D-E-G-A (1-2-4-7-9)
    kCeltic,              // C-D-F-G-Bb (1-2-5-7-10)
    kIndonesianSlendro,   // C-D-Eb-G-A (1-2-3-7-9)
    kScottishHighland,    // C-D-F-G-A (1-2-5-7-9)
    kMongolianThroat,     // C-Eb-F-G-Bb (1-3-5-7-10)
    kEgyptianSacred,      // C-D-E-G-A (1-2-4-7-9)
    kNativeAmerican,      // C-Eb-F-G-Bb (1-3-5-7-10)
    kNordicAurora,        // C-D-F-G-A (1-2-5-7-9)
    kNumScales
  };
  
  void SetScale(ScaleType scale) { mCurrentScale = scale; }
  double GetScaleNote(int noteIndex, double baseFreq) const;
  
private:
  ScaleType mCurrentScale = kJapaneseYo;
  double mScaleRatios[5] = {1.0, 9.0/8.0, 4.0/3.0, 3.0/2.0, 5.0/3.0};
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
};
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

// Waveform types
enum class WaveformType
{
  kSine = 0,
  kSaw,
  kSquare,
  kTriangle,
  kNumWaveforms
};

// Simple ADSR envelope
class ADSREnvelope
{
public:
  void SetSampleRate(double sr) { mSampleRate = sr; }
  void SetAttack(double ms) { mAttackSamples = (ms / 1000.0) * mSampleRate; }
  void SetDecay(double ms) { mDecaySamples = (ms / 1000.0) * mSampleRate; }
  void SetSustain(double level) { mSustainLevel = level; }
  void SetRelease(double ms) { mReleaseSamples = (ms / 1000.0) * mSampleRate; }

  void Trigger()
  {
    mStage = kAttack;
    mEnvelopeValue = 0.0;
    mSampleCount = 0;
  }

  void Release()
  {
    mStage = kRelease;
    mReleaseStart = mEnvelopeValue;
    mSampleCount = 0;
  }

  double Process()
  {
    switch (mStage)
    {
      case kAttack:
        if (mAttackSamples > 0)
          mEnvelopeValue = (double)mSampleCount / mAttackSamples;
        else
          mEnvelopeValue = 1.0;

        if (++mSampleCount >= mAttackSamples)
        {
          mStage = kDecay;
          mSampleCount = 0;
          mEnvelopeValue = 1.0;
        }
        break;

      case kDecay:
        if (mDecaySamples > 0)
          mEnvelopeValue = 1.0 - ((1.0 - mSustainLevel) * ((double)mSampleCount / mDecaySamples));
        else
          mEnvelopeValue = mSustainLevel;

        if (++mSampleCount >= mDecaySamples)
        {
          mStage = kSustain;
          mEnvelopeValue = mSustainLevel;
        }
        break;

      case kSustain:
        mEnvelopeValue = mSustainLevel;
        break;

      case kRelease:
        if (mReleaseSamples > 0)
          mEnvelopeValue = mReleaseStart * (1.0 - ((double)mSampleCount / mReleaseSamples));
        else
          mEnvelopeValue = 0.0;

        mSampleCount++;
        if (mEnvelopeValue <= 0.001)
        {
          mEnvelopeValue = 0.0;
          mStage = kIdle;
        }
        break;

      case kIdle:
        mEnvelopeValue = 0.0;
        break;
    }

    return mEnvelopeValue;
  }

  bool IsActive() const { return mStage != kIdle; }

private:
  enum Stage { kIdle, kAttack, kDecay, kSustain, kRelease };
  Stage mStage = kIdle;
  double mSampleRate = 44100.0;
  double mAttackSamples = 441.0;   // 10ms default
  double mDecaySamples = 2205.0;   // 50ms default
  double mSustainLevel = 0.7;      // 70% default
  double mReleaseSamples = 8820.0; // 200ms default
  double mEnvelopeValue = 0.0;
  double mReleaseStart = 0.0;
  int mSampleCount = 0;
};

// Simple lowpass filter
class SimpleLowpassFilter
{
public:
  void SetSampleRate(double sr) { mSampleRate = sr; }

  void SetCutoff(double freq)
  {
    double omega = 2.0 * 3.14159265359 * freq / mSampleRate;
    mCoeff = std::exp(-omega);
  }

  void SetResonance(double res) { mResonance = res; }

  double Process(double input)
  {
    mZ1 = input * (1.0 - mCoeff) + mZ1 * mCoeff;
    return mZ1;
  }

  void Reset() { mZ1 = 0.0; }

private:
  double mSampleRate = 44100.0;
  double mCoeff = 0.99;
  double mResonance = 0.0;
  double mZ1 = 0.0;
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

  void SetFrequency(double freq);
  void SetSampleRate(double sr);
  void SetWaveform(WaveformType wf) { mWaveform = wf; }
  void SetFilterCutoff(double cutoff) { mFilter.SetCutoff(cutoff); }
  void SetFilterResonance(double res) { mFilter.SetResonance(res); }

  // ADSR control
  void SetAttack(double ms) { mEnvelope.SetAttack(ms); }
  void SetDecay(double ms) { mEnvelope.SetDecay(ms); }
  void SetSustain(double level) { mEnvelope.SetSustain(level); }
  void SetReleaseTime(double ms) { mEnvelope.SetRelease(ms); }

  // Add note tracking
  void SetNote(int note, int velocity) { mNote = note; mVelocity = velocity; }
  int GetNote() const { return mNote; }
  bool IsPlayingNote(int note) const { return mNote == note && GetBusy(); }

private:
  double GenerateWaveform();

  FastSinOscillator<sample> mOsc;
  SimpleLowpassFilter mFilter;
  ADSREnvelope mEnvelope;
  WaveformType mWaveform = WaveformType::kSine;

  double mFrequency = 440.0;
  double mPhase = 0.0;
  double mPhaseIncrement = 0.0;
  double mSampleRate = 44100.0;

  double mVoiceGain = 0.0;
  int mNote = -1;
  int mVelocity = 0;
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
  
  // Synthesis Controls
  void SetWaveform(int wf);
  void SetFilterCutoff(double value) { mFilterCutoff = value; }
  void SetFilterResonance(double value) { mFilterResonance = value; }
  void SetAttack(double value) { mAttack = value; }
  void SetDecay(double value) { mDecay = value; }
  void SetSustain(double value) { mSustain = value; }
  void SetReleaseTime(double value) { mRelease = value; }

  // Effects
  void SetReverbMix(double value) { mReverbMix = value; }
  void SetDelayTime(double value) { mDelayTime = value; }
  void SetDelayFeedback(double value) { mDelayFeedback = value; }
  void SetDelayMix(double value) { mDelayMix = value; }

  // Additional Controls
  void SetTimbreShift(double value) { mTimbreShift = value; }
  void SetVoiceCount(int count) { mVoiceCount = count; }
  void SetGain(double gain) { mGain = gain; }

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

  // Synthesis parameters
  WaveformType mWaveform = WaveformType::kSine;
  double mFilterCutoff = 20000.0;  // Hz
  double mFilterResonance = 0.0;
  double mAttack = 10.0;           // ms
  double mDecay = 50.0;            // ms
  double mSustain = 0.7;           // 0-1
  double mRelease = 200.0;         // ms

  // Effect parameters
  double mReverbMix = 0.3;
  double mDelayTime = 250.0;       // ms
  double mDelayFeedback = 0.3;
  double mDelayMix = 0.2;

  // Simple delay buffer
  static const int kMaxDelayBufferSize = 88200; // 2 seconds at 44.1kHz
  double mDelayBufferL[kMaxDelayBufferSize];
  double mDelayBufferR[kMaxDelayBufferSize];
  int mDelayWritePos = 0;

  // Additional parameter values
  double mTimbreShift = 0.0;
  int mVoiceCount = 8;
  double mGain = 0.5;

  // Motion phase (was static, now instance variable for multi-instance support)
  double mMotionPhase = 0.0;
};
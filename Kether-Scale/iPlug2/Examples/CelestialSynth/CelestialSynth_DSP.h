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

// State variable filter with working resonance (2-pole, 12dB/octave)
class SimpleLowpassFilter
{
public:
  void SetSampleRate(double sr)
  {
    mSampleRate = sr;
    UpdateCoefficients();
  }

  void SetCutoff(double freq)
  {
    mCutoff = std::max(20.0, std::min(freq, mSampleRate * 0.49)); // Clamp to valid range
    UpdateCoefficients();
  }

  void SetResonance(double res)
  {
    mResonance = res; // 0.0 to 1.0 range
    UpdateCoefficients();
  }

  double Process(double input)
  {
    // Chamberlin state variable filter
    // This actually implements resonance properly!
    mLowpass = mLowpass + mF * mBandpass;
    mHighpass = input - mLowpass - mQ * mBandpass;
    mBandpass = mBandpass + mF * mHighpass;

    return mLowpass; // Return lowpass output
  }

  void Reset()
  {
    mLowpass = 0.0;
    mBandpass = 0.0;
    mHighpass = 0.0;
  }

private:
  void UpdateCoefficients()
  {
    // Calculate filter coefficients
    // f = 2 * sin(π * cutoff / sampleRate)
    double omega = 3.14159265359 * mCutoff / mSampleRate;
    mF = 2.0 * std::sin(omega);

    // Q = resonance amount (0.5 = no resonance, 10.0 = self-oscillation)
    // Map user's 0-1 range to 0.5-10.0 range
    mQ = 0.5 + (mResonance * 9.5);
    // Invert Q for the algorithm (higher Q = less damping)
    mQ = 1.0 / mQ;
  }

  double mSampleRate = 44100.0;
  double mCutoff = 20000.0;
  double mResonance = 0.0;

  // Filter coefficients
  double mF = 1.0;  // Frequency coefficient
  double mQ = 1.0;  // Resonance coefficient (inverted)

  // Filter state
  double mLowpass = 0.0;
  double mBandpass = 0.0;
  double mHighpass = 0.0;
};

// Simple Schroeder reverb (4 comb filters + 2 allpass filters)
class SimpleReverb
{
public:
  SimpleReverb()
  {
    Reset();
  }

  void SetSampleRate(double sr)
  {
    mSampleRate = sr;
    Reset();
  }

  void Reset()
  {
    // Clear all delay buffers
    std::fill(std::begin(mCombBuffer1), std::end(mCombBuffer1), 0.0);
    std::fill(std::begin(mCombBuffer2), std::end(mCombBuffer2), 0.0);
    std::fill(std::begin(mCombBuffer3), std::end(mCombBuffer3), 0.0);
    std::fill(std::begin(mCombBuffer4), std::end(mCombBuffer4), 0.0);
    std::fill(std::begin(mAllpass1), std::end(mAllpass1), 0.0);
    std::fill(std::begin(mAllpass2), std::end(mAllpass2), 0.0);

    mCombPos1 = mCombPos2 = mCombPos3 = mCombPos4 = 0;
    mAllpassPos1 = mAllpassPos2 = 0;
  }

  double Process(double input)
  {
    // Comb filter delays (in samples at 44.1kHz)
    // These create the reverb tail
    const int combDelay1 = 1557;
    const int combDelay2 = 1617;
    const int combDelay3 = 1491;
    const int combDelay4 = 1422;
    const double combGain = 0.84; // Feedback gain for reverb tail

    // Process 4 parallel comb filters
    double comb1 = mCombBuffer1[mCombPos1];
    mCombBuffer1[mCombPos1] = input + comb1 * combGain;
    mCombPos1 = (mCombPos1 + 1) % combDelay1;

    double comb2 = mCombBuffer2[mCombPos2];
    mCombBuffer2[mCombPos2] = input + comb2 * combGain;
    mCombPos2 = (mCombPos2 + 1) % combDelay2;

    double comb3 = mCombBuffer3[mCombPos3];
    mCombBuffer3[mCombPos3] = input + comb3 * combGain;
    mCombPos3 = (mCombPos3 + 1) % combDelay3;

    double comb4 = mCombBuffer4[mCombPos4];
    mCombBuffer4[mCombPos4] = input + comb4 * combGain;
    mCombPos4 = (mCombPos4 + 1) % combDelay4;

    // Sum comb filter outputs
    double combSum = (comb1 + comb2 + comb3 + comb4) * 0.25;

    // Allpass filter delays (for diffusion)
    const int allpassDelay1 = 225;
    const int allpassDelay2 = 341;
    const double allpassGain = 0.5;

    // First allpass filter
    double allpass1Out = mAllpass1[mAllpassPos1];
    double allpass1In = combSum + allpass1Out * allpassGain;
    mAllpass1[mAllpassPos1] = allpass1In;
    allpass1Out = allpass1Out - allpass1In * allpassGain;
    mAllpassPos1 = (mAllpassPos1 + 1) % allpassDelay1;

    // Second allpass filter
    double allpass2Out = mAllpass2[mAllpassPos2];
    double allpass2In = allpass1Out + allpass2Out * allpassGain;
    mAllpass2[mAllpassPos2] = allpass2In;
    allpass2Out = allpass2Out - allpass2In * allpassGain;
    mAllpassPos2 = (mAllpassPos2 + 1) % allpassDelay2;

    return allpass2Out;
  }

private:
  double mSampleRate = 44100.0;

  // Comb filter buffers
  double mCombBuffer1[1557] = {0};
  double mCombBuffer2[1617] = {0};
  double mCombBuffer3[1491] = {0};
  double mCombBuffer4[1422] = {0};
  int mCombPos1 = 0, mCombPos2 = 0, mCombPos3 = 0, mCombPos4 = 0;

  // Allpass filter buffers
  double mAllpass1[225] = {0};
  double mAllpass2[341] = {0};
  int mAllpassPos1 = 0, mAllpassPos2 = 0;
};

// LFO waveform types
enum class LFOWaveform
{
  kSine = 0,
  kTriangle,
  kSawUp,
  kSawDown,
  kSquare,
  kRandom,  // Sample & Hold (S&H)
  kNumLFOWaveforms
};

// Low Frequency Oscillator for modulation
class LFO
{
public:
  LFO() = default;

  void SetSampleRate(double sr)
  {
    mSampleRate = sr;
    UpdatePhaseIncrement();
  }

  void SetRate(double hz)
  {
    mRateHz = std::max(0.01, std::min(hz, 20.0));  // Clamp to 0.01 Hz - 20 Hz
    UpdatePhaseIncrement();
  }

  void SetWaveform(LFOWaveform wf) { mWaveform = wf; }
  void SetBipolar(bool bipolar) { mBipolar = bipolar; }

  void Reset()
  {
    mPhase = 0.0;
    mRandomValue = 0.0;
    mPreviousPhase = 0.0;
  }

  double Process()
  {
    double output = 0.0;

    switch (mWaveform)
    {
      case LFOWaveform::kSine:
        output = std::sin(mPhase * 2.0 * 3.14159265359);
        break;

      case LFOWaveform::kTriangle:
        // Triangle wave: rises from -1 to +1, then falls back
        if (mPhase < 0.5)
          output = (mPhase * 4.0) - 1.0;  // Rising: -1 to +1
        else
          output = 3.0 - (mPhase * 4.0);  // Falling: +1 to -1
        break;

      case LFOWaveform::kSawUp:
        // Sawtooth rising from -1 to +1
        output = (mPhase * 2.0) - 1.0;
        break;

      case LFOWaveform::kSawDown:
        // Sawtooth falling from +1 to -1
        output = 1.0 - (mPhase * 2.0);
        break;

      case LFOWaveform::kSquare:
        // Square wave: alternates between +1 and -1
        output = (mPhase < 0.5) ? 1.0 : -1.0;
        break;

      case LFOWaveform::kRandom:
        // Sample & Hold: generate new random value when phase wraps
        if (mPhase < mPreviousPhase)  // Phase wrapped around
        {
          // Generate random value between -1 and +1
          mRandomValue = ((double)rand() / RAND_MAX) * 2.0 - 1.0;
        }
        output = mRandomValue;
        break;
    }

    mPreviousPhase = mPhase;

    // Advance phase
    mPhase += mPhaseIncrement;
    if (mPhase >= 1.0)
      mPhase -= 1.0;

    // Convert to unipolar if needed (0 to 1)
    if (!mBipolar)
      output = (output + 1.0) * 0.5;

    return output;
  }

private:
  void UpdatePhaseIncrement()
  {
    mPhaseIncrement = mRateHz / mSampleRate;
  }

  double mSampleRate = 44100.0;
  double mRateHz = 1.0;  // Default 1 Hz
  double mPhase = 0.0;
  double mPhaseIncrement = 0.0;
  double mPreviousPhase = 0.0;
  double mRandomValue = 0.0;
  LFOWaveform mWaveform = LFOWaveform::kSine;
  bool mBipolar = true;  // Default bipolar (-1 to +1)
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

  // PolyBLEP anti-aliasing correction
  // Removes discontinuities that cause aliasing in saw/square/triangle waves
  double PolyBLEP(double t, double dt)
  {
    // t = current phase position (0-1)
    // dt = phase increment per sample

    // Discontinuity at t=0 (phase wraparound)
    if (t < dt)
    {
      t = t / dt;
      return t + t - t * t - 1.0;
    }
    // Discontinuity at t=1 (phase wraparound)
    else if (t > 1.0 - dt)
    {
      t = (t - 1.0) / dt;
      return t * t + t + t + 1.0;
    }

    return 0.0;
  }

  FastSinOscillator<sample> mOsc;
  SimpleLowpassFilter mFilter;
  ADSREnvelope mEnvelope;
  WaveformType mWaveform = WaveformType::kSine;

  double mFrequency = 440.0;
  double mPhase = 0.0;
  double mPhaseIncrement = 0.0;
  double mSampleRate = 44100.0;
  double mTriangleState = 0.0; // Integrator state for triangle waveform

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

  // LFO Controls
  void SetLFO1Rate(double hz) { mLFO1Rate = hz; mLFO1.SetRate(hz); }
  void SetLFO2Rate(double hz) { mLFO2Rate = hz; mLFO2.SetRate(hz); }
  void SetLFO1Waveform(int wf)
  {
    if (wf >= 0 && wf < (int)LFOWaveform::kNumLFOWaveforms)
      mLFO1.SetWaveform(static_cast<LFOWaveform>(wf));
  }
  void SetLFO2Waveform(int wf)
  {
    if (wf >= 0 && wf < (int)LFOWaveform::kNumLFOWaveforms)
      mLFO2.SetWaveform(static_cast<LFOWaveform>(wf));
  }

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

  // Reverb instances (stereo)
  SimpleReverb mReverbL;
  SimpleReverb mReverbR;

  // LFO instances
  LFO mLFO1;
  LFO mLFO2;

  // LFO parameters
  double mLFO1Rate = 1.0;  // Hz (0.01 - 20 Hz)
  double mLFO2Rate = 2.0;  // Hz (0.01 - 20 Hz)

  // Additional parameter values
  double mTimbreShift = 0.0;
  int mVoiceCount = 8;
  double mGain = 0.5;

  // Motion phase (was static, now instance variable for multi-instance support)
  double mMotionPhase = 0.0;
};
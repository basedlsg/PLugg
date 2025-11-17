#include "CelestialSynth_DSP.h"
#include <cmath>

// CelestialSynthDSP constructor
CelestialSynthDSP::CelestialSynthDSP()
{
  // Initialize voices
  for (int i = 0; i < kMaxVoices; i++)
    mVoices[i] = std::make_unique<CelestialVoice>();

  // Clear delay buffers
  std::memset(mDelayBufferL, 0, sizeof(mDelayBufferL));
  std::memset(mDelayBufferR, 0, sizeof(mDelayBufferR));
}

// CelestialVoice waveform generation
double CelestialVoice::GenerateWaveform()
{
  double output = 0.0;

  switch (mWaveform)
  {
    case WaveformType::kSine:
      output = std::sin(mPhase * 2.0 * 3.14159265359);
      break;

    case WaveformType::kSaw:
      output = 2.0 * (mPhase - 0.5);
      break;

    case WaveformType::kSquare:
      output = (mPhase < 0.5) ? 1.0 : -1.0;
      break;

    case WaveformType::kTriangle:
      if (mPhase < 0.5)
        output = 4.0 * mPhase - 1.0;
      else
        output = 3.0 - 4.0 * mPhase;
      break;
  }

  // Advance phase
  mPhase += mPhaseIncrement;
  if (mPhase >= 1.0)
    mPhase -= 1.0;

  return output;
}

void CelestialVoice::SetFrequency(double freq)
{
  mFrequency = freq;
  mPhaseIncrement = freq / mSampleRate;
  mOsc.SetFreqCPS(freq); // Keep for sine wave
}

void CelestialVoice::SetSampleRate(double sr)
{
  mSampleRate = sr;
  mOsc.SetSampleRate(sr);
  mFilter.SetSampleRate(sr);
  mEnvelope.SetSampleRate(sr);
  mPhaseIncrement = mFrequency / mSampleRate;
}

// CelestialVoice implementation
bool CelestialVoice::GetBusy() const
{
  return mEnvelope.IsActive();
}

void CelestialVoice::Trigger(double level, bool isRetrigger)
{
  mVoiceGain = level;
  mEnvelope.Trigger();
  if (!isRetrigger)
  {
    mPhase = 0.0;
    mOsc.Reset();
    mFilter.Reset();
  }
}

void CelestialVoice::Release()
{
  mEnvelope.Release();
}

void CelestialVoice::ProcessSamplesAccumulating(sample** inputs, sample** outputs, int nInputs, int nOutputs, int startIdx, int nSamples)
{
  for (int s = startIdx; s < startIdx + nSamples; s++)
  {
    // Generate waveform
    double oscOutput = (mWaveform == WaveformType::kSine) ? mOsc.Process() : GenerateWaveform();

    // Apply filter
    double filtered = mFilter.Process(oscOutput);

    // Get envelope value
    double envelope = mEnvelope.Process();

    // Apply velocity and envelope
    double sample = filtered * envelope * mVoiceGain;

    // Accumulate to outputs
    for (int c = 0; c < nOutputs; c++)
    {
      outputs[c][s] += sample * 0.3; // Scale output
    }
  }
}

// CelestialSynthDSP implementation
void CelestialSynthDSP::ProcessBlock(sample** inputs, sample** outputs, int nInputs, int nOutputs, int nFrames, double qnPos)
{
  // Clear outputs
  for (int c = 0; c < nOutputs; c++)
  {
    for (int s = 0; s < nFrames; s++)
    {
      outputs[c][s] = 0.0;
    }
  }

  // Limit active voices based on mVoiceCount
  int activeVoices = std::min(mVoiceCount, kMaxVoices);

  // Process active voices
  for (int v = 0; v < activeVoices; v++)
  {
    if (mVoices[v]->GetBusy())
    {
      mVoices[v]->ProcessSamplesAccumulating(inputs, outputs, nInputs, nOutputs, 0, nFrames);
    }
  }

  // Apply Five Sacred Controls processing
  for (int c = 0; c < nOutputs; c++)
  {
    for (int s = 0; s < nFrames; s++)
    {
      double sample = outputs[c][s];

      // BRILLIANCE - High frequency emphasis/filtering
      if (mBrilliance > 0.5)
      {
        sample *= (1.0 + (mBrilliance - 0.5) * 2.0); // Boost for brightness
      }
      else
      {
        sample *= (mBrilliance * 2.0); // Subtle dampening
      }

      // MOTION - Subtle frequency modulation/vibrato
      mMotionPhase += 0.01 * mMotion;
      sample *= (1.0 + std::sin(mMotionPhase) * mMotion * 0.1);

      // SPACE - Stereo width and reverb-like effect
      if (c == 1 && nOutputs > 1) // Right channel
      {
        sample *= (1.0 + mSpace * 0.3);
      }

      // WARMTH - Soft saturation/warmth
      // TODO PHASE 1: Move to per-voice processing for better sound quality
      // (currently causes intermodulation distortion between voices)
      if (mWarmth > 0.1)
      {
        double warmthAmount = mWarmth * 0.5;
        sample = std::tanh(sample * (1.0 + warmthAmount)) / (1.0 + warmthAmount * 0.5);
      }

      // PURITY - Clean/dirty factor
      // TODO PHASE 1: Move to per-voice processing for better sound quality
      // (currently causes intermodulation distortion between voices)
      if (mPurity < 0.9)
      {
        double distortion = (1.0 - mPurity) * 0.2;
        sample = std::tanh(sample * (1.0 + distortion));
      }

      // Apply master gain
      sample *= mGain;

      // Apply delay effect
      if (mDelayMix > 0.01)
      {
        int delaySamples = (int)((mDelayTime / 1000.0) * mSampleRate);
        delaySamples = std::min(delaySamples, kMaxDelayBufferSize - 1);

        int readPos = mDelayWritePos - delaySamples;
        if (readPos < 0) readPos += kMaxDelayBufferSize;

        double delayedSample = (c == 0) ? mDelayBufferL[readPos] : mDelayBufferR[readPos];
        sample = sample * (1.0 - mDelayMix) + delayedSample * mDelayMix;

        // Write to delay buffer with feedback
        if (c == 0)
          mDelayBufferL[mDelayWritePos] = sample + delayedSample * mDelayFeedback;
        else
          mDelayBufferR[mDelayWritePos] = sample + delayedSample * mDelayFeedback;
      }

      // Apply reverb effect (FINALLY IMPLEMENTED!)
      if (mReverbMix > 0.01)
      {
        double reverbSample = (c == 0) ? mReverbL.Process(sample) : mReverbR.Process(sample);
        sample = sample * (1.0 - mReverbMix) + reverbSample * mReverbMix;
      }

      outputs[c][s] = sample;
    }

    // Advance delay write position
    mDelayWritePos++;
    if (mDelayWritePos >= kMaxDelayBufferSize)
      mDelayWritePos = 0;
  }
}

void CelestialSynthDSP::ProcessMidiMsg(const IMidiMsg& msg)
{
  if (msg.StatusMsg() == IMidiMsg::kNoteOn)
  {
    int note = msg.NoteNumber();
    int velocity = msg.Velocity();

    // Handle velocity 0 as note-off (MIDI standard)
    if (velocity == 0)
    {
      for (int v = 0; v < mVoiceCount && v < kMaxVoices; v++)
      {
        if (mVoices[v]->IsPlayingNote(note))
        {
          mVoices[v]->Release();
        }
      }
      return;
    }

    // Find free voice for note-on
    for (int v = 0; v < mVoiceCount && v < kMaxVoices; v++)
    {
      if (!mVoices[v]->GetBusy())
      {
        // Use pentatonic scale system for frequency calculation
        // Base frequency is C4 (MIDI 60) = 261.6256 Hz
        double baseFreq = 261.6256;
        double freq = mScaleSystem.GetFrequencyForMidiNote(note, baseFreq);

        // Apply timbre shift
        freq *= std::pow(2.0, mTimbreShift * 0.1);

        // Set voice parameters
        mVoices[v]->SetFrequency(freq);
        mVoices[v]->SetWaveform(mWaveform);
        mVoices[v]->SetFilterCutoff(mFilterCutoff);
        mVoices[v]->SetFilterResonance(mFilterResonance);
        mVoices[v]->SetAttack(mAttack);
        mVoices[v]->SetDecay(mDecay);
        mVoices[v]->SetSustain(mSustain);
        mVoices[v]->SetReleaseTime(mRelease);
        mVoices[v]->SetNote(note, velocity);

        // Apply velocity scaling with warmth
        double scaledVelocity = (velocity / 127.0) * (0.5 + mWarmth * 0.5);
        mVoices[v]->Trigger(scaledVelocity, false);
        break;
      }
    }
  }
  else if (msg.StatusMsg() == IMidiMsg::kNoteOff)
  {
    int note = msg.NoteNumber();
    // Release only voices playing this specific note
    for (int v = 0; v < mVoiceCount && v < kMaxVoices; v++)
    {
      if (mVoices[v]->IsPlayingNote(note))
      {
        mVoices[v]->Release();
      }
    }
  }
}

void CelestialSynthDSP::Reset(double sampleRate, int blockSize)
{
  mSampleRate = sampleRate;

  // Initialize all voices
  for (int v = 0; v < kMaxVoices; v++)
  {
    mVoices[v]->SetSampleRate(sampleRate);
  }

  // Clear delay buffers
  std::memset(mDelayBufferL, 0, sizeof(mDelayBufferL));
  std::memset(mDelayBufferR, 0, sizeof(mDelayBufferR));
  mDelayWritePos = 0;

  // Initialize reverb
  mReverbL.SetSampleRate(sampleRate);
  mReverbR.SetSampleRate(sampleRate);
  mReverbL.Reset();
  mReverbR.Reset();
}

void CelestialSynthDSP::SetWaveform(int wf)
{
  if (wf >= 0 && wf < (int)WaveformType::kNumWaveforms)
  {
    mWaveform = static_cast<WaveformType>(wf);
  }
}

void CelestialSynthDSP::SetScale(int scale)
{
  if (scale >= 0 && scale < PentatonicScaleSystem::kNumScales)
  {
    mScaleSystem.SetScale(static_cast<PentatonicScaleSystem::ScaleType>(scale));
  }
}

// PentatonicScaleSystem implementation
double PentatonicScaleSystem::GetScaleNote(int noteIndex, double baseFreq) const
{
  // Map note index to scale degree and octave
  int scaleIndex = noteIndex % 5;
  int octave = noteIndex / 5;

  // Get ratio from current scale
  double ratio = mScaleRatios[mCurrentScale][scaleIndex];
  double octaveMultiplier = std::pow(2.0, octave);

  return baseFreq * ratio * octaveMultiplier;
}

int PentatonicScaleSystem::MapMidiNoteToScaleIndex(int midiNote) const
{
  int noteInOctave = midiNote % 12;
  int octave = midiNote / 12;

  int scaleDegree = mChromaticToScale[noteInOctave];
  return (octave * 5) + scaleDegree;
}

double PentatonicScaleSystem::GetFrequencyForMidiNote(int midiNote, double baseFreq) const
{
  // Map MIDI note to scale index
  int scaleIndex = MapMidiNoteToScaleIndex(midiNote);

  // Calculate frequency using scale ratios
  return GetScaleNote(scaleIndex, baseFreq);
}
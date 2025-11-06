#include "CelestialSynth_DSP.h"
#include <cmath>

// CelestialSynthDSP constructor
CelestialSynthDSP::CelestialSynthDSP()
{
  // Initialize voices
  for (int i = 0; i < kMaxVoices; i++)
    mVoices[i] = std::make_unique<CelestialVoice>();
}

// CelestialVoice implementation
bool CelestialVoice::GetBusy() const
{
  // Voice is busy if it has gain AND is either not releasing or still in release phase
  return mVoiceGain > 0.001 && (mSamplesReleased == 0 || mSamplesReleased < kReleaseSamples);
}

void CelestialVoice::Trigger(double level, bool isRetrigger)
{
  mVoiceGain = level;
  mSamplesReleased = 0;
  if (!isRetrigger)
    mOsc.Reset();
}

void CelestialVoice::Release()
{
  // Start release phase (must be > 0 to trigger envelope)
  mSamplesReleased = 1;
}

void CelestialVoice::ProcessSamplesAccumulating(sample** inputs, sample** outputs, int nInputs, int nOutputs, int startIdx, int nSamples)
{
  for (int s = startIdx; s < startIdx + nSamples; s++)
  {
    double envelope = mVoiceGain;

    // Simple release envelope
    if (mSamplesReleased > 0)
    {
      envelope *= 1.0 - (double)mSamplesReleased / kReleaseSamples;
      mSamplesReleased++;

      // Mark as free when release is complete
      if (mSamplesReleased >= kReleaseSamples)
      {
        mVoiceGain = 0.0;
        mNote = -1; // Clear note
      }
    }

    // Generate oscillator output
    double oscOutput = mOsc.Process();

    // Apply envelope and accumulate to outputs
    for (int c = 0; c < nOutputs; c++)
    {
      outputs[c][s] += oscOutput * envelope * 0.3; // Scale output
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
      if (mWarmth > 0.1)
      {
        double warmthAmount = mWarmth * 0.5;
        sample = std::tanh(sample * (1.0 + warmthAmount)) / (1.0 + warmthAmount * 0.5);
      }

      // PURITY - Clean/dirty factor
      if (mPurity < 0.9)
      {
        double distortion = (1.0 - mPurity) * 0.2;
        sample = std::tanh(sample * (1.0 + distortion));
      }

      // Apply master gain
      sample *= mGain;

      outputs[c][s] = sample;
    }
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

        mVoices[v]->SetFrequency(freq);
        mVoices[v]->SetNote(note, velocity); // Track which note this voice is playing

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
#include "CelestialSynth_DSP.h"
#include <cmath>

// CelestialVoice implementation
bool CelestialVoice::GetBusy() const
{
  return mVoiceGain > 0.001 || mSamplesReleased < kReleaseSamples;
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
  // Start release phase
  mSamplesReleased = 0;
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
    }
    
    // Generate oscillator output
    double oscOutput = mOsc.Process();
    
    // Apply envelope and accumulate to outputs
    for (int c = 0; c < nOutputs; c++)
    {
      outputs[c][s] += oscOutput * envelope;
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
  
  // Process all voices
  for (int v = 0; v < kMaxVoices; v++)
  {
    if (mVoices[v]->GetBusy())
    {
      mVoices[v]->ProcessSamplesAccumulating(inputs, outputs, nInputs, nOutputs, 0, nFrames);
    }
  }
}

void CelestialSynthDSP::ProcessMidiMsg(const IMidiMsg& msg)
{
  // Simple MIDI handling
  if (msg.StatusMsg() == IMidiMsg::kNoteOn)
  {
    int note = msg.NoteNumber();
    double velocity = msg.Velocity() / 127.0;
    
    // Find free voice
    for (int v = 0; v < kMaxVoices; v++)
    {
      if (!mVoices[v]->GetBusy())
      {
        double freq = 440.0 * std::pow(2.0, (note - 69) / 12.0);
        mVoices[v]->SetFrequency(freq);
        mVoices[v]->Trigger(velocity, false);
        break;
      }
    }
  }
  else if (msg.StatusMsg() == IMidiMsg::kNoteOff)
  {
    // Release matching voices
    for (int v = 0; v < kMaxVoices; v++)
    {
      if (mVoices[v]->GetBusy())
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
  // Simple pentatonic scale mapping
  int scaleIndex = noteIndex % 5;
  int octave = noteIndex / 5;
  
  double ratio = mScaleRatios[scaleIndex];
  double octaveMultiplier = std::pow(2.0, octave);
  
  return baseFreq * ratio * octaveMultiplier;
}
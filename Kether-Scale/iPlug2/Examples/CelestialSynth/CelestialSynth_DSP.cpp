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

// CelestialVoice waveform generation with PolyBLEP anti-aliasing
double CelestialVoice::GenerateWaveform()
{
  double output = 0.0;

  switch (mWaveform)
  {
    case WaveformType::kSine:
      // Sine is already bandlimited, no correction needed
      output = std::sin(mPhase * 2.0 * 3.14159265359);
      break;

    case WaveformType::kSaw:
      // Naive sawtooth
      output = 2.0 * (mPhase - 0.5);
      // Apply PolyBLEP correction at discontinuity
      output -= PolyBLEP(mPhase, mPhaseIncrement);
      break;

    case WaveformType::kSquare:
      // Naive square wave
      output = (mPhase < 0.5) ? 1.0 : -1.0;
      // Apply PolyBLEP correction at both transitions (0→1 and 1→0)
      output += PolyBLEP(mPhase, mPhaseIncrement);           // Transition at phase=0
      output -= PolyBLEP(fmod(mPhase + 0.5, 1.0), mPhaseIncrement); // Transition at phase=0.5
      break;

    case WaveformType::kTriangle:
      // Triangle is the integrated square wave
      // First generate anti-aliased square
      double square = (mPhase < 0.5) ? 1.0 : -1.0;
      square += PolyBLEP(mPhase, mPhaseIncrement);
      square -= PolyBLEP(fmod(mPhase + 0.5, 1.0), mPhaseIncrement);

      // Integrate to get triangle (leaky integrator)
      output = mPhaseIncrement * square + (1.0 - mPhaseIncrement) * mTriangleState;
      mTriangleState = output;
      // Scale and offset
      output *= 4.0;
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

  // === MODULATION MATRIX: Calculate all modulation sources ===
  // Update modulation source values (once per buffer for MVP)
  mModSourceValues[static_cast<int>(ModSource::kNone)] = 0.0;
  mModSourceValues[static_cast<int>(ModSource::kLFO1)] = mLFO1.Process();  // -1 to +1
  mModSourceValues[static_cast<int>(ModSource::kLFO2)] = mLFO2.Process();  // -1 to +1
  mModSourceValues[static_cast<int>(ModSource::kAmpEnv)] = 0.5;  // Will be set per-voice below
  mModSourceValues[static_cast<int>(ModSource::kVelocity)] = 0.5;  // Will be set per-voice below
  mModSourceValues[static_cast<int>(ModSource::kModWheel)] = mModWheelValue;  // 0 to 1

  // Calculate modulation amounts for each destination (summed from all enabled slots)
  double modPitch = 0.0;
  double modFilterCutoff = 0.0;
  double modFilterRes = 0.0;
  double modAmplitude = 0.0;
  double modPan = 0.0;

  for (int i = 0; i < kNumModSlots; i++)
  {
    const ModulationSlot& slot = mModSlots[i];
    if (!slot.enabled || slot.source == ModSource::kNone || slot.dest == ModDestination::kNone)
      continue;

    // Skip per-voice sources (Velocity, AmpEnv) for now - handled per-voice below
    if (slot.source == ModSource::kVelocity || slot.source == ModSource::kAmpEnv)
      continue;

    double modValue = mModSourceValues[static_cast<int>(slot.source)] * slot.depth;

    switch (slot.dest)
    {
      case ModDestination::kPitch:         modPitch += modValue; break;
      case ModDestination::kFilterCutoff:  modFilterCutoff += modValue; break;
      case ModDestination::kFilterRes:     modFilterRes += modValue; break;
      case ModDestination::kAmplitude:     modAmplitude += modValue; break;
      case ModDestination::kPan:           modPan += modValue; break;
      default: break;
    }
  }

  // Limit active voices based on mVoiceCount
  int activeVoices = std::min(mVoiceCount, kMaxVoices);

  // Apply modulation and process active voices
  for (int v = 0; v < activeVoices; v++)
  {
    if (mVoices[v]->GetBusy())
    {
      // Apply global modulation (from LFOs, ModWheel, etc.)
      double baseFreq = 440.0;  // This will be set properly in note-on
      // Note: We can't easily get the base frequency here, so pitch mod is limited
      // For now, we'll apply filter and amplitude modulation only

      // Apply filter cutoff modulation
      double modulatedCutoff = mFilterCutoff;
      if (modFilterCutoff != 0.0)
      {
        // Modulate cutoff in Hz (exponential for musical response)
        double cutoffMult = std::pow(2.0, modFilterCutoff * 4.0);  // ±4 octaves range
        modulatedCutoff *= cutoffMult;
        modulatedCutoff = std::max(20.0, std::min(modulatedCutoff, 20000.0));
      }
      mVoices[v]->SetFilterCutoff(modulatedCutoff);

      // Apply filter resonance modulation
      double modulatedRes = mFilterResonance + modFilterRes;
      modulatedRes = std::max(0.0, std::min(modulatedRes, 1.0));
      mVoices[v]->SetFilterResonance(modulatedRes);

      // Process voice
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
  else if (msg.StatusMsg() == IMidiMsg::kControlChange)
  {
    int cc = msg.ControlChangeIdx();
    int value = msg.ControlChange(cc);

    // Handle Mod Wheel (MIDI CC 1)
    if (cc == 1)
    {
      mModWheelValue = value / 127.0;  // Normalize to 0.0 - 1.0
    }
  }
}

void CelestialSynthDSP::InitializeDefaultModulations()
{
  // Initialize all slots to empty/disabled
  for (int i = 0; i < kNumModSlots; i++)
  {
    mModSlots[i] = ModulationSlot();
  }

  // Set up some useful default modulation routings
  // These are examples - users can override via parameters later

  // Slot 0: LFO1 -> Filter Cutoff (subtle sweep)
  mModSlots[0] = ModulationSlot(ModSource::kLFO1, ModDestination::kFilterCutoff, 0.3, true);

  // Slot 1: LFO1 -> Pitch (subtle vibrato)
  mModSlots[1] = ModulationSlot(ModSource::kLFO1, ModDestination::kPitch, 0.05, false);  // Disabled by default

  // Slot 2: LFO2 -> Pan (auto-pan)
  mModSlots[2] = ModulationSlot(ModSource::kLFO2, ModDestination::kPan, 0.5, false);  // Disabled by default

  // Slot 3: AmpEnv -> Filter Cutoff (filter follows envelope)
  mModSlots[3] = ModulationSlot(ModSource::kAmpEnv, ModDestination::kFilterCutoff, 0.5, true);

  // Slot 4: Velocity -> Amplitude (velocity sensitivity)
  mModSlots[4] = ModulationSlot(ModSource::kVelocity, ModDestination::kAmplitude, 0.5, true);

  // Slot 5: ModWheel -> Filter Cutoff (expressive filter control)
  mModSlots[5] = ModulationSlot(ModSource::kModWheel, ModDestination::kFilterCutoff, 0.6, false);  // Disabled by default

  // Slots 6-7: Reserved for user routing (disabled by default)
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

  // Initialize LFOs
  mLFO1.SetSampleRate(sampleRate);
  mLFO2.SetSampleRate(sampleRate);
  mLFO1.SetRate(mLFO1Rate);
  mLFO2.SetRate(mLFO2Rate);
  mLFO1.Reset();
  mLFO2.Reset();

  // Initialize modulation matrix with default routings
  InitializeDefaultModulations();
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
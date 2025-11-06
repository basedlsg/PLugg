#pragma once

#include "IPlug_include_in_plug_hdr.h"
#include "CelestialSynth_DSP.h"
#include "ISender.h"

const int kNumPresets = 12;

// Parameters organized by section (professional layout)
enum EParams
{
  // === OSCILLATOR SECTION ===
  kParamWaveform = 0,
  kParamTimbreShift,

  // === FILTER SECTION ===
  kParamFilterCutoff,
  kParamFilterResonance,

  // === ENVELOPE SECTION ===
  kParamAttack,
  kParamDecay,
  kParamSustain,
  kParamRelease,

  // === EFFECTS SECTION ===
  kParamDelayTime,
  kParamDelayFeedback,
  kParamDelayMix,
  kParamReverbMix,

  // === FIVE SACRED CONTROLS (Character) ===
  kParamBrilliance,
  kParamMotion,
  kParamSpace,
  kParamWarmth,
  kParamPurity,

  // === GLOBAL CONTROLS ===
  kParamVoices,
  kParamScaleType,
  kParamGain,

  kNumParams
};

// Scale type enumeration matching DSP
enum EScaleTypes
{
  kScaleJapaneseYo = 0,
  kScaleChineseGong,
  kScaleCeltic,
  kScaleIndonesianSlendro,
  kScaleScottishHighland,
  kScaleMongolianThroat,
  kScaleEgyptianSacred,
  kScaleNativeAmerican,
  kScaleNordicAurora,
  kNumScaleTypes
};

// Control Tags for UI organized by section
enum ECtrlTags
{
  // Oscillator Section
  kCtrlWaveform = 0,
  kCtrlWaveformDisplay,

  // Filter Section
  kCtrlFilterCutoff,
  kCtrlFilterResonance,

  // Envelope Section
  kCtrlAttack,
  kCtrlDecay,
  kCtrlSustain,
  kCtrlRelease,
  kCtrlEnvelopeDisplay,

  // Effects Section
  kCtrlDelayTime,
  kCtrlDelayFeedback,
  kCtrlDelayMix,
  kCtrlReverbMix,

  // Five Sacred Controls
  kCtrlBrilliance,
  kCtrlMotion,
  kCtrlSpace,
  kCtrlWarmth,
  kCtrlPurity,

  // Global Controls
  kCtrlVoices,
  kCtrlScaleType,
  kCtrlGain,
  kCtrlMeter,

  // Preset Section
  kCtrlPresetName,
  kCtrlPresetPrev,
  kCtrlPresetNext,

  kNumCtrlTags
};

using namespace iplug;

class CelestialSynth final : public Plugin
{
public:
  CelestialSynth(const InstanceInfo& info);

#if IPLUG_EDITOR
  void OnMidiMsgUI(const IMidiMsg& msg) override;
#endif
  
#if IPLUG_DSP
public:
  void GetBusName(ERoute direction, int busIdx, int nBuses, WDL_String& str) const override;
  
  void ProcessBlock(sample** inputs, sample** outputs, int nFrames) override;
  void ProcessMidiMsg(const IMidiMsg& msg) override;
  void OnReset() override;
  void OnParamChange(int paramIdx) override;
  bool GetMidiNoteText(int noteNumber, char* text) const override;
  void OnIdle() override;

private:
  CelestialSynthDSP mDSP;
  IPeakSender<2> mMeterSender;
#endif
};
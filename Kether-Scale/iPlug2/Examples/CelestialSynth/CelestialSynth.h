#pragma once

#include "IPlug_include_in_plug_hdr.h"
#include "CelestialSynth_DSP.h"
#include "ISender.h"

const int kNumPresets = 12;

// Five Sacred Controls + Additional Parameters
enum EParams
{
  // Five Sacred Controls
  kParamBrilliance = 0,
  kParamMotion,
  kParamSpace,
  kParamWarmth,
  kParamPurity,
  
  // Additional Synthesis Controls
  kParamGravity,
  kParamTimbreShift,
  kParamHarmonicBlend,
  kParamVoices,
  kParamScaleType,
  
  // Global Controls
  kParamGain,
  kParamMPEEnable,
  
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

// Control Tags for UI
enum ECtrlTags
{
  // Five Sacred Controls
  kCtrlBrilliance = 0,
  kCtrlMotion,
  kCtrlSpace, 
  kCtrlWarmth,
  kCtrlPurity,
  
  // Additional Controls
  kCtrlGravity,
  kCtrlTimbreShift,
  kCtrlHarmonicBlend,
  kCtrlVoices,
  kCtrlScaleType,
  kCtrlGain,
  kCtrlMPE,
  
  // Visual Elements
  kCtrlMeter,
  kCtrlConstellation,
  
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
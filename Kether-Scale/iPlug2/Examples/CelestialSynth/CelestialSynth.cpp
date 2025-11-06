#include "CelestialSynth.h"
#include "IPlug_include_in_plug_src.h"
#include "IControls.h"

using namespace iplug;
using namespace igraphics;

CelestialSynth::CelestialSynth(const InstanceInfo& info)
: Plugin(info, MakeConfig(kNumParams, kNumPresets))
{
  // Initialize parameters - Five Sacred Controls
  GetParam(kParamBrilliance)->InitDouble("Brilliance", 0.5, 0.0, 1.0, 0.01, "");
  GetParam(kParamMotion)->InitDouble("Motion", 0.3, 0.0, 1.0, 0.01, "");
  GetParam(kParamSpace)->InitDouble("Space", 0.4, 0.0, 1.0, 0.01, "");
  GetParam(kParamWarmth)->InitDouble("Warmth", 0.6, 0.0, 1.0, 0.01, "");
  GetParam(kParamPurity)->InitDouble("Purity", 0.8, 0.0, 1.0, 0.01, "");
  
  // Additional synthesis controls
  GetParam(kParamGravity)->InitDouble("Gravity", 0.5, 0.0, 1.0, 0.01, "");
  GetParam(kParamTimbreShift)->InitDouble("Timbre Shift", 0.0, -1.0, 1.0, 0.01, "");
  GetParam(kParamHarmonicBlend)->InitDouble("Harmonic Blend", 0.5, 0.0, 1.0, 0.01, "");
  GetParam(kParamVoices)->InitInt("Voices", 8, 1, 16, "");
  
  // Scale selection
  GetParam(kParamScaleType)->InitEnum("Scale Type", kScaleJapaneseYo, {"Japanese Yo", "Chinese Gong", "Celtic", "Indonesian Slendro", "Scottish Highland", "Mongolian Throat", "Egyptian Sacred", "Native American", "Nordic Aurora"});
  
  // Global controls
  GetParam(kParamGain)->InitDouble("Gain", 0.5, 0.0, 1.0, 0.01, "");
  GetParam(kParamMPEEnable)->InitBool("MPE Enable", false);

#if IPLUG_EDITOR // http://bit.ly/2S64BDd
  mMakeGraphicsFunc = [&]() {
    return MakeGraphics(*this, PLUG_WIDTH, PLUG_HEIGHT, PLUG_FPS, GetScaleForScreen(PLUG_WIDTH, PLUG_HEIGHT));
  };
  
  mLayoutFunc = [&](IGraphics* pGraphics) {
    pGraphics->AttachCornerResizer(EUIResizerMode::Scale, false);
    pGraphics->LoadFont("Roboto-Regular", ROBOTO_FN);
    
    const IRECT bounds = pGraphics->GetBounds();
    const IColor darkBg = IColor(255, 20, 20, 25); // Dark background
    const IColor accentBlue = IColor(255, 100, 200, 255); // Celestial blue
    const IColor accentGold = IColor(255, 255, 215, 138); // Golden accent
    const IColor panelBg = IColor(255, 35, 35, 40); // Dark panel
    
    // Main background
    pGraphics->AttachControl(new IPanelControl(bounds, darkBg));
    
    // Title Section with celestial styling
    pGraphics->AttachControl(new ITextControl(IRECT(0, 20, bounds.W(), 70), "✦ CELESTIAL PENTATONIC SYNTHESIZER ✦", 
      IText(24, accentGold, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));
    
    // Five Sacred Controls Section
    const IRECT sacredSection = IRECT(50, 100, bounds.W() - 50, 350);
    
    // Sacred Controls Panel Background
    pGraphics->AttachControl(new IPanelControl(sacredSection, panelBg));
    
    // Sacred Controls Label
    pGraphics->AttachControl(new ITextControl(IRECT(sacredSection.L + 20, sacredSection.T + 10, sacredSection.R - 20, sacredSection.T + 35), 
      "THE FIVE SACRED CONTROLS", IText(14, accentGold, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));
    
    // Sacred Controls - Beautiful knobs with proper spacing
    const float knobSize = 90;
    const float knobY = sacredSection.T + 50;
    const float spacing = (sacredSection.W() - (5 * knobSize)) / 6;
    
    // Define beautiful knob style
    IVStyle celestialKnobStyle = DEFAULT_STYLE
      .WithColor(kFG, accentBlue)
      .WithColor(kPR, accentBlue.WithOpacity(0.7f))
      .WithColor(kFR, panelBg)
      .WithWidgetFrac(0.8f)
      .WithShowValue(true)
      .WithShowLabel(true)
      .WithLabelText(IText(11, COLOR_WHITE, "Roboto-Regular", EAlign::Center))
      .WithValueText(IText(9, accentBlue, "Roboto-Regular", EAlign::Center));
    
    // Create the five sacred knobs with individual colors
    auto brillianceStyle = celestialKnobStyle.WithColor(kFG, IColor(255, 220, 220, 220));
    auto motionStyle = celestialKnobStyle.WithColor(kFG, IColor(255, 255, 200, 100));
    auto spaceStyle = celestialKnobStyle.WithColor(kFG, IColor(255, 100, 150, 255));
    auto warmthStyle = celestialKnobStyle.WithColor(kFG, IColor(255, 255, 140, 80));
    auto purityStyle = celestialKnobStyle.WithColor(kFG, IColor(255, 180, 100, 255));
    
    pGraphics->AttachControl(new IVKnobControl(IRECT(spacing, knobY, spacing + knobSize, knobY + knobSize), 
                                               kParamBrilliance, "BRILLIANCE", brillianceStyle), kCtrlBrilliance);
                                               
    pGraphics->AttachControl(new IVKnobControl(IRECT(spacing * 2 + knobSize, knobY, spacing * 2 + knobSize * 2, knobY + knobSize), 
                                               kParamMotion, "MOTION", motionStyle), kCtrlMotion);
                                               
    pGraphics->AttachControl(new IVKnobControl(IRECT(spacing * 3 + knobSize * 2, knobY, spacing * 3 + knobSize * 3, knobY + knobSize), 
                                               kParamSpace, "SPACE", spaceStyle), kCtrlSpace);
                                               
    pGraphics->AttachControl(new IVKnobControl(IRECT(spacing * 4 + knobSize * 3, knobY, spacing * 4 + knobSize * 4, knobY + knobSize), 
                                               kParamWarmth, "WARMTH", warmthStyle), kCtrlWarmth);
                                               
    pGraphics->AttachControl(new IVKnobControl(IRECT(spacing * 5 + knobSize * 4, knobY, spacing * 5 + knobSize * 5, knobY + knobSize), 
                                               kParamPurity, "PURITY", purityStyle), kCtrlPurity);
    
    // Additional Controls Section
    const IRECT additionalSection = IRECT(50, 370, bounds.W() - 50, bounds.H() - 30);
    
    // Additional Controls Panel
    pGraphics->AttachControl(new IPanelControl(additionalSection, panelBg));
    
    // Additional Controls Label
    pGraphics->AttachControl(new ITextControl(IRECT(additionalSection.L + 20, additionalSection.T + 10, additionalSection.R - 20, additionalSection.T + 30), 
      "SYNTHESIS PARAMETERS", IText(12, accentGold, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));
    
    // Smaller knobs for additional parameters
    const float smallKnobSize = 55;
    const float colSpacing = 110;
    const float startX = additionalSection.L + 40;
    const float startY = additionalSection.T + 45;
    
    IVStyle smallKnobStyle = DEFAULT_STYLE
      .WithColor(kFG, accentBlue)
      .WithColor(kPR, accentBlue.WithOpacity(0.6f))
      .WithWidgetFrac(0.7f)
      .WithShowValue(false)
      .WithShowLabel(true)
      .WithLabelText(IText(9, COLOR_LIGHT_GRAY, "Roboto-Regular", EAlign::Center));
    
    // Row of additional controls
    pGraphics->AttachControl(new IVKnobControl(IRECT(startX, startY, startX + smallKnobSize, startY + smallKnobSize), 
                                               kParamGravity, "GRAVITY", smallKnobStyle));
                                               
    pGraphics->AttachControl(new IVKnobControl(IRECT(startX + colSpacing, startY, startX + colSpacing + smallKnobSize, startY + smallKnobSize), 
                                               kParamTimbreShift, "TIMBRE", smallKnobStyle));
                                               
    pGraphics->AttachControl(new IVKnobControl(IRECT(startX + colSpacing * 2, startY, startX + colSpacing * 2 + smallKnobSize, startY + smallKnobSize), 
                                               kParamHarmonicBlend, "HARMONICS", smallKnobStyle));
                                               
    pGraphics->AttachControl(new IVKnobControl(IRECT(startX + colSpacing * 3, startY, startX + colSpacing * 3 + smallKnobSize, startY + smallKnobSize), 
                                               kParamVoices, "VOICES", smallKnobStyle));
                                               
    pGraphics->AttachControl(new IVKnobControl(IRECT(startX + colSpacing * 4, startY, startX + colSpacing * 4 + smallKnobSize, startY + smallKnobSize), 
                                               kParamGain, "GAIN", smallKnobStyle));
    
    // Scale selector and MPE toggle in second row
    const float row2Y = startY + 90;
    
    // Scale dropdown - simplified
    pGraphics->AttachControl(new IVMenuButtonControl(IRECT(startX, row2Y, startX + colSpacing * 2 - 10, row2Y + 25), 
                                                      kParamScaleType, "PENTATONIC SCALE", 
                                                      DEFAULT_STYLE.WithColor(kFG, accentGold)), kCtrlScaleType);
    
    // MPE Toggle
    pGraphics->AttachControl(new IVToggleControl(IRECT(startX + colSpacing * 3, row2Y, startX + colSpacing * 4 - 10, row2Y + 25), 
                                                 kParamMPEEnable, "MPE MODE", 
                                                 DEFAULT_STYLE.WithColor(kFG, accentBlue)), kCtrlMPE);
  };
#endif
}

#if IPLUG_EDITOR
void CelestialSynth::OnMidiMsgUI(const IMidiMsg& msg)
{
  // Forward MIDI to DSP if needed for visual feedback
}
#endif

#if IPLUG_DSP
void CelestialSynth::GetBusName(ERoute direction, int busIdx, int nBuses, WDL_String& str) const
{
  if (direction == ERoute::kOutput)
    str.Set("Stereo Out");
  else
    str.Set("MIDI In");
}

void CelestialSynth::ProcessBlock(sample** inputs, sample** outputs, int nFrames)
{
  mDSP.ProcessBlock(inputs, outputs, 0, 2, nFrames, 0.0);
}

void CelestialSynth::ProcessMidiMsg(const IMidiMsg& msg)
{
  TRACE;
  mDSP.ProcessMidiMsg(msg);
}

void CelestialSynth::OnReset()
{
  mDSP.Reset(GetSampleRate(), GetBlockSize());
  
  // Initialize all parameters to their current values
  mDSP.SetBrilliance(GetParam(kParamBrilliance)->Value());
  mDSP.SetMotion(GetParam(kParamMotion)->Value());
  mDSP.SetSpace(GetParam(kParamSpace)->Value());
  mDSP.SetWarmth(GetParam(kParamWarmth)->Value());
  mDSP.SetPurity(GetParam(kParamPurity)->Value());
  mDSP.SetGravity(GetParam(kParamGravity)->Value());
  mDSP.SetTimbreShift(GetParam(kParamTimbreShift)->Value());
  mDSP.SetHarmonicBlend(GetParam(kParamHarmonicBlend)->Value());
  mDSP.SetVoiceCount(GetParam(kParamVoices)->Int());
  mDSP.SetGain(GetParam(kParamGain)->Value());
  mDSP.SetScale(GetParam(kParamScaleType)->Int());
  mDSP.SetMPEEnabled(GetParam(kParamMPEEnable)->Bool());
}

void CelestialSynth::OnParamChange(int paramIdx)
{
  switch (paramIdx)
  {
    case kParamBrilliance:
      mDSP.SetBrilliance(GetParam(paramIdx)->Value());
      break;
    case kParamMotion:
      mDSP.SetMotion(GetParam(paramIdx)->Value());
      break;
    case kParamSpace:
      mDSP.SetSpace(GetParam(paramIdx)->Value());
      break;
    case kParamWarmth:
      mDSP.SetWarmth(GetParam(paramIdx)->Value());
      break;
    case kParamPurity:
      mDSP.SetPurity(GetParam(paramIdx)->Value());
      break;
    case kParamGravity:
      mDSP.SetGravity(GetParam(paramIdx)->Value());
      break;
    case kParamTimbreShift:
      mDSP.SetTimbreShift(GetParam(paramIdx)->Value());
      break;
    case kParamHarmonicBlend:
      mDSP.SetHarmonicBlend(GetParam(paramIdx)->Value());
      break;
    case kParamVoices:
      mDSP.SetVoiceCount(GetParam(paramIdx)->Int());
      break;
    case kParamGain:
      mDSP.SetGain(GetParam(paramIdx)->Value());
      break;
    case kParamScaleType:
      mDSP.SetScale(GetParam(paramIdx)->Int());
      break;
    case kParamMPEEnable:
      mDSP.SetMPEEnabled(GetParam(paramIdx)->Bool());
      break;
    default:
      break;
  }
}

bool CelestialSynth::GetMidiNoteText(int noteNumber, char* text) const
{
  // Convert MIDI note to pentatonic scale note name
  static const char* noteNames[] = {"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"};
  int note = noteNumber % 12;
  int octave = noteNumber / 12 - 1;
  sprintf(text, "%s%d", noteNames[note], octave);
  return true;
}

void CelestialSynth::OnIdle()
{
  mMeterSender.TransmitData(*this);
}
#endif

// ===== DSP Implementation (inline to avoid Xcode project issues) =====
// Note: Main implementation is in CelestialSynth_DSP.cpp - this is kept for compatibility

// Note: Inline implementations removed - all DSP code is now in CelestialSynth_DSP.cpp

#include "CelestialSynth.h"
#include "IPlug_include_in_plug_src.h"
#include "IControls.h"

using namespace iplug;
using namespace igraphics;

CelestialSynth::CelestialSynth(const InstanceInfo& info)
: Plugin(info, MakeConfig(kNumParams, kNumPresets))
{
  // === OSCILLATOR SECTION ===
  GetParam(kParamWaveform)->InitEnum("Waveform", 0, {"Sine", "Saw", "Square", "Triangle"});
  GetParam(kParamTimbreShift)->InitDouble("Timbre Shift", 0.0, -1.0, 1.0, 0.01, "");

  // === FILTER SECTION ===
  GetParam(kParamFilterCutoff)->InitDouble("Filter Cutoff", 20000.0, 20.0, 20000.0, 1.0, "Hz", IParam::kFlagsNone, "", IParam::ShapePowCurve(3.0));
  GetParam(kParamFilterResonance)->InitDouble("Filter Resonance", 0.0, 0.0, 1.0, 0.01, "");

  // === ENVELOPE SECTION ===
  GetParam(kParamAttack)->InitDouble("Attack", 10.0, 1.0, 5000.0, 1.0, "ms", IParam::kFlagsNone, "", IParam::ShapePowCurve(2.0));
  GetParam(kParamDecay)->InitDouble("Decay", 50.0, 1.0, 5000.0, 1.0, "ms", IParam::kFlagsNone, "", IParam::ShapePowCurve(2.0));
  GetParam(kParamSustain)->InitDouble("Sustain", 0.7, 0.0, 1.0, 0.01, "");
  GetParam(kParamRelease)->InitDouble("Release", 200.0, 1.0, 5000.0, 1.0, "ms", IParam::kFlagsNone, "", IParam::ShapePowCurve(2.0));

  // === EFFECTS SECTION ===
  GetParam(kParamDelayTime)->InitDouble("Delay Time", 250.0, 0.0, 2000.0, 1.0, "ms");
  GetParam(kParamDelayFeedback)->InitDouble("Delay Feedback", 0.3, 0.0, 0.95, 0.01, "");
  GetParam(kParamDelayMix)->InitDouble("Delay Mix", 0.2, 0.0, 1.0, 0.01, "");
  GetParam(kParamReverbMix)->InitDouble("Reverb Mix", 0.0, 0.0, 1.0, 0.01, "");

  // === LFO SECTION ===
  GetParam(kParamLFO1Rate)->InitDouble("LFO 1 Rate", 1.0, 0.01, 20.0, 0.01, "Hz", IParam::kFlagsNone, "", IParam::ShapePowCurve(2.0));
  GetParam(kParamLFO1Waveform)->InitEnum("LFO 1 Waveform", 0, {"Sine", "Triangle", "Saw Up", "Saw Down", "Square", "Random"});
  GetParam(kParamLFO2Rate)->InitDouble("LFO 2 Rate", 2.0, 0.01, 20.0, 0.01, "Hz", IParam::kFlagsNone, "", IParam::ShapePowCurve(2.0));
  GetParam(kParamLFO2Waveform)->InitEnum("LFO 2 Waveform", 0, {"Sine", "Triangle", "Saw Up", "Saw Down", "Square", "Random"});

  // === FIVE SACRED CONTROLS ===
  GetParam(kParamBrilliance)->InitDouble("Brilliance", 0.5, 0.0, 1.0, 0.01, "");
  GetParam(kParamMotion)->InitDouble("Motion", 0.3, 0.0, 1.0, 0.01, "");
  GetParam(kParamSpace)->InitDouble("Space", 0.4, 0.0, 1.0, 0.01, "");
  GetParam(kParamWarmth)->InitDouble("Warmth", 0.6, 0.0, 1.0, 0.01, "");
  GetParam(kParamPurity)->InitDouble("Purity", 0.8, 0.0, 1.0, 0.01, "");

  // === GLOBAL CONTROLS ===
  GetParam(kParamVoices)->InitInt("Voices", 8, 1, 16, "");
  GetParam(kParamScaleType)->InitEnum("Scale Type", kScaleJapaneseYo, {
    "Japanese Yo", "Chinese Gong", "Celtic", "Indonesian Slendro",
    "Scottish Highland", "Mongolian Throat", "Egyptian Sacred",
    "Native American", "Nordic Aurora"
  });
  GetParam(kParamGain)->InitDouble("Gain", 0.5, 0.0, 1.0, 0.01, "");

#if IPLUG_EDITOR
  mMakeGraphicsFunc = [&]() {
    return MakeGraphics(*this, PLUG_WIDTH, PLUG_HEIGHT, PLUG_FPS, GetScaleForScreen(PLUG_WIDTH, PLUG_HEIGHT));
  };

  mLayoutFunc = [&](IGraphics* pGraphics) {
    pGraphics->AttachCornerResizer(EUIResizerMode::Scale, false);
    pGraphics->LoadFont("Roboto-Regular", ROBOTO_FN);

    const IRECT bounds = pGraphics->GetBounds();

    // Professional color palette (Arturia-inspired)
    const IColor bgMain = IColor(255, 20, 20, 25);           // #141419
    const IColor bgPanel = IColor(255, 35, 35, 40);          // #232328
    const IColor colorOsc = IColor(255, 0, 212, 255);        // Cyan
    const IColor colorFilter = IColor(255, 0, 255, 136);     // Green
    const IColor colorEnv = IColor(255, 187, 136, 255);      // Purple
    const IColor colorFx = IColor(255, 68, 136, 255);        // Blue
    const IColor colorGold = IColor(255, 255, 215, 138);     // Gold accent
    const IColor colorWhite = IColor(255, 204, 204, 204);    // White

    // Main background
    pGraphics->AttachControl(new IPanelControl(bounds, bgMain));

    // === HEADER SECTION (60px) ===
    const IRECT headerRect = IRECT(0, 0, bounds.W(), 60);
    pGraphics->AttachControl(new ITextControl(IRECT(20, 15, bounds.W() - 300, 55),
      "✦ CELESTIAL PENTATONIC SYNTHESIZER ✦",
      IText(20, colorGold, "Roboto-Regular", EAlign::Near, EVAlign::Middle)));

    // Preset display (placeholder for now)
    pGraphics->AttachControl(new ITextControl(IRECT(bounds.W() - 280, 20, bounds.W() - 100, 45),
      "Preset: Init",
      IText(12, colorWhite, "Roboto-Regular", EAlign::Center, EVAlign::Middle), colorWhite));

    // Preset prev/next buttons (placeholders)
    pGraphics->AttachControl(new ITextControl(IRECT(bounds.W() - 90, 20, bounds.W() - 60, 45),
      "<", IText(16, colorGold, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));
    pGraphics->AttachControl(new ITextControl(IRECT(bounds.W() - 50, 20, bounds.W() - 20, 45),
      ">", IText(16, colorGold, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));

    // === TOP ROW: 4 SECTIONS (280px height) ===
    const float topY = 70;
    const float topHeight = 280;
    const float sectionWidth = (bounds.W() - 60) / 4.0f;

    // --- OSCILLATOR SECTION ---
    const IRECT oscSection = IRECT(20, topY, 20 + sectionWidth, topY + topHeight);
    pGraphics->AttachControl(new IPanelControl(oscSection, bgPanel));
    pGraphics->AttachControl(new ITextControl(IRECT(oscSection.L, oscSection.T + 5, oscSection.R, oscSection.T + 25),
      "OSCILLATOR", IText(11, colorOsc, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));

    // Waveform selector
    IVStyle oscStyle = DEFAULT_STYLE
      .WithColor(kFG, colorOsc)
      .WithColor(kPR, colorOsc.WithOpacity(0.7f))
      .WithWidgetFrac(0.75f)
      .WithShowValue(true)
      .WithShowLabel(true)
      .WithLabelText(IText(10, colorWhite, "Roboto-Regular", EAlign::Center))
      .WithValueText(IText(9, colorOsc, "Roboto-Regular", EAlign::Center));

    float oscCenterX = oscSection.L + oscSection.W() / 2;
    pGraphics->AttachControl(new IVMenuButtonControl(
      IRECT(oscSection.L + 20, oscSection.T + 40, oscSection.R - 20, oscSection.T + 65),
      kParamWaveform, "WAVEFORM", oscStyle), kCtrlWaveform);

    // Waveform display placeholder
    pGraphics->AttachControl(new IPanelControl(
      IRECT(oscSection.L + 20, oscSection.T + 80, oscSection.R - 20, oscSection.T + 180),
      IColor(255, 10, 10, 15)));
    pGraphics->AttachControl(new ITextControl(
      IRECT(oscSection.L + 20, oscSection.T + 120, oscSection.R - 20, oscSection.T + 145),
      "~Waveform~", IText(10, colorOsc.WithOpacity(0.5f), "Roboto-Regular", EAlign::Center, EVAlign::Middle)));

    // Timbre Shift knob
    pGraphics->AttachControl(new IVKnobControl(
      IRECT(oscCenterX - 35, oscSection.T + 190, oscCenterX + 35, oscSection.T + 260),
      kParamTimbreShift, "TIMBRE", oscStyle));

    // --- FILTER SECTION ---
    const IRECT filterSection = IRECT(30 + sectionWidth, topY, 30 + sectionWidth * 2, topY + topHeight);
    pGraphics->AttachControl(new IPanelControl(filterSection, bgPanel));
    pGraphics->AttachControl(new ITextControl(IRECT(filterSection.L, filterSection.T + 5, filterSection.R, filterSection.T + 25),
      "FILTER", IText(11, colorFilter, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));

    IVStyle filterStyle = oscStyle.WithColor(kFG, colorFilter).WithValueText(IText(9, colorFilter, "Roboto-Regular", EAlign::Center));

    float filterCenterX = filterSection.L + filterSection.W() / 2;
    // Cutoff knob (large)
    pGraphics->AttachControl(new IVKnobControl(
      IRECT(filterCenterX - 45, filterSection.T + 40, filterCenterX + 45, filterSection.T + 130),
      kParamFilterCutoff, "CUTOFF", filterStyle), kCtrlFilterCutoff);

    // Resonance knob (medium)
    pGraphics->AttachControl(new IVKnobControl(
      IRECT(filterCenterX - 35, filterSection.T + 150, filterCenterX + 35, filterSection.T + 220),
      kParamFilterResonance, "RESONANCE", filterStyle), kCtrlFilterResonance);

    // --- ENVELOPE SECTION ---
    const IRECT envSection = IRECT(40 + sectionWidth * 2, topY, 40 + sectionWidth * 3, topY + topHeight);
    pGraphics->AttachControl(new IPanelControl(envSection, bgPanel));
    pGraphics->AttachControl(new ITextControl(IRECT(envSection.L, envSection.T + 5, envSection.R, envSection.T + 25),
      "ENVELOPE", IText(11, colorEnv, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));

    IVStyle envStyle = oscStyle.WithColor(kFG, colorEnv).WithValueText(IText(9, colorEnv, "Roboto-Regular", EAlign::Center));

    // Envelope display placeholder
    pGraphics->AttachControl(new IPanelControl(
      IRECT(envSection.L + 20, envSection.T + 35, envSection.R - 20, envSection.T + 115),
      IColor(255, 10, 10, 15)));
    pGraphics->AttachControl(new ITextControl(
      IRECT(envSection.L + 20, envSection.T + 60, envSection.R - 20, envSection.T + 90),
      "~ADSR Display~", IText(10, colorEnv.WithOpacity(0.5f), "Roboto-Regular", EAlign::Center, EVAlign::Middle)));

    // ADSR sliders (small knobs)
    float envKnobSize = 45;
    float envSpacing = (envSection.W() - 40) / 4.0f;
    float envY = envSection.T + 130;

    pGraphics->AttachControl(new IVKnobControl(
      IRECT(envSection.L + 10, envY, envSection.L + 10 + envKnobSize, envY + envKnobSize),
      kParamAttack, "A", envStyle.WithLabelText(IText(8, colorWhite, "Roboto-Regular", EAlign::Center))), kCtrlAttack);

    pGraphics->AttachControl(new IVKnobControl(
      IRECT(envSection.L + 10 + envSpacing, envY, envSection.L + 10 + envSpacing + envKnobSize, envY + envKnobSize),
      kParamDecay, "D", envStyle.WithLabelText(IText(8, colorWhite, "Roboto-Regular", EAlign::Center))), kCtrlDecay);

    pGraphics->AttachControl(new IVKnobControl(
      IRECT(envSection.L + 10 + envSpacing * 2, envY, envSection.L + 10 + envSpacing * 2 + envKnobSize, envY + envKnobSize),
      kParamSustain, "S", envStyle.WithLabelText(IText(8, colorWhite, "Roboto-Regular", EAlign::Center))), kCtrlSustain);

    pGraphics->AttachControl(new IVKnobControl(
      IRECT(envSection.L + 10 + envSpacing * 3, envY, envSection.L + 10 + envSpacing * 3 + envKnobSize, envY + envKnobSize),
      kParamRelease, "R", envStyle.WithLabelText(IText(8, colorWhite, "Roboto-Regular", EAlign::Center))), kCtrlRelease);

    // --- EFFECTS SECTION ---
    const IRECT fxSection = IRECT(50 + sectionWidth * 3, topY, bounds.W() - 20, topY + topHeight);
    pGraphics->AttachControl(new IPanelControl(fxSection, bgPanel));
    pGraphics->AttachControl(new ITextControl(IRECT(fxSection.L, fxSection.T + 5, fxSection.R, fxSection.T + 25),
      "EFFECTS", IText(11, colorFx, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));

    IVStyle fxStyle = oscStyle.WithColor(kFG, colorFx).WithValueText(IText(9, colorFx, "Roboto-Regular", EAlign::Center));

    float fxCenterX = fxSection.L + fxSection.W() / 2;
    float fxKnobSize = 55;
    float fxY = fxSection.T + 40;

    // Delay controls
    pGraphics->AttachControl(new ITextControl(IRECT(fxSection.L + 10, fxY, fxSection.R - 10, fxY + 18),
      "DELAY", IText(9, colorFx, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));

    pGraphics->AttachControl(new IVKnobControl(
      IRECT(fxCenterX - fxKnobSize/2, fxY + 25, fxCenterX + fxKnobSize/2, fxY + 25 + fxKnobSize),
      kParamDelayTime, "TIME", fxStyle.WithLabelText(IText(8, colorWhite, "Roboto-Regular", EAlign::Center))), kCtrlDelayTime);

    float fxRow2 = fxY + 90;
    pGraphics->AttachControl(new IVKnobControl(
      IRECT(fxSection.L + 15, fxRow2, fxSection.L + 15 + fxKnobSize, fxRow2 + fxKnobSize),
      kParamDelayFeedback, "FDBK", fxStyle.WithLabelText(IText(7, colorWhite, "Roboto-Regular", EAlign::Center))), kCtrlDelayFeedback);

    pGraphics->AttachControl(new IVKnobControl(
      IRECT(fxSection.R - 15 - fxKnobSize, fxRow2, fxSection.R - 15, fxRow2 + fxKnobSize),
      kParamDelayMix, "MIX", fxStyle.WithLabelText(IText(7, colorWhite, "Roboto-Regular", EAlign::Center))), kCtrlDelayMix);

    // Reverb control
    float fxRow3 = fxRow2 + 75;
    pGraphics->AttachControl(new ITextControl(IRECT(fxSection.L + 10, fxRow3, fxSection.R - 10, fxRow3 + 15),
      "REVERB", IText(9, colorFx, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));

    pGraphics->AttachControl(new IVKnobControl(
      IRECT(fxCenterX - fxKnobSize/2, fxRow3 + 20, fxCenterX + fxKnobSize/2, fxRow3 + 20 + fxKnobSize),
      kParamReverbMix, "MIX", fxStyle.WithLabelText(IText(8, colorWhite, "Roboto-Regular", EAlign::Center))), kCtrlReverbMix);

    // === MIDDLE: THE FIVE SACRED CONTROLS (180px) ===
    const float sacredY = topY + topHeight + 10;
    const float sacredHeight = 180;
    const IRECT sacredSection = IRECT(20, sacredY, bounds.W() - 20, sacredY + sacredHeight);

    pGraphics->AttachControl(new IPanelControl(sacredSection, bgPanel));
    pGraphics->AttachControl(new ITextControl(IRECT(sacredSection.L, sacredSection.T + 8, sacredSection.R, sacredSection.T + 30),
      "THE FIVE SACRED CONTROLS", IText(13, colorGold, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));

    // Sacred knobs - color-coded
    const float sacredKnobSize = 85;
    const float sacredSpacing = (sacredSection.W() - (5 * sacredKnobSize)) / 6;
    const float sacredKnobY = sacredSection.T + 50;

    IVStyle sacredStyle = DEFAULT_STYLE
      .WithColor(kPR, COLOR_LIGHT_GRAY.WithOpacity(0.3f))
      .WithWidgetFrac(0.8f)
      .WithShowValue(true)
      .WithShowLabel(true)
      .WithLabelText(IText(10, colorWhite, "Roboto-Regular", EAlign::Center))
      .WithValueText(IText(9, COLOR_LIGHT_GRAY, "Roboto-Regular", EAlign::Center));

    auto brillianceColor = IColor(255, 220, 220, 220);  // White/Silver
    auto motionColor = IColor(255, 255, 200, 100);      // Yellow/Gold
    auto spaceColor = IColor(255, 100, 150, 255);       // Blue
    auto warmthColor = IColor(255, 255, 140, 80);       // Orange
    auto purityColor = IColor(255, 180, 100, 255);      // Purple

    pGraphics->AttachControl(new IVKnobControl(
      IRECT(sacredSpacing, sacredKnobY, sacredSpacing + sacredKnobSize, sacredKnobY + sacredKnobSize),
      kParamBrilliance, "BRILLIANCE", sacredStyle.WithColor(kFG, brillianceColor)), kCtrlBrilliance);

    pGraphics->AttachControl(new IVKnobControl(
      IRECT(sacredSpacing * 2 + sacredKnobSize, sacredKnobY, sacredSpacing * 2 + sacredKnobSize * 2, sacredKnobY + sacredKnobSize),
      kParamMotion, "MOTION", sacredStyle.WithColor(kFG, motionColor)), kCtrlMotion);

    pGraphics->AttachControl(new IVKnobControl(
      IRECT(sacredSpacing * 3 + sacredKnobSize * 2, sacredKnobY, sacredSpacing * 3 + sacredKnobSize * 3, sacredKnobY + sacredKnobSize),
      kParamSpace, "SPACE", sacredStyle.WithColor(kFG, spaceColor)), kCtrlSpace);

    pGraphics->AttachControl(new IVKnobControl(
      IRECT(sacredSpacing * 4 + sacredKnobSize * 3, sacredKnobY, sacredSpacing * 4 + sacredKnobSize * 4, sacredKnobY + sacredKnobSize),
      kParamWarmth, "WARMTH", sacredStyle.WithColor(kFG, warmthColor)), kCtrlWarmth);

    pGraphics->AttachControl(new IVKnobControl(
      IRECT(sacredSpacing * 5 + sacredKnobSize * 4, sacredKnobY, sacredSpacing * 5 + sacredKnobSize * 5, sacredKnobY + sacredKnobSize),
      kParamPurity, "PURITY", sacredStyle.WithColor(kFG, purityColor)), kCtrlPurity);

    // === BOTTOM: GLOBAL CONTROLS (180px) ===
    const float globalY = sacredY + sacredHeight + 10;
    const float globalHeight = bounds.H() - globalY - 20;
    const IRECT globalSection = IRECT(20, globalY, bounds.W() - 20, globalY + globalHeight);

    pGraphics->AttachControl(new IPanelControl(globalSection, bgPanel));
    pGraphics->AttachControl(new ITextControl(IRECT(globalSection.L, globalSection.T + 8, globalSection.R, globalSection.T + 28),
      "GLOBAL CONTROLS", IText(11, colorGold, "Roboto-Regular", EAlign::Center, EVAlign::Middle)));

    IVStyle globalStyle = DEFAULT_STYLE
      .WithColor(kFG, colorWhite)
      .WithColor(kPR, colorWhite.WithOpacity(0.5f))
      .WithWidgetFrac(0.7f)
      .WithShowValue(true)
      .WithShowLabel(true)
      .WithLabelText(IText(9, colorWhite, "Roboto-Regular", EAlign::Center))
      .WithValueText(IText(8, colorWhite, "Roboto-Regular", EAlign::Center));

    float globalKnobSize = 60;
    float globalStartX = globalSection.L + 40;
    float globalY2 = globalSection.T + 40;
    float globalSpacing = 120;

    // Voices knob
    pGraphics->AttachControl(new IVKnobControl(
      IRECT(globalStartX, globalY2, globalStartX + globalKnobSize, globalY2 + globalKnobSize),
      kParamVoices, "VOICES", globalStyle), kCtrlVoices);

    // Gain knob
    pGraphics->AttachControl(new IVKnobControl(
      IRECT(globalStartX + globalSpacing, globalY2, globalStartX + globalSpacing + globalKnobSize, globalY2 + globalKnobSize),
      kParamGain, "GAIN", globalStyle), kCtrlGain);

    // Scale selector
    pGraphics->AttachControl(new IVMenuButtonControl(
      IRECT(globalStartX + globalSpacing * 2.5, globalY2, globalStartX + globalSpacing * 2.5 + 240, globalY2 + 30),
      kParamScaleType, "PENTATONIC SCALE", globalStyle.WithColor(kFG, colorGold)), kCtrlScaleType);

    // Output meter placeholder
    pGraphics->AttachControl(new ITextControl(
      IRECT(globalSection.R - 180, globalY2 + 5, globalSection.R - 40, globalY2 + 25),
      "OUTPUT: ▬▬▬▬▬▬", IText(9, colorWhite, "Roboto-Regular", EAlign::Near, EVAlign::Middle)));
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
  mMeterSender.ProcessBlock(outputs, nFrames, kCtrlMeter);
}

void CelestialSynth::ProcessMidiMsg(const IMidiMsg& msg)
{
  TRACE;
  mDSP.ProcessMidiMsg(msg);
  SendMidiMsgFromDelegate(msg);
}

void CelestialSynth::OnReset()
{
  mDSP.Reset(GetSampleRate(), GetBlockSize());

  // Initialize all parameters to their current values
  // Oscillator
  mDSP.SetWaveform(GetParam(kParamWaveform)->Int());
  mDSP.SetTimbreShift(GetParam(kParamTimbreShift)->Value());

  // Filter
  mDSP.SetFilterCutoff(GetParam(kParamFilterCutoff)->Value());
  mDSP.SetFilterResonance(GetParam(kParamFilterResonance)->Value());

  // Envelope
  mDSP.SetAttack(GetParam(kParamAttack)->Value());
  mDSP.SetDecay(GetParam(kParamDecay)->Value());
  mDSP.SetSustain(GetParam(kParamSustain)->Value());
  mDSP.SetReleaseTime(GetParam(kParamRelease)->Value());

  // Effects
  mDSP.SetDelayTime(GetParam(kParamDelayTime)->Value());
  mDSP.SetDelayFeedback(GetParam(kParamDelayFeedback)->Value());
  mDSP.SetDelayMix(GetParam(kParamDelayMix)->Value());
  // Note: Reverb not yet implemented in DSP

  // LFOs
  mDSP.SetLFO1Rate(GetParam(kParamLFO1Rate)->Value());
  mDSP.SetLFO1Waveform(GetParam(kParamLFO1Waveform)->Int());
  mDSP.SetLFO2Rate(GetParam(kParamLFO2Rate)->Value());
  mDSP.SetLFO2Waveform(GetParam(kParamLFO2Waveform)->Int());

  // Five Sacred Controls
  mDSP.SetBrilliance(GetParam(kParamBrilliance)->Value());
  mDSP.SetMotion(GetParam(kParamMotion)->Value());
  mDSP.SetSpace(GetParam(kParamSpace)->Value());
  mDSP.SetWarmth(GetParam(kParamWarmth)->Value());
  mDSP.SetPurity(GetParam(kParamPurity)->Value());

  // Global
  mDSP.SetVoiceCount(GetParam(kParamVoices)->Int());
  mDSP.SetScale(GetParam(kParamScaleType)->Int());
  mDSP.SetGain(GetParam(kParamGain)->Value());
}

void CelestialSynth::OnParamChange(int paramIdx)
{
  switch (paramIdx)
  {
    // === OSCILLATOR SECTION ===
    case kParamWaveform:
      mDSP.SetWaveform(GetParam(paramIdx)->Int());
      break;
    case kParamTimbreShift:
      mDSP.SetTimbreShift(GetParam(paramIdx)->Value());
      break;

    // === FILTER SECTION ===
    case kParamFilterCutoff:
      mDSP.SetFilterCutoff(GetParam(paramIdx)->Value());
      break;
    case kParamFilterResonance:
      mDSP.SetFilterResonance(GetParam(paramIdx)->Value());
      break;

    // === ENVELOPE SECTION ===
    case kParamAttack:
      mDSP.SetAttack(GetParam(paramIdx)->Value());
      break;
    case kParamDecay:
      mDSP.SetDecay(GetParam(paramIdx)->Value());
      break;
    case kParamSustain:
      mDSP.SetSustain(GetParam(paramIdx)->Value());
      break;
    case kParamRelease:
      mDSP.SetReleaseTime(GetParam(paramIdx)->Value());
      break;

    // === EFFECTS SECTION ===
    case kParamDelayTime:
      mDSP.SetDelayTime(GetParam(paramIdx)->Value());
      break;
    case kParamDelayFeedback:
      mDSP.SetDelayFeedback(GetParam(paramIdx)->Value());
      break;
    case kParamDelayMix:
      mDSP.SetDelayMix(GetParam(paramIdx)->Value());
      break;
    case kParamReverbMix:
      // Reverb not yet implemented in DSP
      break;

    // === LFO SECTION ===
    case kParamLFO1Rate:
      mDSP.SetLFO1Rate(GetParam(paramIdx)->Value());
      break;
    case kParamLFO1Waveform:
      mDSP.SetLFO1Waveform(GetParam(paramIdx)->Int());
      break;
    case kParamLFO2Rate:
      mDSP.SetLFO2Rate(GetParam(paramIdx)->Value());
      break;
    case kParamLFO2Waveform:
      mDSP.SetLFO2Waveform(GetParam(paramIdx)->Int());
      break;

    // === FIVE SACRED CONTROLS ===
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

    // === GLOBAL CONTROLS ===
    case kParamVoices:
      mDSP.SetVoiceCount(GetParam(paramIdx)->Int());
      break;
    case kParamScaleType:
      mDSP.SetScale(GetParam(paramIdx)->Int());
      break;
    case kParamGain:
      mDSP.SetGain(GetParam(paramIdx)->Value());
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

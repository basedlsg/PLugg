#define PLUG_NAME "CelestialSynth"
#define PLUG_MFR "CelestialAudio"
#define PLUG_VERSION_HEX 0x00010000
#define PLUG_VERSION_STR "1.0.0"
#define PLUG_UNIQUE_ID 'CeSy'
#define PLUG_MFR_ID 'CelA'
#define PLUG_URL_STR "https://github.com/CelestialAudio"
#define PLUG_EMAIL_STR "contact@celestialaudio.com"
#define PLUG_COPYRIGHT_STR "Copyright 2024 CelestialAudio"
#define PLUG_CLASS_NAME CelestialSynth

#define BUNDLE_NAME "CelestialSynth"
#define BUNDLE_MFR "CelestialAudio"
#define BUNDLE_DOMAIN "com"

#define PLUG_CHANNEL_IO " \
0-2 \
0-2.2 \
0-2.2.2 \
0-2.2.2.2"

#define PLUG_LATENCY 0
#define PLUG_TYPE 1
#define PLUG_DOES_MIDI_IN 1
#define PLUG_DOES_MIDI_OUT 1
#define PLUG_DOES_MPE 1
#define PLUG_DOES_STATE_CHUNKS 1
#define PLUG_HAS_UI 1
#define PLUG_WIDTH 800
#define PLUG_HEIGHT 600
#define PLUG_FPS 60
#define PLUG_SHARED_RESOURCES 0
#define PLUG_HOST_RESIZE 0

#define SHARED_RESOURCES_SUBPATH "CelestialSynth"

#define AUV2_ENTRY CelestialSynth_Entry
#define AUV2_ENTRY_STR "CelestialSynth_Entry"
#define AUV2_FACTORY CelestialSynth_Factory
#define AUV2_VIEW_CLASS CelestialSynth_View
#define AUV2_VIEW_CLASS_STR "CelestialSynth_View"

#define AAX_TYPE_IDS 'CeSy'
#define AAX_PLUG_MFR_STR "CelestialAudio"
#define AAX_PLUG_NAME_STR "CelestialSynth\nIPDS"
#define AAX_DOES_AUDIOSUITE 0
#define AAX_PLUG_CATEGORY_STR "Synth"
#define AAX_AOS_STRS "Drum2", "Drum3", "Drum4"
#define VST3_SUBCATEGORY "Instrument|Synth"

#define APP_NUM_CHANNELS 2
#define APP_N_VECTOR_WAIT 0
#define APP_MULT 1
#define APP_COPY_AUV3 0
#define APP_SIGNAL_VECTOR_SIZE 64

#define ROBOTO_FN "Roboto-Regular.ttf"

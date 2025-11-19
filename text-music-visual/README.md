# Text Music Visual

Transform text into immersive audio-visual experiences using phonemes, semantics, sentiment analysis, and AI-generated imagery.

## Features

- **Phoneme Mapping**: Convert text sounds to musical parameters
- **Semantic Analysis**: Map word meanings to audio/visual characteristics
- **Sentiment Processing**: Adjust mood and tone based on text emotion
- **Context Fusion**: Blend multiple analysis layers into cohesive output
- **Magic Words**: Special trigger words for unique effects
- **AI Textures**: Generate custom visuals using Fal.ai
- **Real-time Visuals**: Three.js powered reactive visualizations
- **Strudel Integration**: Live-coded music patterns

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd text-music-visual

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your Fal.ai API key to .env
# VITE_FAL_KEY=your_key_here

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

## Project Structure

```
text-music-visual/
├── src/
│   ├── main.js              # Application entry point
│   ├── core/                 # Core systems
│   │   ├── EventBus.js       # Global event system
│   │   ├── AudioEngine.js    # Main audio controller
│   │   └── ParameterManager.js # Parameter state management
│   ├── audio/                # Audio generation
│   │   ├── StrudelBridge.js  # Strudel pattern interface
│   │   ├── DronePattern.js   # Ambient drone generator
│   │   └── NoteGenerator.js  # Note/melody generation
│   ├── visual/               # Visual rendering
│   │   ├── VisualEngine.js   # Three.js scene manager
│   │   ├── AudioAnalyzer.js  # FFT analysis for reactivity
│   │   ├── ColorSystem.js    # Color mapping and palettes
│   │   └── shaders/          # Custom GLSL shaders
│   ├── mapping/              # Text analysis
│   │   ├── phonemes.js       # Phoneme to parameter mapping
│   │   ├── semantics.js      # Word meaning analysis
│   │   ├── sentiment.js      # Emotion detection
│   │   ├── context.js        # Contextual analysis
│   │   ├── fusion.js         # Multi-layer blending
│   │   └── magicWords.js     # Special word triggers
│   ├── ai/                   # AI integration
│   │   ├── ImageGenerator.js # Fal.ai image generation
│   │   └── TextureManager.js # Texture loading/caching
│   └── ui/                   # User interface
│       ├── App.jsx           # Main React component
│       ├── TextInput.jsx     # Text input component
│       ├── Constellation.jsx # Visual parameter display
│       └── styles.css        # Global styles
├── public/
│   └── textures/             # Fallback textures
├── index.html                # HTML entry point
├── package.json              # Dependencies
├── vite.config.js            # Build configuration
└── .env.example              # Environment template
```

## Architecture

### Event-Driven Design

The application uses a central EventBus for communication between modules:

```javascript
import { EventBus } from '@core/EventBus';

// Subscribe to events
EventBus.on('text:analyzed', (params) => {
  // Handle analyzed text parameters
});

// Emit events
EventBus.emit('text:input', { text: 'hello world' });
```

### Parameter Flow

1. **Text Input** -> TextInput component captures user text
2. **Analysis** -> Mapping modules process text in parallel
3. **Fusion** -> Parameters are blended and normalized
4. **Audio** -> Strudel patterns update based on parameters
5. **Visual** -> Three.js scene reacts to audio and parameters

### Import Aliases

Use clean imports with configured aliases:

```javascript
import { EventBus } from '@core/EventBus';
import { analyzePhonemes } from '@mapping/phonemes';
import { VisualEngine } from '@visual/VisualEngine';
```

## Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint source files
npm run lint
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FAL_KEY` | Fal.ai API key for image generation | Optional (uses fallbacks) |

### Vite Configuration

The build is optimized with:
- Code splitting for vendors (React, Three.js, Strudel)
- GLSL shader imports
- Path aliases for clean imports
- Source maps for debugging

## Dependencies

### Runtime
- **@strudel/core** - Live coding music patterns
- **@strudel/webaudio** - Web Audio integration
- **three** - 3D visualization
- **react** - UI components
- **@fal-ai/serverless-client** - AI image generation

### Development
- **vite** - Fast build tool
- **@vitejs/plugin-react** - React JSX support
- **vite-plugin-glsl** - GLSL shader imports

## Usage

1. Type or paste text into the input field
2. Watch as the text is analyzed and transformed into:
   - Musical patterns and drones
   - Reactive 3D visualizations
   - AI-generated textures (if API key configured)
3. Interact with the constellation to fine-tune parameters
4. Export or share your creation

### Example Words to Try

#### Single Words
- `ocean` - vast, flowing, deep blue
- `shimmer` - bright, dancing, ethereal
- `thunder` - powerful, rumbling, dark
- `whisper` - intimate, soft, air
- `cosmos` - infinite space, shimmering harmonics
- `velvet` - smooth, luxurious warmth

#### Word Combinations
- `ocean wind` - sea breeze, salt spray
- `fire crystal` - intense clarity
- `soft ancient` - worn, warm, timeless
- `night bloom` - nocturnal flowering

#### Poetic Phrases
- `quiet morning light`
- `distant thunder`
- `crystalline silence`
- `warm decay`
- `infinite bloom`

#### Magic Words
These special words have hand-crafted sonic signatures:
- `cosmos` - vast, slowly evolving space
- `euphoria` - overwhelming joy, ascending bliss
- `void` - profound silence, negative space
- `serenity` - perfect stillness, absolute peace
- `thunder` - explosive power, crackling overtones

See `/src/demos/examples.md` for the complete guide.

## Demo Sequences

The system includes curated demo sequences that showcase its capabilities:

```javascript
import { DemoPlayer } from '@demos';

// In your component
<DemoPlayer
  onWordTrigger={(word) => triggerMorph(word)}
  initialSequence="elements"
  autoStart={false}
/>
```

### Available Sequences

| Sequence | Duration | Description |
|----------|----------|-------------|
| Elements Journey | 60s | Travel through elemental forces |
| Emotional Arc | 90s | Journey through human emotions |
| Texture Exploration | 45s | Feel different sonic textures |
| Dawn to Dusk | 75s | A day's journey in sound |
| Mystical Journey | 60s | Explore the otherworldly |
| Kinetic Energy | 50s | Feel rhythm and momentum |
| Nature's Voice | 70s | Sounds of the natural world |
| Meditation | 120s | Calm, centered experience |

### DemoPlayer Controls

- **Play/Pause** - Toggle playback
- **Skip** - Jump to next/previous word
- **Loop** - Repeat sequence continuously
- **Selector** - Choose different sequences

## Development

### Adding New Mappings

Create a new mapping module in `src/mapping/`:

```javascript
// src/mapping/myMapping.js
export function analyzeMyFeature(text) {
  // Analysis logic
  return {
    parameter1: value1,
    parameter2: value2
  };
}
```

Register it in `src/mapping/fusion.js` for integration.

### Custom Shaders

Add GLSL shaders to `src/visual/shaders/`:

```glsl
// myShader.frag
uniform float uTime;
uniform float uIntensity;

void main() {
  // Shader logic
}
```

Import in JavaScript:
```javascript
import fragmentShader from '@visual/shaders/myShader.frag';
```

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines before submitting PRs.

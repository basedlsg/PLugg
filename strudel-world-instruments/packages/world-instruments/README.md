# @strudel/world-instruments

World instruments with 9 pentatonic scales using just intonation for Strudel live coding.

Based on the CelestialSynth plugin from PLugg, bringing authentic world music scales to the Strudel platform.

## Features

- **9 Pentatonic Scales** from different world music traditions
- **Just Intonation** - authentic frequency ratios instead of equal temperament
- **5 Sacred Controls** - intuitive parameters for sound shaping
- **Pattern Integration** - seamless Strudel pattern functions

## Available Scales

| # | Scale | Character |
|---|-------|-----------|
| 0 | Japanese Yo | Major pentatonic with Pythagorean 6th |
| 1 | Chinese Gong | Pure Pythagorean major pentatonic |
| 2 | Celtic | Sus4 pentatonic |
| 3 | Indonesian Slendro | Approximated slendro tuning |
| 4 | Scottish Highland | Sus4 pentatonic (bagpipe-like) |
| 5 | Mongolian Throat | Minor pentatonic |
| 6 | Egyptian Sacred | 5-limit just intonation major |
| 7 | Native American | Minor pentatonic |
| 8 | Nordic Aurora | Sus4 pentatonic |

## Sacred Controls

Five intuitive parameters for shaping your sound:

- **brilliance** (0-1) - Filter cutoff frequency
- **motion** (0-1) - Vibrato depth
- **space** (0-1) - Delay/reverb mix
- **warmth** (0-1) - Tone coloration
- **purity** (0-1) - Harmonic content

## Usage

### Basic Usage

```javascript
// Use Japanese Yo scale
note("c4 d4 e4 g4 a4").yo()

// Use Chinese Gong scale with effects
note("c4 e4 g4").gong().brilliance(0.8).space(0.3)

// Use generic world synth with scale selection
note("c4 d4 f4 g4").world().worldScale("celtic")
```

### Scale-Specific Synths

Each scale has its own synth shortcut:

```javascript
note("c4 d4 e4 g4 a4").yo()       // Japanese Yo
note("c4 d4 e4 g4 a4").gong()     // Chinese Gong
note("c4 d4 f4 g4 bb4").celtic()  // Celtic
note("c4 d4 e4 g4 a4").slendro()  // Indonesian Slendro
note("c4 d4 f4 g4 bb4").highland() // Scottish Highland
note("c4 eb4 f4 g4 bb4").throat()  // Mongolian Throat
note("c4 d4 e4 g4 a4").sacred()   // Egyptian Sacred
note("c4 eb4 f4 g4 bb4").native()  // Native American
note("c4 d4 f4 g4 bb4").aurora()  // Nordic Aurora
```

### Sacred Controls

```javascript
// Individual controls
note("c4 e4 g4")
  .world()
  .brilliance(0.8)   // Bright filter
  .motion(0.3)       // Subtle vibrato
  .space(0.4)        // Medium delay
  .warmth(0.6)       // Warm tone
  .purity(0.5)       // Balanced harmonics

// All five at once
note("c4 e4 g4").world().sacred5(0.8, 0.3, 0.4, 0.6, 0.5)
```

### Pattern Examples

```javascript
// Evolving world soundscape
note("c4 [e4 g4] a4 g4")
  .yo()
  .brilliance(sine.range(0.3, 0.9))
  .motion(0.2)
  .space(0.4)

// Celtic drone with movement
stack(
  note("c3").highland().sustain(4),
  note("g4 f4 g4 a4").celtic().brilliance(0.7)
)

// Mongolian-inspired pattern
note("c3 g3 c4 g4")
  .throat()
  .warmth(0.8)
  .motion(sine.range(0, 0.5))
```

## Just Intonation Ratios

Each scale uses authentic just intonation ratios:

### Japanese Yo
- Root: 1/1
- Major 2nd: 9/8
- Major 3rd: 81/64
- Perfect 5th: 3/2
- Major 6th: 27/16

### Egyptian Sacred
- Root: 1/1
- Major 2nd: 9/8
- Just Major 3rd: 5/4
- Perfect 5th: 3/2
- Just Major 6th: 5/3

### Indonesian Slendro
- Root: 1/1
- 2nd: 8/7 (~231 cents)
- 3rd: 21/16 (~471 cents)
- 5th: 3/2 (~702 cents)
- 6th: 7/4 (~969 cents)

## Installation

```bash
pnpm add @strudel/world-instruments
```

Or if using in the Strudel REPL:

```javascript
import '@strudel/world-instruments'
```

## License

AGPL-3.0-or-later

## Credits

Based on CelestialSynth from the PLugg project.

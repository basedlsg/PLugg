/**
 * World Instruments Example Patterns
 *
 * Demonstrates the 9 pentatonic scales with just intonation
 * and the 5 sacred controls.
 */

// Example 1: Japanese Yo Scale - Flowing Melody
export const japaneseYo = `
// Japanese Yo - Major pentatonic with Pythagorean 6th
note("c4 d4 e4 g4 a4 g4 e4 d4")
  .yo()
  .brilliance(sine.range(0.4, 0.8).slow(4))
  .motion(0.15)
  .attack(0.02)
  .decay(0.1)
  .sustain(0.6)
  .release(0.3)
`;

// Example 2: Chinese Gong Scale - Ceremonial
export const chineseGong = `
// Chinese Gong - Pure Pythagorean major pentatonic
stack(
  note("c3").gong().sustain(4),
  note("g4 e4 d4 c4").gong().slow(2)
)
.brilliance(0.6)
.warmth(0.7)
.space(0.4)
`;

// Example 3: Celtic Scale - Dance Tune
export const celticDance = `
// Celtic - Sus4 pentatonic dance
note("c4 d4 f4 g4 bb4 g4 f4 d4")
  .celtic()
  .fast(1.5)
  .brilliance(0.75)
  .motion(0.1)
  .purity(0.6)
`;

// Example 4: Indonesian Slendro - Gamelan Style
export const indonesianSlendro = `
// Indonesian Slendro - Gamelan-inspired
note("[c4 e4] [g4 a4] [c5 a4] [g4 e4]")
  .slendro()
  .brilliance(0.5)
  .warmth(0.8)
  .space(0.5)
  .attack(0.01)
  .release(0.4)
`;

// Example 5: Scottish Highland - Bagpipe Drone
export const scottishHighland = `
// Scottish Highland - Bagpipe-like drone and melody
stack(
  note("c3").highland().sustain(8),
  note("g4 f4 g4 a4 bb4 a4 g4 f4").highland()
)
.brilliance(0.7)
.purity(0.7)
.motion(0.05)
`;

// Example 6: Mongolian Throat - Deep and Resonant
export const mongolianThroat = `
// Mongolian Throat - Minor pentatonic with overtones
note("c3 eb3 f3 g3 bb3 g3 f3 eb3")
  .throat()
  .slow(2)
  .brilliance(0.4)
  .warmth(0.9)
  .purity(0.8)
  .space(0.3)
`;

// Example 7: Egyptian Sacred - Ancient Mystery
export const egyptianSacred = `
// Egyptian Sacred - 5-limit just intonation
note("c4 d4 e4 g4 a4 g4 e4 d4 c4")
  .sacred()
  .brilliance(sine.range(0.3, 0.7).slow(8))
  .motion(0.2)
  .space(0.5)
  .warmth(0.6)
`;

// Example 8: Native American - Earth Song
export const nativeAmerican = `
// Native American - Grounded minor pentatonic
note("c4 [eb4 f4] g4 bb4 [g4 f4] eb4")
  .native()
  .brilliance(0.5)
  .warmth(0.8)
  .motion(0.1)
  .space(0.3)
`;

// Example 9: Nordic Aurora - Ethereal Soundscape
export const nordicAurora = `
// Nordic Aurora - Atmospheric sus4 pentatonic
note("c4 d4 f4 g4 bb4")
  .aurora()
  .slow(2)
  .brilliance(sine.range(0.2, 0.9).slow(16))
  .motion(0.3)
  .space(0.6)
  .warmth(0.5)
  .purity(0.4)
`;

// Example 10: Sacred Five Controls Demo
export const sacredFiveDemo = `
// Demonstrating all 5 sacred controls
note("c4 e4 g4 a4")
  .world()
  .worldScale("egyptian")
  .sacred5(
    sine.range(0.3, 0.9).slow(4),  // brilliance
    tri.range(0, 0.3).slow(8),     // motion
    0.4,                            // space
    0.7,                            // warmth
    0.5                             // purity
  )
`;

// Example 11: World Fusion - Multiple Scales
export const worldFusion = `
// Combining scales in a polyrhythmic pattern
stack(
  note("c3 g3").yo().slow(2),
  note("c4 e4 g4 a4").celtic().fast(1.5),
  note("c5 d5 f5").aurora().fast(2)
)
.brilliance(0.6)
.space(0.4)
.warmth(0.5)
`;

// Example 12: Meditative Journey
export const meditativeJourney = `
// Slow, peaceful exploration of scales
cat(
  note("c4 d4 e4 g4").yo().slow(2),
  note("c4 eb4 f4 g4").throat().slow(2),
  note("c4 d4 e4 g4 a4").sacred().slow(2),
  note("c4 d4 f4 g4 bb4").aurora().slow(2)
)
.brilliance(0.5)
.motion(0.15)
.space(0.5)
.warmth(0.7)
.attack(0.1)
.release(0.5)
`;

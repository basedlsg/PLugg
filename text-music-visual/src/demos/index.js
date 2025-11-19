/**
 * Demo Sequences Module
 *
 * Export all demo sequences and the DemoPlayer component
 */

export {
  default as DemoPlayer,
  allSequences,
  getSequenceNames
} from './DemoPlayer';

export {
  elementsDemo,
  emotionalDemo,
  textureDemo,
  dailyCycleDemo,
  mysticalDemo,
  kineticDemo,
  natureDemo,
  meditationSequence,
  energyBuildSequence,
  colorJourneySequence,
  poeticPhrases,
  wordCombinations,
  getSequence,
  getSequencesByDuration
} from './sequences';

// Re-export all sequences as default
export { default } from './sequences';

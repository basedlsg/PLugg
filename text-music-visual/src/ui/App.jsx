import React, { useState, useEffect, useCallback, useRef } from 'react';
import TextInput from './TextInput';
import Constellation from './Constellation';
import WordParticles from './WordParticles';
import useAudioVisual from './useAudioVisual';
import {
  AccessibilityProvider,
  useAccessibility,
  AudioDescription,
  useKeyboardNavigation,
  useFocusManagement,
  SkipLink,
} from './Accessibility';
import './styles.css';

/**
 * Main Application Component
 *
 * Orchestrates the "tending a garden" interaction metaphor:
 * - Already alive when you arrive
 * - Words dissolve into the world
 * - History forms constellations
 * - No wrong answers
 */
// Wrapper component that provides accessibility context
export default function App() {
  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
}

// Main application content with accessibility integration
function AppContent() {
  // Core state
  const [state, setState] = useState({
    inputText: '',
    isTyping: false,
    currentParameters: {},
    targetParameters: {},
    history: [], // constellation nodes
    context: {
      immediate: null,  // last few seconds
      short: [],        // last few minutes
      long: []          // session memory
    }
  });

  // UI state
  const [showInput, setShowInput] = useState(false);
  const [dissolvingWord, setDissolvingWord] = useState(null);
  const [showConstellation, setShowConstellation] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [contextWord, setContextWord] = useState(null);
  const [focusedHistoryNode, setFocusedHistoryNode] = useState(-1);

  const inputTimeoutRef = useRef(null);
  const morphTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Accessibility hooks
  const { announce, prefersReducedMotion, motionSettings } = useAccessibility();
  const { focusOnKey } = useFocusManagement(inputRef);

  // Connect to audio/visual system
  const {
    initializeWorld,
    setAnticipation,
    triggerMorph,
    blendFromHistory,
    getCurrentParameters
  } = useAudioVisual();

  // First 10 seconds choreography
  useEffect(() => {
    const choreograph = async () => {
      // 0-2s: World is already alive
      await initializeWorld();

      // 2-4s: Sound evolves on its own
      await new Promise(r => setTimeout(r, 2000));

      // 4-7s: Contextual word fades in
      const contextualWord = getContextualWord();
      setContextWord(contextualWord);

      await new Promise(r => setTimeout(r, 1500));

      // Word absorbs into visual
      if (contextualWord) {
        setDissolvingWord({
          text: contextualWord,
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        });
        triggerMorph(contextualWord);

        // Add to history
        addToHistory(contextualWord, true);
      }

      // 7-10s: System ready, waiting
      await new Promise(r => setTimeout(r, 2500));
      setContextWord(null);
      setIsInitialized(true);
    };

    choreograph();

    return () => {
      if (inputTimeoutRef.current) clearTimeout(inputTimeoutRef.current);
      if (morphTimeoutRef.current) clearTimeout(morphTimeoutRef.current);
    };
  }, []);

  // Get contextual word based on time of day and environment
  const getContextualWord = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'dusk';
    if (hour >= 20 || hour < 5) return 'night';

    return 'stillness';
  };


  // Handle text changes - anticipation phase
  const handleTextChange = useCallback((text) => {
    setState(prev => ({
      ...prev,
      inputText: text,
      isTyping: text.length > 0
    }));

    // Clear previous timeout
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }

    // System "dreams" the words - subtle anticipation
    if (text.length > 0) {
      setAnticipation(text);
    }

    // Auto-hide input after inactivity
    inputTimeoutRef.current = setTimeout(() => {
      if (text.length === 0) {
        setShowInput(false);
      }
    }, 3000);
  }, [setAnticipation]);

  // Handle submit - release phase
  const handleSubmit = useCallback((text, position) => {
    if (!text.trim()) return;

    const word = text.trim().toLowerCase();

    // Clear input immediately
    setState(prev => ({
      ...prev,
      inputText: '',
      isTyping: false
    }));
    setShowInput(false);

    // Start dissolving animation
    setDissolvingWord({
      text: word,
      position
    });

    // Delay morph to create anticipation -> release feeling
    const morphDelay = 200 + Math.random() * 200; // 200-400ms

    morphTimeoutRef.current = setTimeout(() => {
      triggerMorph(word);
      addToHistory(word);
    }, morphDelay);
  }, [triggerMorph]);

  // Add word to history constellation
  const addToHistory = useCallback((word, isContext = false) => {
    const node = {
      id: Date.now(),
      word,
      parameters: getCurrentParameters(),
      timestamp: Date.now(),
      isContext,
      position: {
        // Spiral pattern for constellation
        angle: (state.history.length * 0.618) * Math.PI * 2,
        radius: 50 + state.history.length * 15
      }
    };

    setState(prev => ({
      ...prev,
      history: [...prev.history, node],
      context: {
        immediate: word,
        short: [word, ...prev.context.short].slice(0, 10),
        long: [...prev.context.long, word]
      }
    }));
  }, [getCurrentParameters, state.history.length]);

  // Blend from history node
  const handleHistorySelect = useCallback((node) => {
    // Blend past state with current - not replace
    blendFromHistory(node.parameters);

    // Announce selection
    announce(`Blending with "${node.word}"`);

    // Create subtle dissolve effect
    setDissolvingWord({
      text: node.word,
      position: {
        x: window.innerWidth / 2 + Math.cos(node.position.angle) * node.position.radius,
        y: window.innerHeight / 2 + Math.sin(node.position.angle) * node.position.radius
      }
    });
  }, [blendFromHistory, announce]);

  // Clear dissolving word after animation
  const handleDissolveComplete = useCallback(() => {
    setDissolvingWord(null);
  }, []);

  // Keyboard navigation handler (must be after handleHistorySelect)
  const { handleKeyDown: handleNavKeyDown, focusedNodeIndex } = useKeyboardNavigation({
    onToggleConstellation: () => setShowConstellation(prev => !prev),
    onSubmitWord: (text, position) => handleSubmit(text, position),
    onClearInput: () => {
      setState(prev => ({ ...prev, inputText: '' }));
      setShowInput(false);
    },
    onNavigateNode: (index) => setFocusedHistoryNode(index),
    onSelectNode: handleHistorySelect,
    constellationVisible: showConstellation,
    historyNodes: state.history,
  });

  // Global keydown listener - input appears on any keystroke
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!isInitialized) return;

      // Handle keyboard navigation
      handleNavKeyDown(e);

      // Toggle constellation with Tab
      if (e.key === 'Tab') {
        e.preventDefault();
        return;
      }

      // Escape handling
      if (e.key === 'Escape') {
        return;
      }

      // Ignore modifier keys alone
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

      // Show input and focus on any printable key
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setShowInput(true);
        focusOnKey(e);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isInitialized, handleNavKeyDown, focusOnKey]);

  return (
    <>
      {/* Skip link for keyboard users */}
      <SkipLink targetId="main-content" />

      <div
        className="app-container"
        role="application"
        aria-label="Text to music visual experience"
      >
        {/* Screen reader description of current state */}
        <AudioDescription
          currentWord={state.context.immediate}
          parameters={state.currentParameters}
          mood={state.currentParameters.mood || 'calm'}
        />

        {/* The living world - visual canvas would be rendered here */}
        <div
          className="world-layer"
          id="main-content"
          role="main"
          aria-label="Visual canvas"
        />

        {/* Initial context word */}
        {contextWord && !dissolvingWord && (
          <div
            className="context-word"
            role="status"
            aria-label={`Starting with: ${contextWord}`}
          >
            {contextWord}
          </div>
        )}

        {/* History constellation */}
        <Constellation
          history={state.history}
          visible={showConstellation}
          onSelect={handleHistorySelect}
          currentWord={state.context.immediate}
          focusedIndex={focusedNodeIndex}
          ariaLabel="Word history constellation"
        />

        {/* Dissolving word particles */}
        {dissolvingWord && (
          <WordParticles
            word={dissolvingWord.text}
            origin={dissolvingWord.position}
            onComplete={handleDissolveComplete}
            reducedMotion={prefersReducedMotion}
          />
        )}

        {/* Text input - appears on keystroke */}
        <TextInput
          ref={inputRef}
          visible={showInput}
          value={state.inputText}
          onChange={handleTextChange}
          onSubmit={handleSubmit}
          isTyping={state.isTyping}
          ariaLabel="Enter a word to transform the sound"
        />

        {/* Subtle hint for new users */}
        {isInitialized && state.history.length <= 1 && !showInput && (
          <div
            className="hint"
            role="status"
            aria-label="Type any word to begin"
          >
            type anything
          </div>
        )}

        {/* Keyboard shortcuts help (screen reader only) */}
        <div className="sr-only" aria-label="Keyboard shortcuts">
          <h2>Keyboard Controls</h2>
          <ul>
            <li>Tab: Toggle history constellation</li>
            <li>Enter: Submit word</li>
            <li>Escape: Clear input or close constellation</li>
            <li>Arrow keys: Navigate constellation nodes</li>
            <li>Space: Select highlighted node</li>
          </ul>
        </div>
      </div>
    </>
  );
}

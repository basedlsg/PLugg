import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

/**
 * Accessibility Support for Text-Music-Visual
 *
 * Provides:
 * - Reduced motion detection with graceful degradation
 * - Screen reader announcements via ARIA live regions
 * - Keyboard navigation handlers
 * - Focus management utilities
 *
 * Philosophy: Accessible without being clinical.
 * The experience adapts, not diminishes.
 */

// Context for accessibility state
const AccessibilityContext = createContext({
  prefersReducedMotion: false,
  announce: () => {},
  motionSettings: {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

/**
 * Reduced motion settings that maintain experience quality
 * These aren't just "turn everything off" - they're thoughtful alternatives
 */
const FULL_MOTION_SETTINGS = {
  particleCount: 10000,
  morphDuration: 400,
  breathingCycle: 8000,
  trailDecay: 0.95,
  useAnimations: true,
  useCrossfade: false,
  colorShiftOnly: false,
};

const REDUCED_MOTION_SETTINGS = {
  particleCount: 2000,           // Still present, just fewer
  morphDuration: 0,              // Instant
  breathingCycle: 0,             // Static
  trailDecay: 0.5,               // Faster fade
  useAnimations: false,
  useCrossfade: true,            // Smooth crossfade instead of morph
  colorShiftOnly: true,          // Subtle color shift instead of breathing
};

/**
 * AccessibilityProvider
 *
 * Wraps app to provide accessibility context and features
 */
export function AccessibilityProvider({ children }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const announcementIdRef = useRef(0);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Announce to screen readers
  const announce = useCallback((message, priority = 'polite') => {
    const id = ++announcementIdRef.current;

    setAnnouncements(prev => [
      ...prev,
      { id, message, priority }
    ]);

    // Clear after announcement is read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  }, []);

  // Get appropriate motion settings
  const motionSettings = prefersReducedMotion
    ? REDUCED_MOTION_SETTINGS
    : FULL_MOTION_SETTINGS;

  const value = {
    prefersReducedMotion,
    announce,
    motionSettings,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      <ScreenReaderAnnouncements announcements={announcements} />
    </AccessibilityContext.Provider>
  );
}

/**
 * ScreenReaderAnnouncements
 *
 * ARIA live regions for dynamic content updates
 * Visually hidden but announced to screen readers
 */
function ScreenReaderAnnouncements({ announcements }) {
  const politeAnnouncements = announcements.filter(a => a.priority === 'polite');
  const assertiveAnnouncements = announcements.filter(a => a.priority === 'assertive');

  return (
    <>
      {/* Polite announcements - wait for pause in speech */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncements.map(a => (
          <p key={a.id}>{a.message}</p>
        ))}
      </div>

      {/* Assertive announcements - interrupt immediately */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveAnnouncements.map(a => (
          <p key={a.id}>{a.message}</p>
        ))}
      </div>
    </>
  );
}

/**
 * AudioDescription
 *
 * Describes current audio/visual state for screen readers
 * Updates when parameters change significantly
 */
export function AudioDescription({
  currentWord,
  parameters = {},
  mood = 'calm'
}) {
  const { announce } = useAccessibility();
  const prevWordRef = useRef(null);
  const prevMoodRef = useRef(null);

  // Describe parameter levels in human terms
  const describeBrilliance = (value) => {
    if (value < 0.3) return 'soft and muted';
    if (value < 0.6) return 'warm and present';
    if (value < 0.8) return 'bright and clear';
    return 'brilliant and sparkling';
  };

  const describeSpace = (value) => {
    if (value < 0.3) return 'intimate';
    if (value < 0.6) return 'open';
    if (value < 0.8) return 'expansive';
    return 'vast and reverberant';
  };

  const describeMovement = (value) => {
    if (value < 0.3) return 'still';
    if (value < 0.6) return 'gently flowing';
    if (value < 0.8) return 'active';
    return 'dynamic and swirling';
  };

  // Announce significant changes
  useEffect(() => {
    if (currentWord && currentWord !== prevWordRef.current) {
      const brillianceDesc = describeBrilliance(parameters.brilliance || 0.5);
      const spaceDesc = describeSpace(parameters.space || 0.5);

      announce(
        `Sound transformed to "${currentWord}". ` +
        `Tone is ${brillianceDesc}, space is ${spaceDesc}.`
      );

      prevWordRef.current = currentWord;
    }
  }, [currentWord, parameters, announce]);

  // Announce mood changes
  useEffect(() => {
    if (mood && mood !== prevMoodRef.current && prevMoodRef.current !== null) {
      announce(`Visual mood shifted to ${mood}.`);
      prevMoodRef.current = mood;
    } else if (mood && prevMoodRef.current === null) {
      prevMoodRef.current = mood;
    }
  }, [mood, announce]);

  // Visual description (hidden)
  const movementDesc = describeMovement(parameters.movement || 0.5);

  return (
    <div className="sr-only" aria-hidden="false">
      <h2>Current State</h2>
      <p>
        {currentWord
          ? `Playing: ${currentWord}. ${describeBrilliance(parameters.brilliance || 0.5)} tone, ${describeSpace(parameters.space || 0.5)} space, ${movementDesc} movement.`
          : 'Ambient sound playing. Type any word to transform the sound.'
        }
      </p>
    </div>
  );
}

/**
 * useKeyboardNavigation
 *
 * Hook for comprehensive keyboard navigation
 * Returns handlers and current navigation state
 */
export function useKeyboardNavigation({
  onToggleConstellation,
  onSubmitWord,
  onClearInput,
  onNavigateNode,
  onSelectNode,
  constellationVisible,
  historyNodes = [],
}) {
  const [focusedNodeIndex, setFocusedNodeIndex] = useState(-1);
  const { announce } = useAccessibility();

  // Reset focus when constellation closes
  useEffect(() => {
    if (!constellationVisible) {
      setFocusedNodeIndex(-1);
    }
  }, [constellationVisible]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    // Tab: Toggle constellation
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const newVisible = !constellationVisible;
      onToggleConstellation();

      if (newVisible) {
        announce('History constellation opened. Use arrow keys to navigate, Space to select.');
      } else {
        announce('History constellation closed.');
      }
      return;
    }

    // Escape: Clear input or close constellation
    if (e.key === 'Escape') {
      if (constellationVisible) {
        onToggleConstellation();
        announce('History constellation closed.');
      } else {
        onClearInput();
        announce('Input cleared.');
      }
      return;
    }

    // Arrow navigation within constellation
    if (constellationVisible && historyNodes.length > 0) {
      let newIndex = focusedNodeIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(focusedNodeIndex + 1, historyNodes.length - 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(focusedNodeIndex - 1, 0);
          break;
        case ' ':
          e.preventDefault();
          if (focusedNodeIndex >= 0 && historyNodes[focusedNodeIndex]) {
            onSelectNode(historyNodes[focusedNodeIndex]);
            announce(`Selected: ${historyNodes[focusedNodeIndex].word}`);
          }
          return;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = historyNodes.length - 1;
          break;
        default:
          return;
      }

      if (newIndex !== focusedNodeIndex && newIndex >= 0) {
        setFocusedNodeIndex(newIndex);
        const node = historyNodes[newIndex];
        if (node) {
          onNavigateNode(newIndex);
          announce(`${node.word}, ${newIndex + 1} of ${historyNodes.length}`);
        }
      }
    }
  }, [
    constellationVisible,
    focusedNodeIndex,
    historyNodes,
    onToggleConstellation,
    onClearInput,
    onSelectNode,
    onNavigateNode,
    announce
  ]);

  return {
    handleKeyDown,
    focusedNodeIndex,
    setFocusedNodeIndex,
  };
}

/**
 * useFocusManagement
 *
 * Utilities for managing focus state
 */
export function useFocusManagement(inputRef) {
  const trapRef = useRef(null);

  // Focus input on any printable key
  const focusOnKey = useCallback((e) => {
    if (
      inputRef.current &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  // Create focus trap for modal-like elements
  const createFocusTrap = useCallback((containerRef) => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTrapKeydown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleTrapKeydown);
    trapRef.current = { container: containerRef.current, handler: handleTrapKeydown };

    // Focus first element
    firstElement.focus();

    return () => {
      if (trapRef.current) {
        trapRef.current.container.removeEventListener('keydown', trapRef.current.handler);
      }
    };
  }, []);

  // Release focus trap
  const releaseFocusTrap = useCallback(() => {
    if (trapRef.current) {
      trapRef.current.container.removeEventListener('keydown', trapRef.current.handler);
      trapRef.current = null;
    }
  }, []);

  return {
    focusOnKey,
    createFocusTrap,
    releaseFocusTrap,
  };
}

/**
 * SkipLink
 *
 * Allow keyboard users to skip to main content
 */
export function SkipLink({ targetId = 'main-content' }) {
  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
    >
      Skip to main content
    </a>
  );
}

/**
 * ReducedMotionAlternative
 *
 * Wrapper that provides alternative rendering for reduced motion
 */
export function ReducedMotionAlternative({
  children,
  alternative,
  className = ''
}) {
  const { prefersReducedMotion } = useAccessibility();

  return (
    <div className={`${className} ${prefersReducedMotion ? 'reduced-motion' : ''}`}>
      {prefersReducedMotion ? alternative : children}
    </div>
  );
}

/**
 * VisualMoodDescription
 *
 * Translates visual parameters into descriptive text
 */
export function VisualMoodDescription({ parameters = {} }) {
  const getMoodDescription = () => {
    const {
      brilliance = 0.5,
      warmth = 0.5,
      space = 0.5,
      movement = 0.5,
      texture = 0.5
    } = parameters;

    const descriptors = [];

    // Overall brightness
    if (brilliance > 0.7) {
      descriptors.push('radiant');
    } else if (brilliance < 0.3) {
      descriptors.push('subdued');
    }

    // Temperature
    if (warmth > 0.7) {
      descriptors.push('warm golden');
    } else if (warmth < 0.3) {
      descriptors.push('cool blue');
    }

    // Spatial quality
    if (space > 0.7) {
      descriptors.push('expansive');
    } else if (space < 0.3) {
      descriptors.push('intimate');
    }

    // Movement
    if (movement > 0.7) {
      descriptors.push('flowing');
    } else if (movement < 0.3) {
      descriptors.push('still');
    }

    // Texture
    if (texture > 0.7) {
      descriptors.push('complex');
    } else if (texture < 0.3) {
      descriptors.push('smooth');
    }

    if (descriptors.length === 0) {
      return 'balanced and calm';
    }

    return descriptors.join(', ');
  };

  return (
    <span className="sr-only">
      Visual mood: {getMoodDescription()}
    </span>
  );
}

export default AccessibilityProvider;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { allSequences, getSequenceNames } from './sequences';

/**
 * DemoPlayer Component
 *
 * Auto-plays demo sequences with timing control.
 * Features: play/pause, skip, loop, progress indicator
 */
export default function DemoPlayer({
  onWordTrigger,
  initialSequence = 'elements',
  autoStart = false,
  showControls = true,
  className = ''
}) {
  // State
  const [currentSequence, setCurrentSequence] = useState(initialSequence);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [loop, setLoop] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  // Refs
  const startTimeRef = useRef(null);
  const pauseTimeRef = useRef(0);
  const timeoutsRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Get current sequence data
  const sequence = allSequences[currentSequence];
  const words = sequence?.words || [];

  // Clear all scheduled timeouts
  const clearScheduledTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Update progress bar
  const updateProgress = useCallback(() => {
    if (!isPlaying || isPaused || !startTimeRef.current || !sequence) return;

    const elapsed = Date.now() - startTimeRef.current;
    const progressPercent = Math.min((elapsed / sequence.duration) * 100, 100);
    setProgress(progressPercent);

    if (progressPercent < 100) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying, isPaused, sequence]);

  // Schedule word triggers
  const scheduleWords = useCallback((fromIndex = 0, offset = 0) => {
    if (!sequence || !isPlaying) return;

    words.forEach((wordData, index) => {
      if (index < fromIndex) return;

      const delay = wordData.delay - offset;
      if (delay < 0) return;

      const timeout = setTimeout(() => {
        setCurrentWordIndex(index);
        if (onWordTrigger) {
          onWordTrigger(wordData.word, wordData);
        }
      }, delay);

      timeoutsRef.current.push(timeout);
    });

    // Schedule end of sequence
    const endDelay = sequence.duration - offset;
    const endTimeout = setTimeout(() => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
      setProgress(100);

      if (loop) {
        // Restart after a brief pause
        setTimeout(() => {
          play();
        }, 1000);
      }
    }, endDelay);

    timeoutsRef.current.push(endTimeout);
  }, [sequence, words, isPlaying, loop, onWordTrigger]);

  // Play sequence
  const play = useCallback(() => {
    clearScheduledTimeouts();
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    setProgress(0);
    startTimeRef.current = Date.now();
    pauseTimeRef.current = 0;

    scheduleWords(0, 0);
    requestAnimationFrame(updateProgress);
  }, [clearScheduledTimeouts, scheduleWords, updateProgress]);

  // Pause playback
  const pause = useCallback(() => {
    if (!isPlaying || isPaused) return;

    clearScheduledTimeouts();
    setIsPaused(true);
    pauseTimeRef.current = Date.now() - startTimeRef.current;
  }, [isPlaying, isPaused, clearScheduledTimeouts]);

  // Resume playback
  const resume = useCallback(() => {
    if (!isPlaying || !isPaused) return;

    setIsPaused(false);
    startTimeRef.current = Date.now() - pauseTimeRef.current;

    // Find next word index
    const elapsed = pauseTimeRef.current;
    let nextIndex = 0;
    for (let i = 0; i < words.length; i++) {
      if (words[i].delay > elapsed) {
        nextIndex = i;
        break;
      }
    }

    scheduleWords(nextIndex, elapsed);
    requestAnimationFrame(updateProgress);
  }, [isPlaying, isPaused, words, scheduleWords, updateProgress]);

  // Stop playback
  const stop = useCallback(() => {
    clearScheduledTimeouts();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    setProgress(0);
    startTimeRef.current = null;
    pauseTimeRef.current = 0;
  }, [clearScheduledTimeouts]);

  // Skip to next word
  const skipNext = useCallback(() => {
    if (!isPlaying) return;

    const nextIndex = currentWordIndex + 1;
    if (nextIndex >= words.length) {
      stop();
      if (loop) play();
      return;
    }

    clearScheduledTimeouts();

    const wordData = words[nextIndex];
    setCurrentWordIndex(nextIndex);
    if (onWordTrigger) {
      onWordTrigger(wordData.word, wordData);
    }

    // Update start time to match current word's delay
    startTimeRef.current = Date.now() - wordData.delay;

    // Schedule remaining words
    scheduleWords(nextIndex + 1, wordData.delay);
    requestAnimationFrame(updateProgress);
  }, [isPlaying, currentWordIndex, words, clearScheduledTimeouts, scheduleWords, updateProgress, stop, loop, play, onWordTrigger]);

  // Skip to previous word
  const skipPrev = useCallback(() => {
    if (!isPlaying) return;

    const prevIndex = Math.max(0, currentWordIndex - 1);
    clearScheduledTimeouts();

    const wordData = words[prevIndex];
    setCurrentWordIndex(prevIndex);
    if (onWordTrigger) {
      onWordTrigger(wordData.word, wordData);
    }

    // Update start time to match current word's delay
    startTimeRef.current = Date.now() - wordData.delay;

    // Schedule remaining words
    scheduleWords(prevIndex + 1, wordData.delay);
    requestAnimationFrame(updateProgress);
  }, [isPlaying, currentWordIndex, words, clearScheduledTimeouts, scheduleWords, updateProgress, onWordTrigger]);

  // Change sequence
  const changeSequence = useCallback((sequenceName) => {
    stop();
    setCurrentSequence(sequenceName);
    setShowSelector(false);
  }, [stop]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!isPlaying) {
      play();
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPlaying, isPaused, play, resume, pause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearScheduledTimeouts();
    };
  }, [clearScheduledTimeouts]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !isPlaying) {
      play();
    }
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Current word data
  const currentWord = currentWordIndex >= 0 ? words[currentWordIndex] : null;

  if (!showControls) {
    return null;
  }

  return (
    <div className={`demo-player ${className}`} style={styles.container}>
      {/* Current word display */}
      <div style={styles.wordDisplay}>
        <span style={styles.currentWord}>
          {currentWord ? currentWord.word : sequence?.name || 'Demo'}
        </span>
        {currentWord?.description && (
          <span style={styles.description}>{currentWord.description}</span>
        )}
      </div>

      {/* Progress bar */}
      <div style={styles.progressContainer}>
        <div style={{ ...styles.progressBar, width: `${progress}%` }} />
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        {/* Sequence selector */}
        <div style={styles.selectorContainer}>
          <button
            onClick={() => setShowSelector(!showSelector)}
            style={styles.button}
            title="Select sequence"
          >
            {sequence?.name || 'Select'}
          </button>
          {showSelector && (
            <div style={styles.dropdown}>
              {getSequenceNames().map(name => (
                <button
                  key={name}
                  onClick={() => changeSequence(name)}
                  style={{
                    ...styles.dropdownItem,
                    ...(name === currentSequence ? styles.dropdownItemActive : {})
                  }}
                >
                  {allSequences[name].name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Playback controls */}
        <div style={styles.playbackControls}>
          <button
            onClick={skipPrev}
            style={styles.button}
            disabled={!isPlaying || currentWordIndex <= 0}
            title="Previous word"
          >
            {'<<'}
          </button>

          <button
            onClick={togglePlay}
            style={styles.playButton}
            title={isPlaying && !isPaused ? 'Pause' : 'Play'}
          >
            {isPlaying && !isPaused ? '||' : '>'}
          </button>

          <button
            onClick={skipNext}
            style={styles.button}
            disabled={!isPlaying}
            title="Next word"
          >
            {'>>'}
          </button>

          <button
            onClick={stop}
            style={styles.button}
            disabled={!isPlaying}
            title="Stop"
          >
            {'[]'}
          </button>
        </div>

        {/* Loop toggle */}
        <button
          onClick={() => setLoop(!loop)}
          style={{
            ...styles.button,
            ...(loop ? styles.buttonActive : {})
          }}
          title={loop ? 'Loop on' : 'Loop off'}
        >
          Loop
        </button>
      </div>

      {/* Word progress indicator */}
      {isPlaying && (
        <div style={styles.wordProgress}>
          {currentWordIndex + 1} / {words.length}
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '12px',
    padding: '16px 24px',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    zIndex: 1000,
    minWidth: '320px',
    backdropFilter: 'blur(10px)'
  },

  wordDisplay: {
    textAlign: 'center',
    marginBottom: '12px'
  },

  currentWord: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '300',
    letterSpacing: '0.1em',
    marginBottom: '4px'
  },

  description: {
    display: 'block',
    fontSize: '12px',
    opacity: 0.6,
    fontStyle: 'italic'
  },

  progressContainer: {
    height: '3px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
    marginBottom: '12px',
    overflow: 'hidden'
  },

  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #4a9eff, #a855f7)',
    borderRadius: '2px',
    transition: 'width 0.1s linear'
  },

  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px'
  },

  selectorContainer: {
    position: 'relative'
  },

  dropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    background: 'rgba(0, 0, 0, 0.95)',
    borderRadius: '8px',
    padding: '8px',
    marginBottom: '8px',
    minWidth: '180px',
    maxHeight: '200px',
    overflowY: 'auto'
  },

  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    background: 'transparent',
    color: '#fff',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '13px'
  },

  dropdownItemActive: {
    background: 'rgba(74, 158, 255, 0.3)'
  },

  playbackControls: {
    display: 'flex',
    gap: '8px'
  },

  button: {
    padding: '8px 12px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '6px',
    background: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s'
  },

  playButton: {
    padding: '8px 16px',
    border: '1px solid rgba(74, 158, 255, 0.5)',
    borderRadius: '6px',
    background: 'rgba(74, 158, 255, 0.2)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },

  buttonActive: {
    background: 'rgba(74, 158, 255, 0.3)',
    borderColor: 'rgba(74, 158, 255, 0.5)'
  },

  wordProgress: {
    position: 'absolute',
    top: '8px',
    right: '12px',
    fontSize: '11px',
    opacity: 0.5
  }
};

// Export additional utilities
export { allSequences, getSequenceNames };

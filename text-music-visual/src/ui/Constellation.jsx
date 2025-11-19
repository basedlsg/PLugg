import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import eventBus, { Events } from '../core/EventBus';

/**
 * Constellation Component
 *
 * History visualization as a personal cosmology:
 * - Each word becomes a star/node in spiral arrangement
 * - Current state glows brightest with pulsing
 * - Past states fade with age but never disappear
 * - Clicking blends with current (not replaces)
 * - Long press returns fully to that state
 * - Whole constellation breathes subtly
 */

// Layout constants
const CENTER_X = 0;
const CENTER_Y = 0;
const GOLDEN_ANGLE = 2.39996; // ~137.5 degrees in radians
const SPIRAL_SCALE = 20;

// Interaction timing
const LONG_PRESS_DURATION = 500; // ms
const BLEND_DURATION = 300; // ms
const PREVIEW_DURATION = 150; // ms for hover sound preview

/**
 * Calculate spiral position for a node
 */
function positionNode(index, total) {
  const angle = index * GOLDEN_ANGLE;
  const radius = Math.sqrt(index + 1) * SPIRAL_SCALE;
  return {
    x: CENTER_X + Math.cos(angle) * radius,
    y: CENTER_Y + Math.sin(angle) * radius,
    angle,
    radius
  };
}

/**
 * Star Node Component - individual history point
 */
function StarNode({
  node,
  index,
  isCurrent,
  isFocused,
  brightness,
  onSelect,
  onPreview,
  onLongPress
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const pressTimerRef = useRef(null);
  const pressStartRef = useRef(null);

  // Calculate size based on brightness and current state
  const baseSize = isCurrent ? 8 : 4 + brightness * 3;
  const glowSize = baseSize * 3;

  // Handle mouse/touch down - start press timer
  const handlePressStart = useCallback((e) => {
    e.preventDefault();
    setIsPressed(true);
    pressStartRef.current = Date.now();

    // Start long press timer
    pressTimerRef.current = setTimeout(() => {
      // Long press - return fully to that state
      onLongPress(node);
      setIsPressed(false);
    }, LONG_PRESS_DURATION);
  }, [node, onLongPress]);

  // Handle mouse/touch up - determine click vs long press
  const handlePressEnd = useCallback((e) => {
    e.preventDefault();

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (isPressed && pressStartRef.current) {
      const pressDuration = Date.now() - pressStartRef.current;

      if (pressDuration < LONG_PRESS_DURATION) {
        // Short click - 50/50 blend
        onSelect(node);
      }
    }

    setIsPressed(false);
    pressStartRef.current = null;
  }, [isPressed, node, onSelect]);

  // Handle hover enter
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onPreview(node, true);
  }, [node, onPreview]);

  // Handle hover leave
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
    onPreview(node, false);

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, [node, onPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  return (
    <g
      className={`star-node ${isCurrent ? 'current' : ''} ${isHovered ? 'hovered' : ''} ${isPressed ? 'pressed' : ''} ${isFocused ? 'focused' : ''}`}
      transform={`translate(${node.x}, ${node.y})`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`${node.word}${isCurrent ? ', current selection' : ''}`}
      aria-pressed={isPressed}
      tabIndex={isFocused ? 0 : -1}
    >
      {/* Outer glow - larger diffuse area */}
      <circle
        r={glowSize}
        fill="currentColor"
        opacity={brightness * 0.08}
        className="star-glow-outer"
      />

      {/* Inner glow */}
      <circle
        r={glowSize * 0.6}
        fill="currentColor"
        opacity={brightness * 0.15}
        className="star-glow-inner"
      />

      {/* Core star */}
      <circle
        r={baseSize}
        fill="currentColor"
        opacity={brightness}
        className="star-core"
      />

      {/* Bright center point */}
      <circle
        r={baseSize * 0.3}
        fill="white"
        opacity={brightness * 0.8}
        className="star-center"
      />

      {/* Label - visible on hover */}
      <text
        y={baseSize + 16}
        textAnchor="middle"
        className="star-label"
        opacity={isHovered ? 1 : 0}
        fill="currentColor"
        fontSize="10"
        fontFamily="inherit"
      >
        {node.word}
      </text>

      {/* Press indicator ring */}
      {isPressed && (
        <circle
          r={baseSize + 4}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
          className="press-indicator"
        />
      )}
    </g>
  );
}

/**
 * Main Constellation Component
 */
export default function Constellation({
  history,
  visible,
  onSelect,
  currentWord,
  focusedIndex = -1,
  ariaLabel = 'Word history constellation'
}) {
  const containerRef = useRef(null);
  const [breathPhase, setBreathPhase] = useState(0);
  const [touchStartY, setTouchStartY] = useState(null);
  const animationRef = useRef(null);

  // Calculate node positions and properties
  const nodes = useMemo(() => {
    return history.map((item, index) => {
      const position = positionNode(index, history.length);
      const isCurrent = item.word === currentWord;
      const age = (Date.now() - item.timestamp) / 1000; // seconds

      // Brightness fades with age but never fully disappears
      // Current state is always brightest
      const brightness = isCurrent ? 1 : Math.max(0.15, 1 - age / 600);

      return {
        ...item,
        x: position.x,
        y: position.y,
        brightness,
        isCurrent,
        index
      };
    });
  }, [history, currentWord]);

  // Calculate connection lines between sequential nodes
  const connections = useMemo(() => {
    if (nodes.length < 2) return [];

    return nodes.slice(1).map((node, index) => {
      const prev = nodes[index];
      return {
        id: `conn-${prev.id}-${node.id}`,
        x1: prev.x,
        y1: prev.y,
        x2: node.x,
        y2: node.y,
        opacity: Math.min(prev.brightness, node.brightness) * 0.2
      };
    });
  }, [nodes]);

  // Breathing animation loop
  useEffect(() => {
    if (!visible) return;

    let startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      // Slow breathing cycle: 4 seconds per breath
      const phase = (Math.sin(elapsed / 2000) + 1) / 2;
      setBreathPhase(phase);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [visible]);

  // Handle node selection (click - 50/50 blend)
  const handleNodeSelect = useCallback((node) => {
    // Emit event for parameter blending
    eventBus.emit(Events.HISTORY_SELECTED, {
      node,
      blendRatio: 0.5,
      duration: BLEND_DURATION
    });

    // Also emit for constellation-specific handling
    eventBus.emit('constellation:select', {
      parameters: node.parameters,
      duration: BLEND_DURATION
    });

    // Call parent handler
    if (onSelect) {
      onSelect(node);
    }
  }, [onSelect]);

  // Handle long press - return fully to that state
  const handleLongPress = useCallback((node) => {
    // Emit event for full parameter return
    eventBus.emit(Events.HISTORY_SELECTED, {
      node,
      blendRatio: 1.0,
      duration: BLEND_DURATION * 2
    });

    eventBus.emit('constellation:select', {
      parameters: node.parameters,
      duration: BLEND_DURATION * 2
    });

    if (onSelect) {
      onSelect(node);
    }
  }, [onSelect]);

  // Handle hover preview
  const handlePreview = useCallback((node, isEntering) => {
    eventBus.emit('history:preview', {
      node,
      active: isEntering,
      duration: PREVIEW_DURATION
    });
  }, []);

  // Handle swipe up gesture to show constellation
  const handleTouchStart = useCallback((e) => {
    setTouchStartY(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartY === null) return;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;

    // Swipe up threshold: 50px
    if (deltaY > 50 && !visible) {
      // Emit toggle event
      eventBus.emit('constellation:toggle', { visible: true });
    } else if (deltaY < -50 && visible) {
      // Swipe down to hide
      eventBus.emit('constellation:toggle', { visible: false });
    }

    setTouchStartY(null);
  }, [touchStartY, visible]);

  // Calculate breathing transform
  const breathScale = 1 + breathPhase * 0.02; // Subtle 2% scale change
  const breathOpacity = 0.85 + breathPhase * 0.15; // Slight opacity pulse

  // Calculate viewBox based on content
  const viewBoxPadding = 100;
  const maxRadius = nodes.length > 0
    ? Math.max(...nodes.map(n => Math.sqrt(n.x * n.x + n.y * n.y))) + viewBoxPadding
    : 200;
  const viewBox = `-${maxRadius} -${maxRadius} ${maxRadius * 2} ${maxRadius * 2}`;

  return (
    <div
      ref={containerRef}
      className={`constellation-container ${visible ? 'visible' : 'hidden'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label={ariaLabel}
      aria-hidden={!visible}
    >
      <svg
        className="constellation-svg"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{
          transform: `scale(${breathScale})`,
          opacity: breathOpacity
        }}
      >
        {/* Definitions for filters and gradients */}
        <defs>
          {/* Glow filter for current node */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pulse animation for current state */}
          <radialGradient id="pulseGradient">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Connection lines */}
        <g className="connections">
          {connections.map((conn) => (
            <line
              key={conn.id}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke="currentColor"
              strokeOpacity={conn.opacity}
              strokeWidth="0.5"
              className="connection-line"
            />
          ))}
        </g>

        {/* Center point - origin marker */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r="2"
          fill="currentColor"
          opacity="0.3"
          className="constellation-center"
        />

        {/* Star nodes */}
        <g className="stars" role="group" aria-label="History nodes">
          {nodes.map((node, idx) => (
            <StarNode
              key={node.id}
              node={node}
              index={node.index}
              isCurrent={node.isCurrent}
              isFocused={idx === focusedIndex}
              brightness={node.brightness}
              onSelect={handleNodeSelect}
              onPreview={handlePreview}
              onLongPress={handleLongPress}
            />
          ))}
        </g>

        {/* Current state pulsing ring */}
        {nodes.find(n => n.isCurrent) && (
          <g className="current-pulse">
            {(() => {
              const current = nodes.find(n => n.isCurrent);
              return (
                <circle
                  cx={current.x}
                  cy={current.y}
                  r={12 + breathPhase * 4}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity={0.3 - breathPhase * 0.2}
                  className="pulse-ring"
                />
              );
            })()}
          </g>
        )}
      </svg>

      {/* Toggle hint */}
      <div className="constellation-hint">
        <span className="hint-key">Tab</span> or swipe to {visible ? 'hide' : 'show'}
      </div>

      {/* Interaction hint */}
      {visible && nodes.length > 0 && (
        <div className="constellation-instructions">
          <span>Click to blend</span>
          <span className="separator">|</span>
          <span>Hold to return</span>
        </div>
      )}
    </div>
  );
}

// CSS styles for the Constellation component
// These should be added to styles.css
export const constellationStyles = `
/* Constellation Container */
.constellation-container {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 100;
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.4s ease-out, transform 0.4s ease-out;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%);
}

.constellation-container.visible {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.constellation-container.hidden {
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
}

/* SVG Canvas */
.constellation-svg {
  width: 80vmin;
  height: 80vmin;
  max-width: 600px;
  max-height: 600px;
  color: currentColor;
  transition: transform 0.1s ease-out;
}

/* Star Nodes */
.star-node {
  transition: transform 0.2s ease-out;
}

.star-node:hover {
  transform: scale(1.2);
}

.star-node.pressed {
  transform: scale(0.9);
}

.star-node.current .star-core {
  filter: url(#glow);
}

/* Star Glow Animation */
.star-glow-outer,
.star-glow-inner {
  transition: opacity 0.3s ease-out;
}

.star-node:hover .star-glow-outer {
  opacity: 0.2;
}

.star-node:hover .star-glow-inner {
  opacity: 0.3;
}

/* Star Label */
.star-label {
  transition: opacity 0.2s ease-out;
  pointer-events: none;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
  font-weight: 300;
  letter-spacing: 0.05em;
}

/* Connection Lines */
.connection-line {
  transition: opacity 0.3s ease-out;
}

/* Pulse Ring */
.pulse-ring {
  animation: pulse-fade 4s ease-in-out infinite;
}

@keyframes pulse-fade {
  0%, 100% {
    opacity: 0.3;
    r: 12;
  }
  50% {
    opacity: 0.1;
    r: 16;
  }
}

/* Press Indicator */
.press-indicator {
  animation: press-grow 0.5s ease-out forwards;
}

@keyframes press-grow {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* Hints */
.constellation-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  opacity: 0.4;
  transition: opacity 0.3s ease-out;
  pointer-events: none;
}

.constellation-hint .hint-key {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin-right: 4px;
  font-family: monospace;
}

.constellation-container:hover .constellation-hint {
  opacity: 0.6;
}

.constellation-instructions {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  opacity: 0.3;
  pointer-events: none;
  display: flex;
  gap: 8px;
}

.constellation-instructions .separator {
  opacity: 0.5;
}

/* Center Point */
.constellation-center {
  animation: center-pulse 6s ease-in-out infinite;
}

@keyframes center-pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.15;
  }
}

/* Current Node Breathing */
.star-node.current .star-core {
  animation: star-breathe 4s ease-in-out infinite;
}

@keyframes star-breathe {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.1);
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .constellation-svg {
    width: 90vmin;
    height: 90vmin;
  }

  .star-label {
    font-size: 12px;
  }

  .constellation-hint {
    bottom: 40px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .constellation-container {
    transition: opacity 0.2s ease-out;
  }

  .star-node.current .star-core,
  .pulse-ring,
  .constellation-center {
    animation: none;
  }

  .constellation-svg {
    transition: none;
  }
}
`;

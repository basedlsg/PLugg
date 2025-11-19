import React, { useEffect, useState, useMemo } from 'react';

/**
 * WordParticles Component
 *
 * Animates word dissolving into particles that:
 * - Float upward
 * - Spread and fade
 * - Absorb into the visual world
 */
export default function WordParticles({
  word,
  origin,
  onComplete,
  reducedMotion = false
}) {
  const [phase, setPhase] = useState('gathering'); // gathering -> dissolving -> absorbed

  // Timing adjusted for reduced motion
  const timings = reducedMotion
    ? { gather: 50, dissolve: 150, complete: 300 }
    : { gather: 100, dissolve: 600, complete: 1000 };

  // Generate particles from word characters
  const particles = useMemo(() => {
    const chars = word.split('');
    return chars.map((char, index) => {
      const offsetX = (index - chars.length / 2) * 20;
      const angle = (Math.random() - 0.5) * Math.PI;
      const distance = reducedMotion ? 20 : 50 + Math.random() * 100;

      return {
        id: index,
        char,
        startX: offsetX,
        startY: 0,
        endX: reducedMotion ? offsetX : Math.sin(angle) * distance,
        endY: reducedMotion ? -20 : -distance - Math.random() * 50,
        rotation: reducedMotion ? 0 : (Math.random() - 0.5) * 360,
        delay: reducedMotion ? 0 : index * 30, // No stagger in reduced motion
        duration: reducedMotion ? 100 : 400 + Math.random() * 200
      };
    });
  }, [word, reducedMotion]);

  // Animation sequence
  useEffect(() => {
    // Phase 1: Show word briefly
    const gatherTimer = setTimeout(() => {
      setPhase('dissolving');
    }, timings.gather);

    // Phase 2: Dissolve into particles
    const dissolveTimer = setTimeout(() => {
      setPhase('absorbed');
    }, timings.dissolve);

    // Phase 3: Complete
    const completeTimer = setTimeout(() => {
      onComplete();
    }, timings.complete);

    return () => {
      clearTimeout(gatherTimer);
      clearTimeout(dissolveTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, timings]);

  return (
    <div
      className={`word-particles phase-${phase} ${reducedMotion ? 'reduced-motion' : ''}`}
      style={{
        left: origin.x,
        top: origin.y,
        transform: 'translate(-50%, -50%)'
      }}
      aria-hidden="true"
    >
      {/* Whole word briefly visible */}
      <div className="word-whole">
        {word}
      </div>

      {/* Individual character particles */}
      <div className="particles-container">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="particle"
            style={{
              '--start-x': `${particle.startX}px`,
              '--start-y': `${particle.startY}px`,
              '--end-x': `${particle.endX}px`,
              '--end-y': `${particle.endY}px`,
              '--rotation': `${particle.rotation}deg`,
              '--delay': `${particle.delay}ms`,
              '--duration': `${particle.duration}ms`
            }}
          >
            {particle.char}
          </span>
        ))}
      </div>

      {/* Absorption glow */}
      <div className="absorption-glow" />
    </div>
  );
}

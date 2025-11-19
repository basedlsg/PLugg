import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

/**
 * TextInput Component
 *
 * A dissolving input field that:
 * - Appears on any keystroke
 * - Dissolves after Enter
 * - No clicking required to type again
 */
const TextInput = forwardRef(function TextInput({
  visible,
  value,
  onChange,
  onSubmit,
  isTyping,
  ariaLabel = 'Enter a word to transform the sound'
}, ref) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [isDissolving, setIsDissolving] = useState(false);

  // Expose focus method to parent via ref
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  // Auto-focus when visible
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  // Handle input changes
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  // Handle key events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();

      // Get position for particle origin
      const rect = containerRef.current?.getBoundingClientRect();
      const position = rect ? {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      } : {
        x: window.innerWidth / 2,
        y: window.innerHeight - 100
      };

      // Trigger dissolve animation
      setIsDissolving(true);

      // Submit after brief delay for dissolve effect
      setTimeout(() => {
        onSubmit(value, position);
        setIsDissolving(false);
      }, 100);
    }

    if (e.key === 'Escape') {
      onChange('');
    }
  };

  // Calculate breathing animation intensity based on typing state
  const breathingIntensity = isTyping ? 1 : 0.3;

  return (
    <div
      ref={containerRef}
      className={`text-input-container ${visible ? 'visible' : ''} ${isDissolving ? 'dissolving' : ''}`}
      style={{
        '--breathing-intensity': breathingIntensity
      }}
    >
      <div className="input-glow" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="text-input"
        placeholder=""
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        aria-label={ariaLabel}
        aria-describedby="input-instructions"
      />
      <span id="input-instructions" className="sr-only">
        Type a word and press Enter to transform the sound. Press Escape to clear.
      </span>
      <div className="input-underline">
        <div
          className="underline-fill"
          style={{
            transform: `scaleX(${value.length > 0 ? 1 : 0})`
          }}
        />
      </div>
    </div>
  );
});

export default TextInput;

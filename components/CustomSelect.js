'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ options, value, onChange, placeholder = "Pilih...", style, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`custom-select-wrapper ${className || ''}`} ref={wrapperRef} style={{ position: 'relative', minWidth: '140px', ...style }}>
      <div 
        className="form-input flex items-center justify-between cursor-pointer"
        style={{ 
          background: 'var(--bg-input)', 
          padding: '10px 12px 10px 16px',
          height: '100%',
          margin: 0,
          ...style
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'inherit' : 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} color="var(--text-secondary)" style={{ marginLeft: '8px', flexShrink: 0 }} />
      </div>

      {isOpen && (
        <div className="select-dropdown animate-fade-in-up" style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, 
          background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', 
          zIndex: 50, boxShadow: 'var(--shadow-md)', maxHeight: '250px', overflowY: 'auto', padding: '4px'
        }}>
          {options.map(opt => (
            <div 
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-sm)',
                background: opt.value === value ? 'var(--primary-bg)' : 'transparent',
                color: opt.value === value ? 'var(--primary)' : 'inherit',
                marginBottom: '2px',
                transition: 'background var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.target.style.background = opt.value === value ? 'var(--primary-bg)' : 'var(--bg-root)'}
              onMouseLeave={(e) => e.target.style.background = opt.value === value ? 'var(--primary-bg)' : 'transparent'}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

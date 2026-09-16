'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function SearchableSelect({ options, value, onChange, placeholder, disabled, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="searchable-select" ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className={`form-input flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        style={{ borderColor: error ? 'var(--danger)' : undefined, background: disabled ? 'var(--bg-root)' : 'var(--bg-input)' }}
        onClick={() => { if (!disabled) { setIsOpen(!isOpen); setSearch(''); } }}
      >
        <span style={{ color: selectedOption ? 'inherit' : 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} color="var(--text-secondary)" />
      </div>

      {isOpen && (
        <div className="select-dropdown animate-fade-in-up" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, 
          background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', 
          marginTop: '4px', zIndex: 50, boxShadow: 'var(--shadow-md)', maxHeight: '250px', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-xs" style={{ background: 'var(--bg-root)', padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}>
              <Search size={14} color="var(--text-secondary)" />
              <input 
                type="text" 
                autoFocus
                placeholder="Cari..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.875rem', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                Tidak ditemukan
              </div>
            ) : (
              filteredOptions.map(opt => (
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
                    marginBottom: '2px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = opt.value === value ? 'var(--primary-bg)' : 'var(--bg-root)'}
                  onMouseLeave={(e) => e.target.style.background = opt.value === value ? 'var(--primary-bg)' : 'transparent'}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

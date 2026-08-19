"use client";

import dynamic from 'next/dynamic';

// Komponen MapPickerModal tidak boleh dirender di sisi server (SSR) karena 
// leaflet menggunakan object `window` yang tidak ada di server Node.js Next.js.
// Oleh karena itu, kita memuatnya secara dinamis dengan ssr: false.
const DynamicMapPicker = dynamic(
  () => import('./MapPickerModal'),
  { 
    ssr: false,
    loading: () => (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div className="card" style={{ padding: 'var(--space-xl)' }}>
          <p>Memuat peta...</p>
        </div>
      </div>
    )
  }
);

export default DynamicMapPicker;

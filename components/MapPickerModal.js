"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { X, Check, Search, Navigation } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

// Komponen untuk menangani klik pada peta
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// Komponen untuk memindahkan kamera peta ketika ada pencarian lokasi
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function MapPickerModal({ isOpen, onClose, onConfirm, initialLocation }) {
  const { showToast } = useData();

  // Default ke Monas jika tidak ada lokasi awal
  const defaultCenter = { lat: -6.1754, lng: 106.8272 };
  const [position, setPosition] = useState(initialLocation || defaultCenter);
  const [mapCenter, setMapCenter] = useState(initialLocation || defaultCenter);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Update posisi jika modal dibuka kembali
  useEffect(() => {
    if (isOpen && initialLocation) {
      setPosition(initialLocation);
      setMapCenter(initialLocation);
    }
  }, [isOpen, initialLocation]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (position) {
      const gmapsUrl = `https://www.google.com/maps?q=${position.lat},${position.lng}`;
      onConfirm(gmapsUrl, position);
    }
    onClose();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newLocation = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        setMapCenter(newLocation);
        setPosition(newLocation);
      } else {
        showToast("Lokasi tidak ditemukan. Coba kata kunci yang lebih spesifik (misal tambah nama kota).", "warning");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      showToast("Terjadi kesalahan saat mencari lokasi.", "danger");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateMe = (e) => {
    e.preventDefault();
    if (!navigator.geolocation) {
      showToast("Browser Anda tidak mendukung fitur lokasi GPS.", "danger");
      return;
    }
    
    setIsLocating(true);
    showToast("Mencari lokasi Anda... mohon tunggu.", "info");
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapCenter(coords);
        setPosition(coords);
        setIsLocating(false);
      },
      (err) => {
        let errorMsg = "Gagal mendapatkan lokasi.";
        if (err.code === 1) {
          errorMsg = "Akses lokasi ditolak. Pastikan Anda memberikan izin akses lokasi pada browser Anda.";
        } else if (err.code === 2) {
          errorMsg = "Sinyal lokasi tidak tersedia. Pastikan fitur Lokasi (GPS) aktif di pengaturan perangkat Anda.";
        } else if (err.code === 3) {
          errorMsg = "Waktu pencarian lokasi habis (timeout).";
        }
        showToast(errorMsg, "danger");
        setIsLocating(false);
      },
      // Menggunakan enableHighAccuracy: true agar lokasi presisi (sangat akurat di HP/Smartphone)
      // Timeout diperpanjang menjadi 30 detik untuk memberikan waktu mencari sinyal GPS
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  };

  return (
    <>
      <style>{`
        .map-modal-container {
          position: fixed;
          top: 0;
          left: var(--sidebar-width);
          right: 0;
          bottom: 0;
          z-index: 99999; /* Menutupi header aplikasi */
          background-color: var(--bg-root);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        @media (max-width: 1024px) {
          .map-modal-container {
            left: 0;
            top: 0; /* Menutupi header aplikasi di mobile */
          }
        }
      `}</style>
      <div className="map-modal-container">
        <div style={{ 
          width: '100%', 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card)'
        }}>
        {/* Header */}
        <div style={{ 
          padding: 'var(--space-md)', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '8px' }}>
            <X size={20} />
          </button>
          
          <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, gap: '8px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Cari lokasi (desa, jalan)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px', flex: 1 }}
            />
            <button 
              type="submit" 
              className="btn btn-secondary" 
              disabled={isSearching}
              style={{ padding: '8px', minWidth: '40px', justifyContent: 'center' }}
            >
              <Search size={18} />
            </button>
          </form>
        </div>

        {/* Map Container */}
        <div style={{ flex: 1, width: '100%', position: 'relative' }}>
          <MapContainer 
            center={mapCenter} 
            zoom={15} 
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
            <MapUpdater center={mapCenter} />
          </MapContainer>

          {/* Tombol Lokasi Saya */}
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={handleLocateMe}
            disabled={isLocating}
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '16px',
              zIndex: 1000,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--primary)'
            }}
            title="Lokasi Saya"
          >
            {isLocating ? (
              <div className="spinner" style={{ width: '22px', height: '22px', borderTopColor: 'var(--primary)', borderColor: 'var(--text-tertiary)' }}></div>
            ) : (
              <Navigation size={22} />
            )}
          </button>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: 'var(--space-md)', 
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
          backgroundColor: 'var(--bg-card)',
          boxShadow: '0 -4px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong>Cara pakai:</strong> Cari nama kota/desa, lalu geser peta dan klik untuk meletakkan pin biru di rumah donatur.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Batal</button>
            <button className="btn btn-primary" onClick={handleConfirm} style={{ flex: 2 }}>
              <Check size={18} /> Konfirmasi Lokasi
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

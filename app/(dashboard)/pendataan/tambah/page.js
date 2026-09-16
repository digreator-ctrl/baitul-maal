'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import DynamicMapPicker from '@/components/DynamicMapPicker';

export default function TambahDonaturPage() {
  const { user } = useAuth();
  const { addDonatur } = useData();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nama: '', kategori: 'Keluarga',
    provinsi: '', kota: '', kecamatan: '', kelurahan: '', keterangan: '',
    linkGmaps: '', noWa: '',
  });
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState({});
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Fetch provinces on mount
  useEffect(() => {
    setLoading(prev => ({ ...prev, provinsi: true }));
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(r => r.json())
      .then(data => {
        setProvinces(data.sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(prev => ({ ...prev, provinsi: false }));
      })
      .catch(() => setLoading(prev => ({ ...prev, provinsi: false })));
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    if (form.provinsiId) {
      setLoading(prev => ({ ...prev, kota: true }));
      setCities([]); setDistricts([]); setVillages([]);
      setForm(prev => ({ ...prev, kota: '', kotaId: '', kecamatan: '', kecamatanId: '', kelurahan: '', kelurahanId: '' }));
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${form.provinsiId}.json`)
        .then(r => r.json())
        .then(data => {
          setCities(data.sort((a, b) => a.name.localeCompare(b.name)));
          setLoading(prev => ({ ...prev, kota: false }));
        })
        .catch(() => setLoading(prev => ({ ...prev, kota: false })));
    }
  }, [form.provinsiId]);

  // Fetch districts when city changes
  useEffect(() => {
    if (form.kotaId) {
      setLoading(prev => ({ ...prev, kecamatan: true }));
      setDistricts([]); setVillages([]);
      setForm(prev => ({ ...prev, kecamatan: '', kecamatanId: '', kelurahan: '', kelurahanId: '' }));
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${form.kotaId}.json`)
        .then(r => r.json())
        .then(data => {
          setDistricts(data.sort((a, b) => a.name.localeCompare(b.name)));
          setLoading(prev => ({ ...prev, kecamatan: false }));
        })
        .catch(() => setLoading(prev => ({ ...prev, kecamatan: false })));
    }
  }, [form.kotaId]);

  // Fetch villages when district changes
  useEffect(() => {
    if (form.kecamatanId) {
      setLoading(prev => ({ ...prev, kelurahan: true }));
      setVillages([]);
      setForm(prev => ({ ...prev, kelurahan: '', kelurahanId: '' }));
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${form.kecamatanId}.json`)
        .then(r => r.json())
        .then(data => {
          setVillages(data.sort((a, b) => a.name.localeCompare(b.name)));
          setLoading(prev => ({ ...prev, kelurahan: false }));
        })
        .catch(() => setLoading(prev => ({ ...prev, kelurahan: false })));
    }
  }, [form.kecamatanId]);

  const handleProvinsiChange = (e) => {
    const selected = provinces.find(p => p.id === e.target.value);
    setForm(prev => ({
      ...prev,
      provinsiId: e.target.value,
      provinsi: selected?.name || '',
    }));
  };

  const handleKotaChange = (e) => {
    const selected = cities.find(c => c.id === e.target.value);
    setForm(prev => ({
      ...prev,
      kotaId: e.target.value,
      kota: selected?.name || '',
    }));
  };

  const handleKecamatanChange = (e) => {
    const selected = districts.find(d => d.id === e.target.value);
    setForm(prev => ({
      ...prev,
      kecamatanId: e.target.value,
      kecamatan: selected?.name || '',
    }));
  };

  const handleKelurahanChange = (e) => {
    const selected = villages.find(v => v.id === e.target.value);
    setForm(prev => ({
      ...prev,
      kelurahanId: e.target.value,
      kelurahan: selected?.name || '',
    }));
  };

  const [errors, setErrors] = useState({});

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!form.nama.trim()) newErrors.nama = 'Nama Lengkap wajib diisi';
      if (!form.noWa.trim()) newErrors.noWa = 'No. WhatsApp wajib diisi';
    } else if (currentStep === 2) {
      if (!form.provinsiId) newErrors.provinsiId = 'Provinsi wajib dipilih';
      if (!form.kotaId) newErrors.kotaId = 'Kota/Kabupaten wajib dipilih';
      if (!form.kecamatanId) newErrors.kecamatanId = 'Kecamatan wajib dipilih';
      if (!form.kelurahanId) newErrors.kelurahanId = 'Kelurahan/Desa wajib dipilih';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [lastStepTime, setLastStepTime] = useState(0);

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      setLastStepTime(Date.now());
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      handleNext();
      return;
    }
    
    // Cegah double-click yang menembus dari tombol "Lanjut" (jika user klik 2x cepat)
    if (Date.now() - lastStepTime < 500 || submitting) {
      return;
    }

    setSubmitting(true);
    const result = await addDonatur({ ...form, createdBy: user?.id });
    setSubmitting(false);
    if (result) {
      router.push('/pendataan');
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <h1>Tambah Donatur</h1>
        <p>Isi data donatur baru</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-lg)' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ 
              flex: 1, height: '6px', borderRadius: '3px',
              background: step >= s ? 'var(--primary)' : 'var(--border-color)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        {step === 1 && (
          <div className="card animate-fade-in">
            <h3 className="font-semibold mb-lg flex items-center gap-sm">
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
              Informasi Dasar
            </h3>

            <div className="form-group">
              <label className="form-label">Nama Lengkap *</label>
              <input
                type="text"
                className="form-input"
                style={{ borderColor: errors.nama ? 'var(--danger)' : undefined }}
                placeholder="Masukkan nama donatur"
                value={form.nama}
                onChange={(e) => { setForm(prev => ({ ...prev, nama: e.target.value })); if (errors.nama) setErrors(prev => ({ ...prev, nama: undefined })); }}
              />
              {errors.nama && <span className="form-error">{errors.nama}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Kategori Donatur *</label>
              <select
                className="form-select"
                value={form.kategori}
                onChange={(e) => setForm(prev => ({ ...prev, kategori: e.target.value }))}
              >
                <option value="Keluarga">Keluarga</option>
                <option value="Non Keluarga">Non Keluarga</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">No. WhatsApp *</label>
              <input
                type="tel"
                className="form-input"
                style={{ borderColor: errors.noWa ? 'var(--danger)' : undefined }}
                placeholder="08xxxxxxxxxx"
                value={form.noWa}
                onChange={(e) => { setForm(prev => ({ ...prev, noWa: e.target.value.replace(/\D/g, '') })); if (errors.noWa) setErrors(prev => ({ ...prev, noWa: undefined })); }}
              />
              {errors.noWa && <span className="form-error">{errors.noWa}</span>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card animate-fade-in">
            <h3 className="font-semibold mb-lg flex items-center gap-sm">
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
              Pilih Wilayah
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Provinsi *</label>
                <SearchableSelect 
                  options={provinces.map(p => ({ value: p.id, label: p.name }))}
                  value={form.provinsiId || ''}
                  onChange={(val) => { handleProvinsiChange({ target: { value: val } }); if (errors.provinsiId) setErrors(prev => ({ ...prev, provinsiId: undefined })); }}
                  placeholder="-- Pilih Provinsi --"
                  error={errors.provinsiId}
                />
                {loading.provinsi && <span className="form-hint">Memuat data...</span>}
                {errors.provinsiId && <span className="form-error">{errors.provinsiId}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Kota / Kabupaten *</label>
                <SearchableSelect 
                  options={cities.map(c => ({ value: c.id, label: c.name }))}
                  value={form.kotaId || ''}
                  onChange={(val) => { handleKotaChange({ target: { value: val } }); if (errors.kotaId) setErrors(prev => ({ ...prev, kotaId: undefined })); }}
                  placeholder="-- Pilih Kota/Kab --"
                  disabled={!form.provinsiId}
                  error={errors.kotaId}
                />
                {loading.kota && <span className="form-hint">Memuat data...</span>}
                {errors.kotaId && <span className="form-error">{errors.kotaId}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kecamatan *</label>
                <SearchableSelect 
                  options={districts.map(d => ({ value: d.id, label: d.name }))}
                  value={form.kecamatanId || ''}
                  onChange={(val) => { handleKecamatanChange({ target: { value: val } }); if (errors.kecamatanId) setErrors(prev => ({ ...prev, kecamatanId: undefined })); }}
                  placeholder="-- Pilih Kecamatan --"
                  disabled={!form.kotaId}
                  error={errors.kecamatanId}
                />
                {loading.kecamatan && <span className="form-hint">Memuat data...</span>}
                {errors.kecamatanId && <span className="form-error">{errors.kecamatanId}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Kelurahan / Desa *</label>
                <SearchableSelect 
                  options={villages.map(v => ({ value: v.id, label: v.name }))}
                  value={form.kelurahanId || ''}
                  onChange={(val) => { handleKelurahanChange({ target: { value: val } }); if (errors.kelurahanId) setErrors(prev => ({ ...prev, kelurahanId: undefined })); }}
                  placeholder="-- Pilih Kelurahan/Desa --"
                  disabled={!form.kecamatanId}
                  error={errors.kelurahanId}
                />
                {loading.kelurahan && <span className="form-hint">Memuat data...</span>}
                {errors.kelurahanId && <span className="form-error">{errors.kelurahanId}</span>}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card animate-fade-in">
            <h3 className="font-semibold mb-lg flex items-center gap-sm">
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</span>
              Detail Alamat
            </h3>

            <div className="form-group">
              <label className="form-label">Keterangan Alamat</label>
              <textarea
                className="form-textarea"
                placeholder="RT/RW, Nama Jalan, Nomor Rumah, dll."
                value={form.keterangan}
                onChange={(e) => setForm(prev => ({ ...prev, keterangan: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Link Google Maps</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="https://maps.google.com/..."
                  value={form.linkGmaps}
                  onChange={(e) => setForm(prev => ({ ...prev, linkGmaps: e.target.value }))}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsMapOpen(true)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <MapPin size={18} /> Pilih dari Peta
                </button>
              </div>
              <span className="form-hint">Salin link dari Google Maps atau pilih langsung dari peta</span>
            </div>
          </div>
        )}

        <div className="flex gap-sm mt-lg" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Batal</button>
          
          <div className="flex gap-sm">
            {step > 1 && (
              <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>Kembali</button>
            )}
            
            {step < 3 ? (
              <button type="button" className="btn btn-primary" onClick={handleNext}>Lanjut</button>
            ) : (
              <button type="submit" className="btn btn-primary">
                <Save size={18} /> Simpan Donatur
              </button>
            )}
          </div>
        </div>
      </form>

      <DynamicMapPicker 
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={(url) => setForm(prev => ({ ...prev, linkGmaps: url }))}
      />
    </div>
  );
}

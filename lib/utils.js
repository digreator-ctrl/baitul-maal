export function serializeBigInt(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item));
  }
  
  if (typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj; // Leave dates as is, JSON.stringify handles them
    }
    
    const serialized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        serialized[key] = serializeBigInt(obj[key]);
      }
    }
    return serialized;
  }
  
  return obj;
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatTanggalShort(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTanggalDDMMYYYY(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

export function getStatusBadge(status) {
  switch(status) {
    case 'belum_disetor': return { label: 'Tercatat', variant: 'success' };
    case 'menunggu_verifikasi': return { label: 'Menunggu Verifikasi', variant: 'info' };
    case 'terverifikasi': return { label: 'Terverifikasi', variant: 'success' };
    case 'ditolak': return { label: 'Ditolak', variant: 'danger' };
    default: return { label: status, variant: 'neutral' };
  }
}

export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function formatPersen(value) {
  if (value === undefined || value === null) return '-';
  return `${value}%`;
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSent(true);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-img">
            <Mail size={32} color="var(--primary)" />
          </div>
          <h1>Lupa Password</h1>
          <p>Ponpes Ar-Rosyad</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <p className="text-sm text-secondary mb-lg text-center">
              Masukkan email yang terdaftar. Kami akan mengirimkan link untuk mereset password Anda.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                className="form-input"
                placeholder="nama@arrosyad.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg">
              <Send size={18} />
              Kirim Link Reset
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-full)',
              background: 'var(--success-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-lg)',
            }}>
              <Mail size={28} color="var(--success)" />
            </div>
            <h3 className="mb-sm">Email Terkirim!</h3>
            <p className="text-sm text-secondary mb-lg">
              Link reset password telah dikirim ke <strong>{email}</strong>. Silakan cek inbox Anda.
            </p>
          </div>
        )}

        <button
          type="button"
          className="btn btn-ghost btn-block mt-md"
          onClick={() => router.push('/login')}
        >
          <ArrowLeft size={16} />
          Kembali ke Login
        </button>
      </div>
    </div>
  );
}

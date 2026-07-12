import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';

export const metadata = {
  title: 'Baitul Maal — Ponpes Ar-Rosyad',
  description: 'Sistem Manajemen Donasi Divisi Baitul Maal Pondok Pesantren Ar-Rosyad',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

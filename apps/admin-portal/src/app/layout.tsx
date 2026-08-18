import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'VoteChain EVM — Election Commission Portal',
  description: 'Blockchain-based Electronic Voting Machine Administration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
          }}
        />
        {children}
      </body>
    </html>
  );
}

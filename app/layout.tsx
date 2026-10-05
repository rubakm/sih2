import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LODESTAR | Coking Coal Charter Decision Tool (SIH26006)',
  description:
    'Apple-grade charter decision tool for steelmakers importing coking coal to India East Coast. Optimizes vessel class, discharge port, landed freight $/t, and fixing timing.',
  keywords: [
    'charter decision tool',
    'coking coal logistics',
    'dry bulk shipping',
    'East Coast India ports',
    'Smart India Hackathon',
    'SIH26006',
    'Capesize draft optimization',
  ],
  authors: [{ name: 'LODESTAR Steel Logistics' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0E14',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0E14] text-[#F5F5F7] min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

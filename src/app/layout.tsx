

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WebSocketProvider } from './contexts/WebSocketContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ADKIMS Admin Dashboard',
  description: 'Admin Dashboard for ISP Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}
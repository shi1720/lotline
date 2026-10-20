import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Lotline — Every lot. Every link.',
  description: 'Recall rehearsals for food makers. Trace ingredient lots, verify source records, and see the gaps before they become a crisis.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }

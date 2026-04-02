import type { Metadata } from 'next';

import './globals.css';


export const metadata: Metadata = {
  title: 'Narayan Rajdeep IOT-PROJECT',
  description: 'IOT BASED BIOSENSOR PROJECT',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-raleway">{children}</body>
    </html>
  );
}

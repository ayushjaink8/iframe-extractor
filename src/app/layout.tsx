
'use client'; // Keep 'use client' if other client-side logic/hooks are used

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
// Removed unused useEffect import

// Initialize Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans', // Define a CSS variable for the font
});

// Metadata cannot be exported from client components.
// Move this to a Server Component if needed, or define static metadata in <head> below.
// export const metadata: Metadata = {
//   title: 'IframeXtractor',
//   description: 'Extract and preview iframe srcdoc content from HTML files.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Removed the useEffect hook that tried to remove data-lt-installed

  return (
    // Add suppressHydrationWarning to handle potential mismatches from browser extensions
    // or minor differences not easily fixable in dangerouslySetInnerHTML content.
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        {/* Static metadata can be placed directly here */}
        <title>IframeXtractor</title>
        <meta name="description" content="Extract and preview iframe srcdoc content from HTML files." />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Add other meta tags, links, etc. as needed */}
      </head>
      {/* Apply the font variable to the body */}
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}


'use client'; // Add 'use client' because we are using useEffect

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { useEffect } from 'react'; // Keep import if needed elsewhere, otherwise remove

// Initialize Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans', // Define a CSS variable for the font
});

// Metadata cannot be exported from client components.
// You might need to move this to a higher-level Server Component or generate it dynamically if needed.
// For now, we comment it out to resolve the immediate error.
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
    // Add suppressHydrationWarning to handle unavoidable mismatches from browser extensions
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        {/* You can add metadata here directly if it's static */}
        <title>IframeXtractor</title>
        <meta name="description" content="Extract and preview iframe srcdoc content from HTML files." />
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

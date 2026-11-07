import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://finsa-covenant.vercel.app'),
  title: {
    default: 'FINSA Online · Department of Banking & Finance | Covenant University',
    template: '%s | FINSA Online · Covenant University',
  },
  description:
    'Official Course Dues, Financial Clearance, and Departmental Administration Portal for the Department of Banking and Finance (FINSA), Covenant University.',
  keywords: [
    'Covenant University',
    'Department of Banking and Finance',
    'FINSA',
    'Course Dues',
    'Test 1 Clearance',
    'Financial Clearance Portal',
  ],
  openGraph: {
    title: 'FINSA Online · Department of Banking & Finance | Covenant University',
    description:
      'Official Course Dues & Test 1 Clearance Portal for Covenant University Finance Students.',
    url: 'https://finsa-covenant.vercel.app',
    siteName: 'FINSA Online',
    locale: 'en_NG',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-[100dvh] bg-[#F7F7F4] text-[#0A0D0C] font-sans selection:bg-[#064E3B] selection:text-white antialiased relative">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'Covenant University Department of Banking and Finance (FINSA)',
              url: 'https://finsa-covenant.vercel.app',
              logo: 'https://finsa-covenant.vercel.app/logo.png',
              parentOrganization: {
                '@type': 'CollegeOrUniversity',
                name: 'Covenant University',
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Ota',
                  addressRegion: 'Ogun State',
                  addressCountry: 'NG',
                },
              },
            }),
          }}
        />
        {/* Fixed GPU-safe subtle tactile grain overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.022]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://finsa-covenant.vercel.app'),
  title: {
    default: 'FINSA · Department of Banking & Finance | Covenant University',
    template: '%s | FINSA Covenant',
  },
  description:
    'Course Dues Assessment & Financial Clearance Portal for the Department of Banking & Finance (FINSA), Covenant University.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-[100dvh] bg-[#FAFAFA] text-[#09090B] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'Department of Banking and Finance, Covenant University',
              url: 'https://finsa-covenant.vercel.app',
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}

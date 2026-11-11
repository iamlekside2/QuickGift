import type { NextConfig } from 'next';

// The site is exported as plain static files (HTML/CSS/JS in `out/`), so it can
// be served by any static host. `trailingSlash` makes each page a folder with
// an index.html, which keeps the public links /gift/?t=... and /group/?c=...
// working exactly as shared.
//
// Build with webpack (`next build --webpack`, see package.json). Under Turbopack,
// next/font ignores `adjustFontFallback: false` and adds size-adjusted backup
// fonts, which draw the naira sign and arrows at a slightly different size than
// the original page did.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

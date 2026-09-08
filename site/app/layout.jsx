import './globals.css';

export const metadata = {
  title: 'Dossier 1709/26',
  description: 'Parquet — mairie centrale',
  robots: { index: false, follow: false },
};
export const viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#091512',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Spectral:ital,wght@0,400;0,600;1,400&family=Special+Elite&family=Lora:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>
        {/* Les filtres qui donnent au papier ses bords déchirés et à l'encre sa bavure. */}
        <svg className="defs" aria-hidden="true">
          <defs>
            <filter id="deckle" x="-6%" y="-6%" width="112%" height="112%">
              <feTurbulence type="fractalNoise" baseFrequency="0.022 0.05" numOctaves="4" seed="7" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="bavure" x="-12%" y="-12%" width="124%" height="124%">
              <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" seed="3" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <pattern id="trame" width="3.4" height="3.4" patternUnits="userSpaceOnUse">
              <circle cx="1.7" cy="1.7" r="1.05" fill="#2A241C" />
            </pattern>
            <symbol id="bustA" viewBox="0 0 104 86">
              <path d="M52 12c-10.5 0-18 8-18 18.5 0 7 3.2 13.2 7.8 16.8C27 51.6 17 61.5 17 74.5V86h70V74.5c0-13-10-22.9-24.8-27.2 4.6-3.6 7.8-9.8 7.8-16.8C70 20 62.5 12 52 12z" />
            </symbol>
            <symbol id="bustB" viewBox="0 0 104 86">
              <path d="M52 9c-11.6 0-19.5 8.8-19.5 20 0 7.6 3.6 14.4 8.6 18.3C25 51.9 14 62.6 14 76.5V86h76V76.5c0-13.9-11-24.6-27.1-29.2 5-3.9 8.6-10.7 8.6-18.3C71.5 17.8 63.6 9 52 9z" />
            </symbol>
            <symbol id="bustC" viewBox="0 0 104 86">
              <path d="M52 15c-9.6 0-16.6 7.2-16.6 17 0 6.4 2.9 12.1 7.2 15.4C29.6 51.2 20 60.4 20 72.6V86h64V72.6c0-12.2-9.6-21.4-22.6-25.2 4.3-3.3 7.2-9 7.2-15.4 0-9.8-7-17-16.6-17z" />
            </symbol>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}

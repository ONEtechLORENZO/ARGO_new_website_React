/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  /* sviluppo: il sito si può aprire anche da altri dispositivi della stessa rete (http://192.168.x.x:6120) */
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  /* lingue: l'italiano è servito su "/" (pagina interna /it), l'inglese su /en */
  async rewrites() {
    return [{ source: "/", destination: "/it" }];
  },
  /* /it non deve esistere come indirizzo pubblico: niente contenuti duplicati */
  async redirects() {
    return [{ source: "/it", destination: "/", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;

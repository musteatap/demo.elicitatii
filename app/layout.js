export const metadata = {
  title: "Licitații Publice România",
  description: "Interfață alternativă pentru e-licitatie.ro",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body style={{ margin: 0, padding: 0, background: "#030712" }}>
        {children}
      </body>
    </html>
  );
}

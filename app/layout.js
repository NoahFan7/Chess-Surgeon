import "./globals.css";

export const metadata = {
  title: "Chess-Surgeon",
  description:
    "Paste a game or a board screenshot and get Stockfish analysis, move-by-move feedback, similar master games, and an adaptive coaching AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a className="brand" href="/">
            Chess-Surgeon
          </a>
          <nav className="site-nav">
            <a href="/analyze">Analyze</a>
            <a href="/play">Play</a>
            <a href="/learn">Learn</a>
            <a href="/history">History</a>
          </nav>
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          <span>Chess-Surgeon</span>
        </footer>
      </body>
    </html>
  );
}

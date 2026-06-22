# Chess-Surgeon

Paste a chess game (PGN/FEN/move ID) or a screenshot of a board, and Chess-Surgeon
analyzes your moves with Stockfish, tells you where you went wrong or right, finds
similar historical master games, and lets you play a coaching AI that adapts to your
skill.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Tech

- [Next.js](https://nextjs.org/) (App Router)
- [chess.js](https://github.com/jhlywa/chess.js) for move logic
- [react-chessboard](https://github.com/Clariity/react-chessboard) for the board UI
- Stockfish (WASM) for analysis (planned)

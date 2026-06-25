# Chess-Surgeon

Paste a chess game (PGN/FEN/move ID) or a screenshot of a board, and Chess-Surgeon
analyzes your moves with Stockfish, tells you where you went wrong or right, finds
similar historical master games, and lets you play a coaching AI that adapts to your
skill.

## Features

- **Analyze**: Paste a PGN, FEN, or Lichess/Chess.com game URL. Get move-by-move
  evaluation, classification (best/great/good/inaccuracy/mistake/blunder), and an
  LLM-powered coach that explains each move in plain English.
- **Play vs AI**: Play against a Stockfish bot at 7 difficulty levels (400–2400 ELO).
  Toggle an in-game coach for position assessment, move feedback, and hints. The bot
  adapts its strength to your skill as you play.
- **Similar Games**: From any position, find historical master games that reached a
  similar spot.

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
- Stockfish (WASM) for analysis and bot play

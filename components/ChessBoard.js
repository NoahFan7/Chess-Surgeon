"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Reusable chessboard with drag-and-drop moves and FEN state management.
 *
 * Controlled by `fen` when provided; otherwise manages its own game instance.
 * Calls `onMove` with { move, fen, game } whenever a legal move is played.
 */
export default function ChessBoard({
  fen,
  orientation = "white",
  interactive = true,
  arrows = [],
  highlightSquares = [],
  onMove,
  boardWidth,
}) {
  const game = useMemo(() => {
    const g = new Chess();
    if (fen) {
      try {
        g.load(fen);
      } catch {
        // ignore invalid FEN, start from initial position
      }
    }
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [computedWidth, setComputedWidth] = useState(560);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        setComputedWidth(containerRef.current.offsetWidth);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const [position, setPosition] = useState(game.fen());
  const [lastMove, setLastMove] = useState(null);
  const [moveCount, setMoveCount] = useState(0);

  // Sync external FEN changes (e.g. PGN load) into the local game.
  useEffect(() => {
    if (fen && fen !== position) {
      try {
        game.load(fen);
        setPosition(game.fen());
        setLastMove(null);
        setMoveCount((c) => c + 1);
      } catch {
        // ignore invalid FEN
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  const handleDrop = useCallback(
    (sourceSquare, targetSquare, piece) => {
      if (!interactive) return false;

      const movingColor = piece[0]; // "w" | "b"
      const turn = game.turn();
      if (movingColor !== turn) return false;

      const moveOpts = {
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      };

      let move;
      try {
        move = game.move(moveOpts);
      } catch {
        move = null;
      }

      if (!move) return false;

      setPosition(game.fen());
      setLastMove({ from: move.from, to: move.to });
      setMoveCount((c) => c + 1);

      if (onMove) {
        onMove({
          move,
          fen: game.fen(),
          game,
          isCheck: game.inCheck(),
          isCheckmate: game.isCheckmate(),
          isDraw: game.isDraw(),
          isGameOver: game.isGameOver(),
          turn: game.turn(),
        });
      }

      return true;
    },
    [game, interactive, onMove]
  );

  const squareStyles = useMemo(() => {
    const styles = {};
    if (lastMove) {
      styles[lastMove.from] = {
        background: "rgba(255, 230, 0, 0.45)",
      };
      styles[lastMove.to] = {
        background: "rgba(255, 230, 0, 0.45)",
      };
    }
    for (const sq of highlightSquares) {
      styles[sq] = {
        ...(styles[sq] || {}),
        background: "rgba(74, 144, 226, 0.5)",
        borderRadius: "4px",
      };
    }
    return styles;
  }, [lastMove, highlightSquares, moveCount]);

  return (
    <div className="cs-board-wrap" ref={containerRef}>
      <Chessboard
        id="ChessBoard"
        position={position}
        onPieceDrop={handleDrop}
        boardOrientation={orientation}
        arePiecesDraggable={interactive}
        customArrows={arrows}
        customSquareStyles={squareStyles}
        boardWidth={boardWidth ?? computedWidth}
        customDarkSquareStyle={{ backgroundColor: "#B58863" }}
        customLightSquareStyle={{ backgroundColor: "#F0D9B5" }}
        customBoardStyle={{
          borderRadius: "6px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
        }}
        customNotationStyle={{ fontSize: "11px", color: "#9aa3b8" }}
      />
    </div>
  );
}

export { STARTING_FEN };

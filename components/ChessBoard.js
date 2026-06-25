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
  lastMove: lastMoveProp,
  onMove,
  boardWidth,
  showCoordinates = true,
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
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);

  // Sync external FEN changes (e.g. bot move, PGN load) into the local game.
  useEffect(() => {
    if (fen && fen !== position) {
      try {
        game.load(fen);
        setPosition(game.fen());
        setLastMove(lastMoveProp || null);
        setMoveCount((c) => c + 1);
        setSelectedSquare(null);
        setLegalTargets([]);
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
      setSelectedSquare(null);
      setLegalTargets([]);

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

  const attemptMove = useCallback(
    (from, to) => {
      const moveOpts = { from, to, promotion: "q" };
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
      setSelectedSquare(null);
      setLegalTargets([]);
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
    [game, onMove]
  );

  const handleSquareClick = useCallback(
    (square) => {
      if (!interactive) return;

      // If a square is already selected, try to move there
      if (selectedSquare) {
        if (square === selectedSquare) {
          // Click same square — deselect
          setSelectedSquare(null);
          setLegalTargets([]);
          return;
        }
        if (legalTargets.includes(square)) {
          attemptMove(selectedSquare, square);
          return;
        }
        // Clicked a non-target square — select it if it has a movable piece
      }

      // Select the clicked square if it has a piece of the side to move
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        const moves = game.moves({ square, verbose: true });
        const targets = moves.map((m) => m.to);
        setSelectedSquare(square);
        setLegalTargets(targets);
      } else {
        setSelectedSquare(null);
        setLegalTargets([]);
      }
    },
    [game, interactive, selectedSquare, legalTargets, attemptMove]
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
    if (selectedSquare) {
      styles[selectedSquare] = {
        ...(styles[selectedSquare] || {}),
        background: "rgba(74, 144, 226, 0.4)",
      };
    }
    for (const sq of legalTargets) {
      const isCapture = game.get(sq);
      styles[sq] = {
        ...(styles[sq] || {}),
        background: isCapture
          ? "radial-gradient(circle, transparent 55%, rgba(226, 56, 56, 0.45) 56%)"
          : "radial-gradient(circle, rgba(74, 144, 226, 0.4) 22%, transparent 23%)",
        borderRadius: isCapture ? "0" : "50%",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMove, selectedSquare, legalTargets, highlightSquares, moveCount]);

  // Generate per-square coordinate labels for the toggleable overlay
  const boardSquares = useMemo(() => {
    const files = orientation === "white"
      ? ["a", "b", "c", "d", "e", "f", "g", "h"]
      : ["h", "g", "f", "e", "d", "c", "b", "a"];
    const ranks = orientation === "white"
      ? ["8", "7", "6", "5", "4", "3", "2", "1"]
      : ["1", "2", "3", "4", "5", "6", "7", "8"];

    const squares = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        squares.push({
          label: files[c] + ranks[r],
          x: c * 12.5,
          y: r * 12.5,
        });
      }
    }
    return squares;
  }, [orientation]);

  return (
    <div className="cs-board-wrap" ref={containerRef}>
      <Chessboard
        id="ChessBoard"
        position={position}
        onPieceDrop={handleDrop}
        onSquareClick={handleSquareClick}
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
        customNotationStyle={{ fontSize: "14px", color: "#e6e9f2", fontWeight: "700" }}
        showBoardNotation={true}
      />
      {showCoordinates && (
        <div className="square-coordinates-overlay">
          {boardSquares.map((sq) => (
            <span
              key={sq}
              className="square-coord-label"
              style={{
                left: `${sq.x}%`,
                top: `${sq.y}%`,
              }}
            >
              {sq.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export { STARTING_FEN };

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook to run Stockfish analysis in the browser via a web worker.
 * Returns { isReady, isAnalyzing, evalScore, evalType, bestMove, pv, depth, analyze, stop }.
 *
 * - evalType: "cp" (centipawns) | "mate" | null
 * - evalScore: numeric score (centipawns or mate-in-N)
 * - bestMove: UCI move string e.g. "e2e4" or null
 * - pv: array of UCI move strings (principal variation)
 */
export default function useStockfish() {
  const workerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState({
    evalScore: null,
    evalType: null,
    bestMove: null,
    pv: [],
    depth: 0,
  });

  useEffect(() => {
    const worker = new Worker("/stockfish/worker.js");
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;

      if (msg.type === "ready") {
        setIsReady(true);
      }

      if (msg.type === "error") {
        console.error("Stockfish error:", msg.message);
        setIsAnalyzing(false);
      }

      if (msg.type === "line") {
        parseLine(msg.line, setResult, setIsAnalyzing);
      }
    };

    worker.postMessage({ type: "init" });

    return () => {
      worker.postMessage({ type: "command", command: "quit" });
      worker.terminate();
    };
  }, []);

  const analyze = useCallback(
    (fen, { depth = 15, multipv = 1 } = {}) => {
      if (!workerRef.current || !isReady) return;
      setIsAnalyzing(true);
      setResult({
        evalScore: null,
        evalType: null,
        bestMove: null,
        pv: [],
        depth: 0,
      });

      const w = workerRef.current;
      w.postMessage({ type: "command", command: "stop" });
      w.postMessage({ type: "command", command: "ucinewgame" });
      w.postMessage({ type: "command", command: `position fen ${fen}` });
      w.postMessage({
        type: "command",
        command: `setoption name MultiPV value ${multipv}`,
      });
      w.postMessage({ type: "command", command: `go depth ${depth}` });
    },
    [isReady]
  );

  const stop = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: "command", command: "stop" });
    setIsAnalyzing(false);
  }, []);

  return { isReady, isAnalyzing, ...result, analyze, stop };
}

function parseLine(line, setResult, setIsAnalyzing) {
  // Best move line: "bestmove e2e4 ponder e7e5"
  if (line.startsWith("bestmove")) {
    setIsAnalyzing(false);
    const parts = line.split(/\s+/);
    const bestMove = parts[1] && parts[1] !== "(none)" ? parts[1] : null;
    setResult((prev) => ({ ...prev, bestMove }));
    return;
  }

  // Info line: "info depth 15 seldepth 20 score cp 34 nodes 12345 ... pv e2e4 e7e5 ..."
  if (line.startsWith("info")) {
    const depthMatch = line.match(/depth (\d+)/);
    const scoreCpMatch = line.match(/score cp (-?\d+)/);
    const scoreMateMatch = line.match(/score mate (-?\d+)/);
    const pvMatch = line.match(/pv (.+)$/);

    const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;

    let evalScore = null;
    let evalType = null;
    if (scoreMateMatch) {
      evalScore = parseInt(scoreMateMatch[1], 10);
      evalType = "mate";
    } else if (scoreCpMatch) {
      evalScore = parseInt(scoreCpMatch[1], 10);
      evalType = "cp";
    }

    const pv = pvMatch ? pvMatch[1].split(/\s+/) : [];

    setResult((prev) => {
      // Only update if depth is >= what we already had
      if (depth < prev.depth && evalType) return prev;
      return { ...prev, evalScore, evalType, pv, depth };
    });
  }
}

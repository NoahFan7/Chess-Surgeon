"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook to use Stockfish as a playable bot opponent.
 *
 * Unlike useStockfish (which continuously re-analyzes), this hook is
 * request/response: call getMove(fen) and get a Promise back.
 *
 * Key design: if getMove is called while another search is running
 * (e.g. a background coach analysis), the current search is stopped
 * and the new request is queued. The interrupted search's bestmove
 * is processed first, then the queued request starts. This prevents
 * the wrong bestmove from resolving the getMove promise.
 *
 * Returns {
 *   isReady, isThinking, evalScore, evalType, bestMove, pv, depth,
 *   getMove, analyze, stop
 * }
 */
export default function useStockfishPlayer({ onComplete, silent = false } = {}) {
  const workerRef = useRef(null);
  const resolverRef = useRef(null);
  const fenRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const latestEvalRef = useRef({
    evalScore: null,
    evalType: null,
    pv: [],
    depth: 0,
  });
  const isSearchingRef = useRef(false);
  const pendingRequestRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [result, setResult] = useState({
    evalScore: null,
    evalType: null,
    bestMove: null,
    pv: [],
    depth: 0,
  });

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const startSearch = useCallback(
    (fen, { depth = 10, skillLevel = 10, movetime, multipv } = {}) => {
      const w = workerRef.current;
      if (!w) return;

      isSearchingRef.current = true;
      fenRef.current = fen;
      latestEvalRef.current = {
        evalScore: null,
        evalType: null,
        pv: [],
        depth: 0,
      };
      setIsThinking(true);
      setResult({
        evalScore: null,
        evalType: null,
        bestMove: null,
        pv: [],
        depth: 0,
      });

      w.postMessage("ucinewgame");
      w.postMessage(`position fen ${fen}`);

      if (skillLevel !== undefined) {
        w.postMessage(
          `setoption name Skill Level value ${Math.max(0, Math.min(20, skillLevel))}`
        );
      }
      if (multipv !== undefined) {
        w.postMessage(`setoption name MultiPV value ${multipv}`);
      }

      if (movetime) {
        w.postMessage(`go movetime ${movetime}`);
      } else {
        w.postMessage(`go depth ${depth}`);
      }
    },
    []
  );

  useEffect(() => {
    const worker = new Worker("/stockfish/stockfish.js");
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const line = typeof e.data === "string" ? e.data : "";

      if (line === "uciok") {
        worker.postMessage("isready");
      }

      if (line === "readyok") {
        setIsReady(true);
      }

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

        if (evalType && depth >= (latestEvalRef.current.depth || 0)) {
          latestEvalRef.current = { evalScore, evalType, pv, depth };
        }

        if (!silent) {
          setResult((prev) => {
            if (depth < prev.depth && evalType) return prev;
            return { ...prev, evalScore, evalType, pv, depth };
          });
        }
      }

      if (line.startsWith("bestmove")) {
        isSearchingRef.current = false;
        setIsThinking(false);

        const parts = line.split(/\s+/);
        const bestMove =
          parts[1] && parts[1] !== "(none)" ? parts[1] : null;

        const finalResult = {
          evalScore: latestEvalRef.current.evalScore,
          evalType: latestEvalRef.current.evalType,
          pv: latestEvalRef.current.pv,
          depth: latestEvalRef.current.depth,
          bestMove,
        };

        setResult(finalResult);

        if (fenRef.current) {
          onCompleteRef.current?.(fenRef.current, finalResult);
        }

        const resolver = resolverRef.current;
        if (resolver) {
          resolverRef.current = null;
          resolver({
            move: bestMove,
            evalScore: finalResult.evalScore,
            evalType: finalResult.evalType,
            pv: finalResult.pv,
            depth: finalResult.depth,
          });
        }

        // Process queued request (if any)
        const pending = pendingRequestRef.current;
        if (pending) {
          pendingRequestRef.current = null;
          if (pending.resolve) {
            resolverRef.current = pending.resolve;
          }
          startSearch(pending.fen, pending.options);
        }
      }
    };

    worker.onerror = (e) => {
      console.error("Stockfish player worker error:", e.message || e);
      isSearchingRef.current = false;
      setIsThinking(false);
      const resolver = resolverRef.current;
      if (resolver) {
        resolverRef.current = null;
        resolver({
          move: null,
          evalScore: null,
          evalType: null,
          pv: [],
          depth: 0,
        });
      }
      const pending = pendingRequestRef.current;
      if (pending) {
        pendingRequestRef.current = null;
        if (pending.resolve) {
          pending.resolve({
            move: null,
            evalScore: null,
            evalType: null,
            pv: [],
            depth: 0,
          });
        }
      }
    };

    worker.postMessage("uci");

    return () => {
      worker.postMessage("quit");
      worker.terminate();
    };
  }, [startSearch]);

  const getMove = useCallback(
    (fen, options = {}) => {
      return new Promise((resolve) => {
        if (!workerRef.current || !isReady) {
          resolve({
            move: null,
            evalScore: null,
            evalType: null,
            pv: [],
            depth: 0,
          });
          return;
        }

        if (isSearchingRef.current) {
          // A search is running (likely a coach analysis or hint).
          // Stop it and queue this request. The interrupted search's
          // bestmove will be processed first, then this request starts.
          const pending = { fen, options, resolve };
          pendingRequestRef.current = pending;
          workerRef.current.postMessage("stop");

          // Safety: if the interrupted search doesn't produce a bestmove
          // within 3 seconds (e.g. worker hadn't started searching when
          // "stop" was sent), force-start this search so the bot never
          // freezes.
          setTimeout(() => {
            if (pendingRequestRef.current === pending) {
              pendingRequestRef.current = null;
              resolverRef.current = resolve;
              startSearch(fen, options);
            }
          }, 3000);
          return;
        }

        resolverRef.current = resolve;
        startSearch(fen, options);
      });
    },
    [isReady, startSearch]
  );

  const analyze = useCallback(
    (fen, options = {}) => {
      if (!workerRef.current || !isReady) return;

      if (isSearchingRef.current) {
        // Stop current search and queue this analysis (no resolver)
        pendingRequestRef.current = { fen, options, resolve: null };
        workerRef.current.postMessage("stop");
        return;
      }

      startSearch(fen, {
        ...options,
        skillLevel: options.skillLevel ?? 20,
      });
    },
    [isReady, startSearch]
  );

  const stop = useCallback(() => {
    if (!workerRef.current) return;
    isSearchingRef.current = false;
    pendingRequestRef.current = null;
    workerRef.current.postMessage("stop");
    setIsThinking(false);
    const resolver = resolverRef.current;
    if (resolver) {
      resolverRef.current = null;
      resolver({
        move: null,
        evalScore: null,
        evalType: null,
        pv: [],
        depth: 0,
      });
    }
  }, []);

  return {
    isReady,
    isThinking,
    ...result,
    getMove,
    analyze,
    stop,
  };
}

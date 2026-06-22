// Stockfish web worker loader
// Loads stockfish.js (WASM) and bridges UCI messages between main thread and engine.
let stockfish = null;
let ready = false;

function init() {
  if (stockfish) return;

  try {
    stockfish = new Worker("/stockfish/stockfish.js");
  } catch (e) {
    // Fallback: try loading via importScripts in a shared worker context
    postMessage({ type: "error", message: "Failed to load Stockfish: " + e.message });
    return;
  }

  stockfish.onmessage = function (e) {
    const line = typeof e.data === "string" ? e.data : e.data;

    if (line === "uciok") {
      stockfish.postMessage("isready");
    }

    if (line === "readyok") {
      ready = true;
      postMessage({ type: "ready" });
    }

    // Forward all info and bestmove lines to the main thread
    if (typeof line === "string" && (line.startsWith("info") || line.startsWith("bestmove"))) {
      postMessage({ type: "line", line: line });
    }
  };

  stockfish.onerror = function (e) {
    postMessage({ type: "error", message: e.message || "Stockfish worker error" });
  };

  stockfish.postMessage("uci");
}

self.onmessage = function (e) {
  const msg = e.data;

  if (msg.type === "init") {
    init();
    return;
  }

  if (!stockfish) return;

  if (msg.type === "command") {
    stockfish.postMessage(msg.command);
  }
};

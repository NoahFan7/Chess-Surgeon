"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Image input with OCR — lets users paste/upload a screenshot,
 * extracts text via Tesseract.js, and attempts to parse FEN or PGN.
 */
export default function ImageInput({ onExtract, onLoadStart, onLoadEnd }) {
  const [image, setImage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const fileInputRef = useRef(null);

  const processImage = useCallback(
    async (imgUrl) => {
      setStatus("Loading OCR engine…");
      setProgress(0);
      setError("");
      onLoadStart?.();

      try {
        const { default: Tesseract } = await import("tesseract.js");

        setStatus("Recognizing text…");
        const result = await Tesseract.recognize(imgUrl, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });

        const rawText = result.data.text || "";
        setOcrText(rawText);
        setStatus("Parsing chess notation…");

        const parsed = extractChessNotation(rawText);

        if (parsed) {
          setStatus(`Found ${parsed.type.toUpperCase()}`);
          onExtract?.(parsed);
        } else {
          setStatus("No FEN or PGN found in image");
          setError(
            "Could not detect chess notation. Try a clearer screenshot showing FEN or move list text."
          );
        }
      } catch (e) {
        setError("OCR failed: " + (e.message || "unknown error"));
        setStatus("");
      } finally {
        onLoadEnd?.();
      }
    },
    [onExtract, onLoadStart, onLoadEnd]
  );

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target.result;
        setImage(url);
        processImage(url);
      };
      reader.readAsDataURL(file);
    },
    [processImage]
  );

  // Paste from clipboard
  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  function clear() {
    setImage(null);
    setProgress(0);
    setStatus("");
    setError("");
    setOcrText("");
  }

  return (
    <div className="image-input-section">
      <div
        className={`drop-zone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {image ? (
          <div className="image-preview">
            <img src={image} alt="Screenshot" className="preview-img" />
          </div>
        ) : (
          <div className="drop-zone-text">
            <span className="drop-icon">📋</span>
            <p>
              Paste a screenshot (Ctrl+V), drag an image here, or click to
              upload
            </p>
            <p className="drop-hint">
              Works best with FEN text or move lists visible in the image
            </p>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {image && (
        <button className="btn secondary image-clear" onClick={clear}>
          Clear image
        </button>
      )}

      {progress > 0 && progress < 100 && (
        <div className="ocr-progress">
          <div
            className="ocr-progress-fill"
            style={{ width: `${progress}%` }}
          />
          <span className="ocr-progress-text">{status} {progress}%</span>
        </div>
      )}

      {status && progress >= 100 && (
        <p className="ocr-status">{status}</p>
      )}

      {error && <p className="input-error">{error}</p>}

      {ocrText && (
        <details className="ocr-raw">
          <summary>Raw OCR text</summary>
          <pre>{ocrText}</pre>
        </details>
      )}
    </div>
  );
}

/**
 * Extract chess notation (FEN or PGN) from raw OCR text.
 * Handles common OCR artifacts like 0 vs O, l vs 1, etc.
 */
function extractChessNotation(text) {
  // Clean up common OCR errors
  const cleaned = text
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\r/g, "\n")
    .trim();

  // Try to find a FEN string
  // FEN pattern: 8 ranks separated by /, followed by side to move, castling, en passant, halfmove, fullmove
  const fenPattern = /([rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+)\s+([wb])\s+([KQkq-]+)\s+([a-h1-8-]+)\s+(\d+)\s+(\d+)/;
  
  // Also try a looser FEN match (just the board position)
  const fenLoosePattern = /([rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+)/;

  // Fix common OCR errors in FEN: 0 -> O for castling, l -> 1 for empty squares
  const fenFixed = cleaned
    .replace(/([KQkq])0/g, "$1O")
    .replace(/0-0/g, "O-O");

  const fenMatch = fenFixed.match(fenPattern);
  if (fenMatch) {
    return { type: "fen", value: fenMatch[0].replace(/\s+/g, " ").trim() };
  }

  const fenLooseMatch = fenFixed.match(fenLoosePattern);
  if (fenLooseMatch) {
    // Try to construct a full FEN
    const board = fenLooseMatch[1];
    return { type: "fen", value: `${board} w KQkq - 0 1` };
  }

  // Try to find PGN moves
  // PGN pattern: move numbers (1. 2. etc.) followed by SAN moves
  // Also handle inline moves without numbers
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  // Try to extract moves from lines that look like PGN
  let pgnMoves = [];
  for (const line of lines) {
    // Match patterns like "1. e4 e5" or "1. e4 e5 2. Nf3"
    const movePattern = /(\d+)\.\s*([a-hNBRQKOxS]+[+#]?)(?:\s+([a-hNBRQKOxS]+[+#]?))?/g;
    let match;
    while ((match = movePattern.exec(line)) !== null) {
      if (match[2]) pgnMoves.push(match[2]);
      if (match[3]) pgnMoves.push(match[3]);
    }
  }

  // If no numbered moves found, try to find SAN moves directly
  if (pgnMoves.length === 0) {
    // Look for common SAN move patterns
    const sanPattern = /\b([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|O-O(?:-O)?[+#]?)\b/g;
    const allText = cleaned.replace(/\n/g, " ");
    let match;
    while ((match = sanPattern.exec(allText)) !== null) {
      const move = match[1];
      // Filter out false positives
      if (move.length >= 2 && move.length <= 10) {
        pgnMoves.push(move);
      }
    }
  }

  if (pgnMoves.length >= 2) {
    // Reconstruct a PGN string
    let pgn = "";
    for (let i = 0; i < pgnMoves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const white = pgnMoves[i];
      const black = pgnMoves[i + 1] || "";
      pgn += `${moveNum}. ${white}`;
      if (black) pgn += ` ${black}`;
      pgn += " ";
    }
    return { type: "pgn", value: pgn.trim() };
  }

  return null;
}

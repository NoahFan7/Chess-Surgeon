"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const IMG_SIZE = 32;
const CLASSES = [
  "wP", "wN", "wB", "wR", "wQ", "wK",
  "bP", "bN", "bB", "bR", "bQ", "bK",
  "empty",
];

const PIECE_TO_FEN = {
  wP: "P", wN: "N", wB: "B", wR: "R", wQ: "Q", wK: "K",
  bP: "p", bN: "n", bB: "b", bR: "r", bQ: "q", bK: "k",
  empty: "",
};

/**
 * Board image recognizer.
 * Takes a screenshot of a chess board, detects the board area,
 * splits into 64 squares, classifies each with the CNN model, and outputs FEN.
 */
export default function BoardRecognizer({ onFenExtract }) {
  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [detectedFen, setDetectedFen] = useState("");
  const [confidence, setConfidence] = useState([]);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const modelRef = useRef(null);
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load model on mount
  useEffect(() => {
    async function loadModel() {
      try {
        const tf = await import("@tensorflow/tfjs");
        setStatus("Loading AI model…");
        const model = await tf.loadLayersModel("/model/model.json");
        modelRef.current = model;
        setModelLoaded(true);
        setStatus("");
      } catch (e) {
        setError("Failed to load model: " + e.message);
      }
    }
    loadModel();
  }, []);

  // Detect board boundaries in the image
  const detectBoard = useCallback((imgData, width, height) => {
    // Convert to grayscale and find rows/cols with alternating colors
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = imgData[i * 4];
      const g = imgData[i * 4 + 1];
      const b = imgData[i * 4 + 2];
      gray[i] = (r + g + b) / 3;
    }

    // For each row, count transitions (significant brightness changes)
    const rowTransitions = new Array(height).fill(0);
    for (let y = 0; y < height; y++) {
      let lastBright = gray[y * width] > 128;
      let count = 0;
      for (let x = 1; x < width; x++) {
        const bright = gray[y * width + x] > 128;
        if (bright !== lastBright) {
          count++;
          lastBright = bright;
        }
      }
      rowTransitions[y] = count;
    }

    // For each column, count transitions
    const colTransitions = new Array(width).fill(0);
    for (let x = 0; x < width; x++) {
      let lastBright = gray[x] > 128;
      let count = 0;
      for (let y = 1; y < height; y++) {
        const bright = gray[y * width + x] > 128;
        if (bright !== lastBright) {
          count++;
          lastBright = bright;
        }
      }
      colTransitions[x] = count;
    }

    // Find the board boundaries (rows/cols with many transitions)
    const threshold = 4; // At least 4 transitions = likely board
    let top = 0, bottom = height - 1, left = 0, right = width - 1;

    for (let y = 0; y < height; y++) {
      if (rowTransitions[y] >= threshold) {
        top = y;
        break;
      }
    }
    for (let y = height - 1; y >= 0; y--) {
      if (rowTransitions[y] >= threshold) {
        bottom = y;
        break;
      }
    }
    for (let x = 0; x < width; x++) {
      if (colTransitions[x] >= threshold) {
        left = x;
        break;
      }
    }
    for (let x = width - 1; x >= 0; x--) {
      if (colTransitions[x] >= threshold) {
        right = x;
        break;
      }
    }

    // Make it square (use the smaller dimension)
    const w = right - left;
    const h = bottom - top;
    const size = Math.min(w, h);
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    const halfSize = size / 2;

    return {
      x: Math.max(0, cx - halfSize),
      y: Math.max(0, cy - halfSize),
      w: size,
      h: size,
    };
  }, []);

  // Process the image and recognize pieces
  const processImage = useCallback(
    async (imgUrl) => {
      if (!modelRef.current) {
        setError("Model not loaded yet.");
        return;
      }

      setProcessing(true);
      setError("");
      setStatus("Loading image…");

      try {
        const tf = await import("@tensorflow/tfjs");

        // Load image
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imgUrl;
        });

        // Draw to canvas
        const canvas = canvasRef.current;
        const maxDim = 512;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);

        // Detect board
        setStatus("Detecting board…");
        const board = detectBoard(imgData.data, w, h);

        // Split into 64 squares and classify each
        setStatus("Recognizing pieces…");
        const squareSize = board.w / 8;
        const predictions = [];
        const confidences = [];

        // Process squares in batches for efficiency
        const squares = [];
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const sx = board.x + col * squareSize;
            const sy = board.y + row * squareSize;
            squares.push({ sx, sy, row, col });
          }
        }

        // Create a tensor for all 64 squares at once
        const allSquareData = [];
        for (const sq of squares) {
          const sqCanvas = document.createElement("canvas");
          sqCanvas.width = IMG_SIZE;
          sqCanvas.height = IMG_SIZE;
          const sqCtx = sqCanvas.getContext("2d");
          sqCtx.drawImage(
            canvas,
            sq.sx,
            sq.sy,
            squareSize,
            squareSize,
            0,
            0,
            IMG_SIZE,
            IMG_SIZE
          );
          const sqData = sqCtx.getImageData(0, 0, IMG_SIZE, IMG_SIZE);
          const rgb = new Float32Array(IMG_SIZE * IMG_SIZE * 3);
          for (let i = 0; i < IMG_SIZE * IMG_SIZE; i++) {
            rgb[i * 3] = sqData.data[i * 4] / 255;
            rgb[i * 3 + 1] = sqData.data[i * 4 + 1] / 255;
            rgb[i * 3 + 2] = sqData.data[i * 4 + 2] / 255;
          }
          allSquareData.push(rgb);
        }

        // Run inference
        const inputTensor = tf.tensor4d(allSquareData, [64, IMG_SIZE, IMG_SIZE, 3]);
        const predictionsTensor = modelRef.current.predict(inputTensor);
        const predData = await predictionsTensor.data();

        inputTensor.dispose();
        predictionsTensor.dispose();

        // Parse predictions
        const board2d = [];
        for (let i = 0; i < 64; i++) {
          const probs = predData.slice(i * 13, (i + 1) * 13);
          let bestIdx = 0;
          let bestProb = 0;
          for (let j = 0; j < 13; j++) {
            if (probs[j] > bestProb) {
              bestProb = probs[j];
              bestIdx = j;
            }
          }
          predictions.push(CLASSES[bestIdx]);
          confidences.push({
            piece: CLASSES[bestIdx],
            confidence: (bestProb * 100).toFixed(1) + "%",
          });
        }

        // Convert to FEN
        const fen = boardToFen(predictions);
        setDetectedFen(fen);
        setConfidence(confidences);
        setStatus("Board recognized!");
        onFenExtract?.(fen);
      } catch (e) {
        setError("Recognition failed: " + e.message);
        setStatus("");
      } finally {
        setProcessing(false);
      }
    },
    [detectBoard, onFenExtract]
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
    setDetectedFen("");
    setConfidence([]);
    setStatus("");
    setError("");
  }

  // Convert 64-element array to FEN string
  function boardToFen(pieces) {
    const fenRows = [];
    for (let row = 0; row < 8; row++) {
      let fenRow = "";
      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const idx = row * 8 + col;
        const piece = pieces[idx];
        const fenChar = PIECE_TO_FEN[piece];
        if (fenChar === "") {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fenRow += emptyCount;
            emptyCount = 0;
          }
          fenRow += fenChar;
        }
      }
      if (emptyCount > 0) fenRow += emptyCount;
      fenRows.push(fenRow);
    }
    return fenRows.join("/") + " w KQkq - 0 1";
  }

  return (
    <div className="image-input-section">
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <canvas ref={previewCanvasRef} style={{ display: "none" }} />

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
            <img src={image} alt="Board screenshot" className="preview-img" />
          </div>
        ) : (
          <div className="drop-zone-text">
            <span className="drop-icon">📸</span>
            <p>
              Paste a board screenshot (Ctrl+V), drag an image here, or click
              to upload
            </p>
            <p className="drop-hint">
              The AI will detect the board and recognize each piece
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

      {!modelLoaded && !image && (
        <p className="ocr-status">Loading AI model…</p>
      )}

      {processing && (
        <div className="ocr-progress">
          <div className="ocr-progress-fill" style={{ width: "100%" }} />
          <span className="ocr-progress-text">{status}</span>
        </div>
      )}

      {status && !processing && (
        <p className="ocr-status">{status}</p>
      )}

      {error && <p className="input-error">{error}</p>}

      {detectedFen && (
        <div className="fen-result">
          <p className="move-side-title">Detected FEN:</p>
          <code className="fen-code">{detectedFen}</code>
          <button
            className="btn"
            onClick={() => onFenExtract?.(detectedFen)}
            style={{ marginTop: "0.5rem" }}
          >
            Load to board
          </button>
        </div>
      )}
    </div>
  );
}

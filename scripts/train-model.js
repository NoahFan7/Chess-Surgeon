/**
 * Chess piece CNN training script.
 *
 * 1. Generates synthetic training images (pieces on squares with augmentations)
 * 2. Trains a lightweight CNN (13 classes: 12 pieces + empty)
 * 3. Saves the model to public/model/
 *
 * Run with: node scripts/train-model.js
 */

const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const tf = require("@tensorflow/tfjs-node");

const IMG_SIZE = 32;
const NUM_CLASSES = 13; // 12 pieces + empty
const SAMPLES_PER_CLASS = 400;
const EPOCHS = 15;
const BATCH_SIZE = 64;

// Class labels
const CLASSES = [
  "wP", "wN", "wB", "wR", "wQ", "wK",
  "bP", "bN", "bB", "bR", "bQ", "bK",
  "empty",
];
const CLASS_TO_IDX = {};
CLASSES.forEach((c, i) => (CLASS_TO_IDX[c] = i));

// Board color schemes to simulate different platforms
const COLOR_SCHEMES = [
  { light: "#F0D9B5", dark: "#B58863" },   // lichess brown
  { light: "#EEEED2", dark: "#769656" },   // chess.com green
  { light: "#FFCE9E", dark: "#D18B47" },   // neutral
  { light: "#DEE3E6", dark: "#8CA2AD" },   // lichess blue
  { light: "#F1D9B5", dark: "#B58863" },   // wood
  { light: "#FFFFFF", dark: "#C0C0C0" },   // simple
];

// Load piece path data
const PIECE_DATA = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "lib", "piece-paths.json"), "utf8")
);

function buildPieceSVG(pieceKey, fillColor) {
  const data = PIECE_DATA[pieceKey];
  if (!data || !data.paths.length) return null;

  const isWhite = pieceKey[0] === "w";
  const stroke = "#000000";

  let pathElements = "";
  for (let i = 0; i < data.paths.length; i++) {
    const fill = isWhite ? "#ffffff" : "#000000";
    pathElements += `<path d="${data.paths[i]}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45" viewBox="0 0 45 45">
    <g fill="none" fill-rule="evenodd" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      ${pathElements}
    </g>
  </svg>`;
}

// Cache rendered piece images
const pieceImageCache = {};

async function getPieceImage(pieceKey) {
  if (pieceImageCache[pieceKey]) return pieceImageCache[pieceKey];
  const svg = buildPieceSVG(pieceKey);
  if (!svg) return null;
  const img = await loadImage(Buffer.from(svg));
  pieceImageCache[pieceKey] = img;
  return img;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function jitterColor(hex, amount = 20) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const jr = Math.max(0, Math.min(255, r + randomInt(-amount, amount)));
  const jg = Math.max(0, Math.min(255, g + randomInt(-amount, amount)));
  const jb = Math.max(0, Math.min(255, b + randomInt(-amount, amount)));
  return `rgb(${jr},${jg},${jb})`;
}

function applyNoise(ctx, width, height, intensity = 15) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = randomInt(-intensity, intensity);
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

async function generateSample(pieceKey) {
  const canvas = createCanvas(IMG_SIZE, IMG_SIZE);
  const ctx = canvas.getContext("2d");

  // Pick a random color scheme
  const scheme = COLOR_SCHEMES[randomInt(0, COLOR_SCHEMES.length - 1)];
  const isLightSquare = Math.random() > 0.5;
  const baseColor = isLightSquare ? scheme.light : scheme.dark;
  const jitteredColor = jitterColor(baseColor, 15);

  // Fill background
  ctx.fillStyle = jitteredColor;
  ctx.fillRect(0, 0, IMG_SIZE, IMG_SIZE);

  if (pieceKey !== "empty") {
    const pieceImg = await getPieceImage(pieceKey);
    if (pieceImg) {
      // Vary piece size slightly
      const scale = randomFloat(0.55, 0.75);
      const size = IMG_SIZE * scale;
      const offset = (IMG_SIZE - size) / 2;
      const xJitter = randomFloat(-2, 2);
      const yJitter = randomFloat(-2, 2);

      ctx.drawImage(
        pieceImg,
        offset + xJitter,
        offset + yJitter,
        size,
        size
      );
    }
  }

  // Apply augmentations
  // Random brightness/contrast
  const brightness = randomFloat(-25, 25);
  ctx.filter = `brightness(${100 + brightness}%) contrast(${randomFloat(90, 110)}%)`;

  // Add noise
  if (Math.random() > 0.3) {
    applyNoise(ctx, IMG_SIZE, IMG_SIZE, randomInt(5, 20));
  }

  return canvas;
}

function canvasToTensor(canvas) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE);
  // Extract RGB (drop alpha) from RGBA
  const numPixels = IMG_SIZE * IMG_SIZE;
  const rgb = new Uint8Array(numPixels * 3);
  const src = imageData.data;
  for (let i = 0; i < numPixels; i++) {
    rgb[i * 3] = src[i * 4];       // R
    rgb[i * 3 + 1] = src[i * 4 + 1]; // G
    rgb[i * 3 + 2] = src[i * 4 + 2]; // B
  }
  return tf.tensor3d(rgb, [IMG_SIZE, IMG_SIZE, 3]);
}

function buildModel() {
  const model = tf.sequential();

  model.add(
    tf.layers.conv2d({
      inputShape: [IMG_SIZE, IMG_SIZE, 3],
      filters: 32,
      kernelSize: 3,
      activation: "relu",
      padding: "same",
    })
  );
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  model.add(
    tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: "relu",
      padding: "same",
    })
  );
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  model.add(
    tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: "relu",
      padding: "same",
    })
  );
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 128, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: NUM_CLASSES, activation: "softmax" }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
}

async function train() {
  console.log("Generating training data...");

  const xs = [];
  const ys = [];

  for (const pieceClass of CLASSES) {
    console.log(`  Generating ${SAMPLES_PER_CLASS} samples for ${pieceClass}...`);
    for (let i = 0; i < SAMPLES_PER_CLASS; i++) {
      const canvas = await generateSample(pieceClass);
      xs.push(canvasToTensor(canvas));
      const label = new Array(NUM_CLASSES).fill(0);
      label[CLASS_TO_IDX[pieceClass]] = 1;
      ys.push(tf.tensor1d(label));
    }
  }

  console.log(`Total samples: ${xs.length}`);

  // Shuffle
  const indices = Array.from({ length: xs.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const xsShuffled = indices.map((i) => xs[i]);
  const ysShuffled = indices.map((i) => ys[i]);

  console.log("Stacking tensors...");
  const X = tf.stack(xsShuffled);
  const Y = tf.stack(ysShuffled);

  // Free individual tensors
  xsShuffled.forEach((t) => t.dispose());
  ysShuffled.forEach((t) => t.dispose());

  // Normalize
  const XNorm = X.div(255.0);
  X.dispose();

  console.log(`Training data shape: ${XNorm.shape}`);
  console.log(`Labels shape: ${Y.shape}`);

  console.log("Building model...");
  const model = buildModel();
  model.summary();

  console.log(`Training for ${EPOCHS} epochs...`);
  await model.fit(XNorm, Y, {
    epochs: EPOCHS,
    batchSize: BATCH_SIZE,
    validationSplit: 0.15,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(
          `  Epoch ${epoch + 1}/${EPOCHS} - loss: ${logs.loss.toFixed(4)} - acc: ${logs.acc.toFixed(4)} - val_loss: ${logs.val_loss.toFixed(4)} - val_acc: ${logs.val_acc.toFixed(4)}`
        );
      },
    },
  });

  // Save model
  const modelDir = path.join(__dirname, "..", "public", "model");
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }

  console.log("Saving model to public/model/...");
  await model.save(`file://${modelDir}`);

  // Save class labels
  fs.writeFileSync(
    path.join(modelDir, "classes.json"),
    JSON.stringify(CLASSES)
  );

  console.log("Done! Model saved.");

  // Cleanup
  XNorm.dispose();
  Y.dispose();
  model.dispose();
}

train().catch((err) => {
  console.error("Training failed:", err);
  process.exit(1);
});

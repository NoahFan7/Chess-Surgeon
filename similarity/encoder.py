import torch
import torch.nn as nn
from huggingface_hub import PyTorchModelHubMixin
import numpy as np
import chess

CHESSLM_REPO_ID = "odestorm1/chesslm"

class ChessEncoder(nn.Module, PyTorchModelHubMixin):
    def __init__(self, d_model=256, nhead=8, num_layers=6, dim_feedforward=1024, dropout=0.1):
        super().__init__()
        self.d_model = d_model
        self.nhead = nhead
        self.num_layers = num_layers
        self.dim_feedforward = dim_feedforward
        self.dropout_rate = dropout

        self.patch_embed = nn.Linear(1, d_model)
        self.turn_embed = nn.Embedding(2, d_model)
        self.pos_embed = nn.Parameter(torch.randn(1, 64, d_model) * 0.02)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=nhead, dim_feedforward=dim_feedforward,
            dropout=dropout, batch_first=True, norm_first=True
        )
        self.transformer = nn.TransformerEncoder(
            encoder_layer, num_layers=num_layers, norm=nn.LayerNorm(d_model)
        )
        self.layer_norm = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, board_state, turn):
        batch_size = board_state.size(0)
        x = board_state.view(batch_size, 64, 1).float()
        x = self.patch_embed(x)
        x = x + self.pos_embed
        turn_emb = self.turn_embed(turn).unsqueeze(1).expand(-1, 64, -1)
        x = x + turn_emb
        x = self.transformer(x)
        x = self.layer_norm(x)
        return x

    def encode_position(self, board_matrix, turn_value):
        self.eval()
        with torch.no_grad():
            board_tensor = torch.tensor(board_matrix, dtype=torch.float32).unsqueeze(0)
            turn_tensor = torch.tensor([turn_value], dtype=torch.long)
            device = next(self.parameters()).device
            board_tensor = board_tensor.to(device)
            turn_tensor = turn_tensor.to(device)
            sequence_embedding = self.forward(board_tensor, turn_tensor)
            pooled_embedding = torch.mean(sequence_embedding, dim=1)
            return pooled_embedding.squeeze(0).cpu().numpy()

    def encode_batch(self, board_matrices, turn_values):
        self.eval()
        with torch.no_grad():
            board_tensor = torch.tensor(np.array(board_matrices), dtype=torch.float32)
            turn_tensor = torch.tensor(turn_values, dtype=torch.long)
            device = next(self.parameters()).device
            board_tensor = board_tensor.to(device)
            turn_tensor = turn_tensor.to(device)
            sequence_embedding = self.forward(board_tensor, turn_tensor)
            pooled_embedding = torch.mean(sequence_embedding, dim=1)
            return pooled_embedding.cpu().numpy()


PIECE_VALUES = {
    'P': 1, 'N': 2, 'B': 3, 'R': 4, 'Q': 5, 'K': 6,
    'p': -1, 'n': -2, 'b': -3, 'r': -4, 'q': -5, 'k': -6
}

_model = None

def get_model():
    global _model
    if _model is None:
        print(f"Loading ChessEncoder from {CHESSLM_REPO_ID}...")
        _model = ChessEncoder.from_pretrained(CHESSLM_REPO_ID)
        _model.eval()
        print("Model loaded.")
    return _model

def fen_to_board_matrix(fen: str) -> np.ndarray:
    board = chess.Board(fen)
    matrix = np.zeros((8, 8), dtype=np.float32)
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece is not None:
            rank = chess.square_rank(square)
            file = chess.square_file(square)
            matrix[rank, file] = PIECE_VALUES[piece.symbol()]
    return matrix.flatten()

def fen_to_turn(fen: str) -> int:
    board = chess.Board(fen)
    return 0 if board.turn == chess.WHITE else 1

def fen_to_embedding(fen: str) -> np.ndarray:
    model = get_model()
    board_matrix = fen_to_board_matrix(fen)
    turn_value = fen_to_turn(fen)
    return model.encode_position(board_matrix, turn_value)

def fens_to_embeddings(fens: list[str], batch_size=64) -> np.ndarray:
    model = get_model()
    all_embeddings = []
    for i in range(0, len(fens), batch_size):
        batch_fens = fens[i:i+batch_size]
        matrices = [fen_to_board_matrix(f) for f in batch_fens]
        turns = [fen_to_turn(f) for f in batch_fens]
        embeddings = model.encode_batch(matrices, turns)
        all_embeddings.append(embeddings)
        if (i // batch_size) % 10 == 0:
            print(f"  Processed {i+len(batch_fens)}/{len(fens)} positions...")
    return np.vstack(all_embeddings)

import torch
import torch.nn as nn
import chess
import numpy as np
import os
import sys

# ================= 配置 =================
MODEL_FILE = "my_chess_ai.pth"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# =======================================

# --- 1. 神经网络定义 (必须与训练时一致) ---
class SimpleChessNet(nn.Module):
    def __init__(self):
        super(SimpleChessNet, self).__init__()
        self.conv1 = nn.Conv2d(12, 64, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(64)
        self.conv2 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(128)
        self.conv3 = nn.Conv2d(128, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.fc1 = nn.Linear(128 * 8 * 8, 1024)
        self.fc2 = nn.Linear(1024, 4096)

    def forward(self, x):
        x = torch.relu(self.bn1(self.conv1(x)))
        x = torch.relu(self.bn2(self.conv2(x)))
        x = torch.relu(self.bn3(self.conv3(x)))
        x = x.view(-1, 128 * 8 * 8)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# --- 2. 工具类 ---
class ChessUtils:
    piece_map = {
        'P': 0, 'N': 1, 'B': 2, 'R': 3, 'Q': 4, 'K': 5,
        'p': 6, 'n': 7, 'b': 8, 'r': 9, 'q': 10, 'k': 11
    }

    @staticmethod
    def fen_to_tensor(fen):
        board = chess.Board(fen)
        x = np.zeros((12, 8, 8), dtype=np.float32)
        for i in range(64):
            piece = board.piece_at(i)
            if piece:
                channel = ChessUtils.piece_map[piece.symbol()]
                row, col = divmod(i, 8)
                x[channel, row, col] = 1.0
        return torch.tensor(x).unsqueeze(0)

    @staticmethod
    def index_to_move(index):
        from_sq = index // 64
        to_sq = index % 64
        return chess.Move(from_sq, to_sq).uci()

# --- 3. 加载模型 ---
def load_model():
    if not os.path.exists(MODEL_FILE):
        print(f"❌ 错误：找不到模型文件 {MODEL_FILE}")
        sys.exit(1)
    
    print(f"正在加载模型 {MODEL_FILE} 到 {DEVICE} ...")
    model = SimpleChessNet().to(DEVICE)
    model.load_state_dict(torch.load(MODEL_FILE, map_location=DEVICE))
    model.eval()
    print("✅ 模型加载成功！")
    return model

# --- 4. 核心分析逻辑 ---
def analyze_fen(model, fen):
    try:
        board = chess.Board(fen)
    except ValueError:
        print("❌ FEN 格式错误，请检查输入。")
        return

    print("\n" + "="*40)
    print(f"当前局面 (轮到 {'白方' if board.turn == chess.WHITE else '黑方'} 走):")
    print("-" * 20)
    print(board)
    print("-" * 20)

    input_tensor = ChessUtils.fen_to_tensor(fen).to(DEVICE)

    with torch.no_grad():
        output = model(input_tensor)
        probs = torch.softmax(output, dim=1)
        
        # 获取前 10 个最高概率的走法
        top_probs, top_indices = torch.topk(probs, 10, dim=1)
        
        print("\n🤖 AI 思考中 (Top 10 候选项):")
        print(f"{'排名':<6} {'走法':<10} {'置信度':<10} {'状态'}")
        print("-" * 40)

        final_move = None
        
        for i in range(10):
            idx = top_indices[0][i].item()
            prob = top_probs[0][i].item()
            move_uci = ChessUtils.index_to_move(idx)
            
            # 检查合法性
            is_legal = False
            try:
                move_obj = chess.Move.from_uci(move_uci)
                if move_obj in board.legal_moves:
                    is_legal = True
            except:
                pass
            
            status = "✅ 合法" if is_legal else "🚫 非法 (跳过)"
            print(f"#{i+1:<5} {move_uci:<10} {prob:.2%}{' ':<4} {status}")

            # 选定第一个合法的走法
            if is_legal and final_move is None:
                final_move = move_uci

        print("="*40)
        if final_move:
            print(f"👉 AI 最终决定: \033[92m{final_move}\033[0m")
        else:
            print("💀 AI 彻底懵了 (前10步全是错的)，随机走一步...")
            if list(board.legal_moves):
                import random
                print(f"🎲 随机兜底: {random.choice(list(board.legal_moves)).uci()}")
            else:
                print("🏁 游戏结束 (无路可走)")
        print("="*40 + "\n")

# --- 5. 主循环 ---
if __name__ == "__main__":
    model = load_model()
    
    print("输入 'q' 或 'exit' 退出程序。")
    print("输入 'start' 使用初始局面。")
    
    while True:
        user_input = input("请输入 FEN > ").strip()
        
        if user_input.lower() in ['q', 'exit', 'quit']:
            print("再见！")
            break
        
        if user_input.lower() == 'start':
            user_input = chess.STARTING_FEN
            
        if not user_input:
            continue
            
        analyze_fen(model, user_input)
import sys
import os
import torch
import torch.nn as nn
import chess
import numpy as np
import random

# ==========================================
# 1. 配置区域
# ==========================================
# 确保这里的文件名和你训练出来的模型文件名一致
MODEL_FILENAME = "my_chess_ai.pth"

# 自动获取当前脚本所在目录，防止路径错误
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, MODEL_FILENAME)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ==========================================
# 2. 神经网络定义 (必须与 train.py 一致)
# ==========================================
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

# ==========================================
# 3. 工具类
# ==========================================
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
        # 增加 Batch 维度: [12, 8, 8] -> [1, 12, 8, 8]
        return torch.tensor(x).unsqueeze(0)

    @staticmethod
    def index_to_move(index):
        """将数字索引转回 UCI 字符串 (e.g. 123 -> 'e2e4')"""
        from_sq = index // 64
        to_sq = index % 64
        return chess.Move(from_sq, to_sq).uci()

# ==========================================
# 4. 核心引擎逻辑
# ==========================================
def load_model():
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model not found at {MODEL_PATH}", file=sys.stderr)
        return None
    
    try:
        model = SimpleChessNet().to(DEVICE)
        # map_location 确保在 CPU 机器上也能加载 GPU 训练的模型
        model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        model.eval() # 切换到预测模式
        return model
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        return None

def get_best_move(model, fen):
    """
    输入 FEN，返回 AI 认为最好且合法的 UCI 走法字符串
    """
    try:
        # 1. 创建棋盘对象用于规则检查
        board = chess.Board(fen)
        
        # 2. 模型预测
        input_tensor = ChessUtils.fen_to_tensor(fen).to(DEVICE)
        with torch.no_grad():
            output = model(input_tensor)
            
            # 转为概率分布
            probs = torch.softmax(output, dim=1)
            
            # --- 关键逻辑：取前 50 个候选项 ---
            # 我们不只看第 1 名，防止第 1 名是非法移动
            top_probs, top_indices = torch.topk(probs, 50, dim=1)
            
            # 3. 遍历候选项，寻找第一个合法走法
            for i in range(50):
                move_idx = top_indices[0][i].item()
                move_uci = ChessUtils.index_to_move(move_idx)
                
                try:
                    # 尝试解析并检查是否合法
                    move_obj = chess.Move.from_uci(move_uci)
                    if move_obj in board.legal_moves:
                        # 找到了！这是 AI 最想走的合法步
                        # 如果这不是 AI 的第一选择，记录一下它本来想干嘛（调试用）
                        if i > 0:
                            print(f"Correction: AI wanted illegal move (Rank {i}), forced: {move_uci}", file=sys.stderr)
                        return move_uci
                except:
                    continue
        
        # 4. 兜底逻辑：如果前 50 个都是非法（极少见），随机走一步
        print("Warning: AI confused, playing random move.", file=sys.stderr)
        legal_moves = list(board.legal_moves)
        if legal_moves:
            return random.choice(legal_moves).uci()
        
        return "(none)" # 无路可走（将死或和棋）

    except Exception as e:
        print(f"Inference error: {e}", file=sys.stderr)
        return "(none)"

def main():
    # 打印启动日志到 stderr (不要打印到 stdout，否则 Electron 会解析错误)
    print(f"AI Engine Starting... Device: {DEVICE}", file=sys.stderr)
    
    model = load_model()
    if model is None:
        return

    # 无限循环，监听 Electron 发来的指令
    while True:
        try:
            # 读取一行 (阻塞式)
            line = sys.stdin.readline()
            if not line: break # EOF
            
            line = line.strip()
            if not line: continue

            # 协议匹配: Electron 发送 "bestmove <ms> <fen>"
            if line.startswith("bestmove"):
                parts = line.split(" ", 2)
                
                if len(parts) < 3:
                    continue
                
                # parts[1] 是时间(ms)，忽略
                fen = parts[2]
                
                # 计算最佳走法
                best_move = get_best_move(model, fen)
                
                # --- 返回结果给 Electron ---
                # 必须 flush，确保数据立即发送
                print(f"bestmove {best_move}", flush=True)
                
                # 调试日志
                print(f"AI played: {best_move}", file=sys.stderr)

            elif line == "quit":
                break

        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Loop error: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
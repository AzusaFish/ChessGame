import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import chess
import numpy as np
import os
import time
from tqdm import tqdm # 进度条库 (pip install tqdm)

# ==========================================
# 1. 工具类 (不变)
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
        return x # 返回 numpy array，后面统一转 tensor

    @staticmethod
    def move_to_index(uci_move):
        move = chess.Move.from_uci(uci_move)
        return move.from_square * 64 + move.to_square

# ==========================================
# 2. ⚡ 优化的数据集 (核心修改)
# ==========================================
class InMemoryChessDataset(Dataset):
    def __init__(self, csv_file):
        print(f"正在读取 CSV: {csv_file} ...")
        df = pd.read_csv(csv_file)
        
        print(f"正在预处理 {len(df)} 条数据 (这可能需要 1-2 分钟，请耐心等待)...")
        
        # --- 核心优化：一次性把所有 FEN 转成 Tensor 存入内存 ---
        # 这样训练时就不用重复解析字符串了，速度起飞！
        
        self.X = []
        self.Y = []
        
        # 使用 tqdm 显示进度条
        for _, row in tqdm(df.iterrows(), total=len(df)):
            try:
                # 转换输入
                tensor_x = ChessUtils.fen_to_tensor(row['fen'])
                # 转换标签
                idx_y = ChessUtils.move_to_index(row['best_move'])
                
                self.X.append(tensor_x)
                self.Y.append(idx_y)
            except Exception:
                continue # 跳过坏数据

        # 转为巨大的 Tensor 块
        # 形状: [N, 12, 8, 8]
        self.X = torch.tensor(np.array(self.X), dtype=torch.float32)
        # 形状: [N]
        self.Y = torch.tensor(self.Y, dtype=torch.long)
        
        print(f"✅ 数据预处理完成！占用内存约: {self.X.element_size() * self.X.nelement() / 1024 / 1024:.2f} MB")

    def __len__(self):
        return len(self.Y)

    def __getitem__(self, idx):
        # 训练时直接取数，速度极快
        return self.X[idx], self.Y[idx]

# ==========================================
# 3. 网络结构 (不变)
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
# 4. 主程序
# ==========================================
if __name__ == "__main__":
    # ⚡ 优化参数 1: 加大 Batch Size
    # 10万条数据，可以用 256, 512 甚至 1024
    BATCH_SIZE = 512
    EPOCHS = 20 # 数据多了，可以多练几轮
    LR = 0.001
    
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"使用设备: {DEVICE}")

    # 1. 准备数据
    # 注意：第一次启动会慢（因为在做预处理），后面训练会飞快
    dataset = InMemoryChessDataset('chess_dataset.csv')
    
    # ⚡ 优化参数 2: 开启 num_workers (Windows下建议设为 2 或 4, Linux 可以更高)
    # pin_memory=True 可以加速数据从 CPU 传到 GPU
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=4, pin_memory=True)

    # 2. 准备模型
    model = SimpleChessNet().to(DEVICE)
    
    # 加载旧模型逻辑
    model_path = "my_chess_ai.pth"
    if os.path.exists(model_path):
        print(f"加载旧模型继续训练: {model_path}")
        model.load_state_dict(torch.load(model_path, map_location=DEVICE))
        LR = 0.0002 # 微调时降低学习率

    optimizer = optim.Adam(model.parameters(), lr=LR)
    criterion = nn.CrossEntropyLoss()

    # 3. 开始训练
    print("开始极速训练...")
    model.train()
    
    for epoch in range(EPOCHS):
        start_time = time.time()
        total_loss = 0
        correct = 0
        total = 0
        
        # 使用 tqdm 包装 dataloader 显示进度条
        loop = tqdm(dataloader, desc=f"Epoch {epoch+1}/{EPOCHS}")
        
        for inputs, labels in loop:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
            # 更新进度条上的信息
            loop.set_postfix(loss=loss.item(), acc=100 * correct / total)

        epoch_duration = time.time() - start_time
        print(f"Epoch {epoch+1} 耗时: {epoch_duration:.2f}s | 平均 Loss: {total_loss/len(dataloader):.4f} | 准确率: {100 * correct / total:.2f}%")

    # 4. 保存
    torch.save(model.state_dict(), "my_chess_ai.pth")
    print("训练完成！模型已保存。")
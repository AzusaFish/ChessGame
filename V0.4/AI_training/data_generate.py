import chess
import chess.engine
import csv
import random
import os
import time
import multiprocessing

# ================= 配置区域 (请修改这里) =================

# 1. 设置 Stockfish 引擎路径
# Windows 用户示例:
# STOCKFISH_PATH = "./stockfish-windows-x86-64-avx2.exe"
# Linux/WSL 用户示例:
STOCKFISH_PATH = "AI_training\\stockfish-windows-x86-64-avx2.exe"

# 2. 这次想生成多少条数据？
# (因为是追加模式，你可以每次运行都设为 5000 或 10000，慢慢攒)
TOTAL_DATA_TARGET = 100000

# 3. 思考深度 (Depth)
# depth=8 平衡了速度和棋力。想要更高质量可以设为 10 或 12。
LIMIT = chess.engine.Limit(depth=12)

# =======================================================

def worker_task(worker_id, num_to_generate):
    """
    工作进程：负责生成 num_to_generate 条数据
    """
    print(f"[Worker {worker_id}] 启动，目标: {num_to_generate} 条")
    
    data_buffer = []
    try:
        # 每个进程独立启动引擎
        engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)
        engine.configure({"Hash": 16}) # 减少内存占用
    except Exception as e:
        print(f"[Worker {worker_id}] 引擎启动失败: {e}")
        print(f"请检查路径: {STOCKFISH_PATH}")
        return []

    count = 0
    while count < num_to_generate:
        board = chess.Board()
        
        # --- 1. 随机乱走 (5-24步) ---
        # 目的是进入中局，防止 AI 只背开局
        random_ply = random.randint(1, 15)
        game_over = False
        
        for _ in range(random_ply):
            if board.is_game_over():
                game_over = True
                break
            try:
                legal_moves = list(board.legal_moves)
                if not legal_moves:
                    game_over = True
                    break
                move = random.choice(legal_moves)
                board.push(move)
            except:
                game_over = True
                break
        
        if game_over: continue

        # --- 2. Stockfish 老师解题 ---
        try:
            result = engine.analyse(board, LIMIT)
            
            if 'pv' not in result: continue # 没算出来
            
            best_move = result['pv'][0].uci()
            
            # 获取评分 (Centipawn)
            score = result['score'].relative.score(mate_score=10000)
            if score is None: score = 0

            # 收集结果
            data_buffer.append([board.fen(), best_move, score])
            count += 1
            
            if count % 200 == 0:
                print(f"[Worker {worker_id}] 进度: {count}/{num_to_generate}")

        except Exception as e:
            pass # 忽略极少数的引擎报错

    engine.quit()
    print(f"[Worker {worker_id}] 完成任务")
    return data_buffer

def main():
    # 检查引擎路径是否存在
    if not os.path.exists(STOCKFISH_PATH) and not STOCKFISH_PATH.startswith("stockfish"):
        print(f"错误：找不到 Stockfish文件，请修改代码中的 STOCKFISH_PATH。\n当前路径: {STOCKFISH_PATH}")
        return

    start_time = time.time()
    
    # 1. 规划多进程
    cpu_count = multiprocessing.cpu_count()
    num_workers = max(1, cpu_count - 1) # 留一个核给系统
    print(f"检测到 {cpu_count} 核 CPU，将启动 {num_workers} 个进程并发生成...")
    
    chunk_size = TOTAL_DATA_TARGET // num_workers
    tasks = [(i, chunk_size) for i in range(num_workers)]

    # 2. 开始并行生成
    with multiprocessing.Pool(processes=num_workers) as pool:
        # starmap 用于传递多个参数
        results = pool.starmap(worker_task, tasks)

    # 3. 合并数据并追加写入 (核心修改部分)
    print("正在合并数据并写入文件...")
    
    filename = 'chess_dataset.csv'
    # 检查文件是否已存在
    file_exists = os.path.isfile(filename)
    
    total_rows = 0
    
    # mode='a' 表示 Append (追加)
    with open(filename, mode='a', newline='') as f:
        writer = csv.writer(f)
        
        # 只有当文件不存在时，才写入表头
        # 这样可以防止文件中间出现重复的表头
        if not file_exists:
            print("检测到新文件，写入表头...")
            writer.writerow(['fen', 'best_move', 'score'])
        else:
            print("检测到已有文件，将在末尾追加数据...")
            
        for worker_data in results:
            writer.writerows(worker_data)
            total_rows += len(worker_data)

    end_time = time.time()
    duration = end_time - start_time
    
    print(f"\n========================================")
    print(f"全部完成！本次新增: {total_rows} 条数据")
    print(f"数据保存在: {filename}")
    print(f"总耗时: {duration:.2f} 秒")
    print(f"平均速度: {total_rows / duration:.2f} 条/秒")
    print(f"========================================")

if __name__ == '__main__':
    # Windows 必须加这行
    multiprocessing.freeze_support()
    main()
import {
    color,
    getValidMoves_NoKing,
    getValidKingMoves,
    avoidCheck,
    inCheck,
    checkGameResult,
    canPromote,
    createFEN,
    createFENForRecords,
    checkThreeRepeated,
    UCItoMove,
    canCapture,
    getAlgebraicNotation,
    sleep
} from './utils/chess-rules';

export type BoardType = (string | null)[][];
export type TurnType = 'White' | 'Black';
export type GameMode = 'PvC' | 'PvP';
export type GameState = {
    board: BoardType;
    turn: TurnType;
    history: string[];
    isGameOver: boolean;
    inCheck: { White: boolean, Black: boolean };
    promotionPending: { row: number, col: number, color: TurnType } | null;
};

export class GameCore {
    board: BoardType;
    turn: TurnType;
    castleRights: { wK: boolean, wQ: boolean, bK: boolean, bQ: boolean };
    history: string[];
    enPassantTarget: any[];
    FENrecords: Map<string, number>;
    mode: GameMode;
    diff: number;
    playerSide: TurnType;
    isGameOver: boolean;
    blackInCheck: boolean;
    whiteInCheck: boolean;
    
    private updateCb: (state: GameState) => void = () => { };
    private promotionCallback: ((piece: string) => void) | null = null;

    constructor() {
        this.board = [];
        this.turn = 'White';
        this.castleRights = { wK: true, wQ: true, bK: true, bQ: true };
        this.history = [];
        this.enPassantTarget = [];
        this.FENrecords = new Map();
        this.mode = 'PvC';
        this.diff = 1;
        this.playerSide = 'White';
        this.isGameOver = false;
        this.blackInCheck = false;
        this.whiteInCheck = false;
        this.reset();
    }

    reset() {
        this.board = [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];
        this.turn = 'White';
        this.castleRights = { wK: true, wQ: true, bK: true, bQ: true };
        this.history = [];
        this.enPassantTarget = [];
        this.FENrecords.clear();
        this.isGameOver = false;
        this.blackInCheck = false;
        this.whiteInCheck = false;
        this.promotionCallback = null;
    }

    onUpdate(cb: (state: GameState) => void) {
        this.updateCb = cb;
    }

    emitUpdate(promotionPending: { row: number, col: number, color: TurnType } | null = null) {
        this.updateCb({
            board: JSON.parse(JSON.stringify(this.board)), // Deep copy to trigger reactivity
            turn: this.turn,
            history: [...this.history],
            isGameOver: this.isGameOver,
            inCheck: { White: this.whiteInCheck, Black: this.blackInCheck },
            promotionPending
        });
    }

    start(options: { mode?: GameMode, diff?: number, playerSide?: TurnType } = {}) {
        if (options.mode) this.mode = options.mode;
        if (typeof options.diff === 'number') this.diff = options.diff;
        if (options.playerSide) this.playerSide = options.playerSide;
        
        // Randomize side if not specified and PvC
        if (this.mode === 'PvC' && !options.playerSide) {
             this.playerSide = Math.random() < 0.5 ? 'White' : 'Black';
        }

        this.reset();
        this.updateStatus();
        this.checkThreeFold();
        this.emitUpdate();

        if (this.mode === 'PvC' && this.turn !== this.playerSide) {
            this.computerMove();
        }
    }

    updateStatus() {
        if (this.board[0]?.[0] !== 'r') this.castleRights.bQ = false;
        if (this.board[0]?.[7] !== 'r') this.castleRights.bK = false;
        if (this.board[7]?.[0] !== 'R') this.castleRights.wQ = false;
        if (this.board[7]?.[7] !== 'R') this.castleRights.wK = false;
        if (this.board[0]?.[4] !== 'k') {
            this.castleRights.bK = false;
            this.castleRights.bQ = false;
        }
        if (this.board[7]?.[4] !== 'K') {
            this.castleRights.wK = false;
            this.castleRights.wQ = false;
        }
    }

    checkThreeFold() {
        const fen = createFENForRecords(this.board, this.turn, this.castleRights, this.enPassantTarget, Math.floor(this.history.length / 2) + 1, this.history.length + 1);
        this.FENrecords.set(fen, (this.FENrecords.get(fen) || 0) + 1);
        if (checkThreeRepeated(this.FENrecords)) {
            this.addHistoryRecord(-1, -1, -1, -1, "Threefold repetition");
            setTimeout(() => { alert("Draw by threefold repetition."); }, 100);
            this.isGameOver = true;
        }
    }

    addHistoryRecord(fromRow: number, fromCol: number, toRow: number, toCol: number, piece: string, promoteChoice: string | null = null) {
        const historyLength = this.history.length + 1;
        if (piece === "O-O" || piece === "O-O-O") {
            this.history.push(`${historyLength}. ${piece}`);
            return;
        }
        if (piece === "Checkmate") {
            this.history.push(`${historyLength}. Checkmate - Game Over`);
            return;
        }
        if (piece === "Stalemate") {
            this.history.push(`${historyLength}. Stalemate - Game Over`);
            return;
        }
        if (piece === "Threefold repetition") {
            this.history.push(`${historyLength}. Draw by Threefold repetition`);
            return;
        }

        const from = getAlgebraicNotation(fromRow, fromCol);
        const to = getAlgebraicNotation(toRow, toCol);
        const pieceSymbol = piece.toUpperCase() === 'P' ? '' : piece.toUpperCase();
        const moveText = promoteChoice ? `${pieceSymbol} ${from}->${to}=${promoteChoice.toUpperCase()}` : `${pieceSymbol} ${from}->${to}`;
        this.history.push(`${historyLength}. ${moveText}`);
    }

    async computerMove() {
        if (this.isGameOver) return;
        
        const fen = createFEN(this.board, this.turn, this.castleRights, this.enPassantTarget, Math.floor(this.history.length / 2) + 1, this.history.length + 1);
        
        // Mock engine call or use IPC if available
        let bestMove = null;
            if ((window as any).api && (window as any).api.getBestMove) {
                 // Calculate think time based on difficulty (use reasonable seconds -> convert to ms)
                 let thinkSeconds = 1; // default seconds
                 switch(this.diff) {
                     case 1: thinkSeconds = Math.random() * 0.5 + 0.5; break;   // 0.5 - 1.0s
                     case 2: thinkSeconds = Math.random() * 1.0 + 1.0; break;   // 1.0 - 2.0s
                     case 3: thinkSeconds = Math.random() * 2.0 + 2.0; break;   // 2.0 - 4.0s
                     case 4: thinkSeconds = Math.random() * 4.0 + 4.0; break;   // 4.0 - 8.0s
                     case 5: thinkSeconds = Math.random() * 6.0 + 6.0; break;   // 6.0 - 12.0s
                     default: thinkSeconds = 8.0; break;  // 3.0 - 8.0s
                 }

                 // Convert to milliseconds and ensure a minimum of 200 ms
                 const thinkTime = Math.min(Math.max(200, Math.round(thinkSeconds * 300)),2500);

                 console.log('computerMove: diff=', this.diff, 'thinkSeconds=', thinkSeconds, 'thinkTime(ms)=', thinkTime);

                 try {
                    const api = (window as any).api;
                    const callPromise = api.getBestMove(fen, thinkTime);
                    // Protect against engine hanging by racing with a timeout (thinkTime + 5s buffer)
                    const timeoutMs = thinkTime + 5000;
                    const result = await Promise.race([
                        callPromise,
                        new Promise<string | null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
                    ]);

                    if (!result) {
                        console.warn('Engine did not respond in time; result=null; falling back to random move');
                        bestMove = null;
                    } else {
                        bestMove = result;
                    }
                 } catch (e) {
                     console.error("Engine error:", e);
                 }
        } else {
            console.warn("Engine API not found, using random move (Mock)");
            await sleep(500);
            
            // Fallback: Find a random valid move
            const allMoves: {from: {row: number, col: number}, to: {row: number, col: number}, promotion?: string}[] = [];
            
            for(let r=0; r<8; r++) {
                for(let c=0; c<8; c++) {
                    const piece = this.board[r][c];
                    if(piece && color(piece) === this.turn) {
                        const moves = this.getValidMovesForSquare(r, c);
                        for(const m of moves) {
                            allMoves.push({
                                from: {row: r, col: c},
                                to: {row: m[0], col: m[1]},
                                promotion: (piece.toUpperCase() === 'P' && (m[0] === 0 || m[0] === 7)) ? 'q' : undefined
                            });
                        }
                    }
                }
            }
            
            if(allMoves.length > 0) {
                const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
                // Convert to UCI for consistency if needed, or just execute
                if (randomMove) {
                    await this.executeMove(randomMove.from.row, randomMove.from.col, randomMove.to.row, randomMove.to.col, randomMove.promotion);
                }
            } else {
                console.log("No valid moves for computer (Stalemate/Checkmate should have been caught).");
            }
        }

        console.log("Computer's best move (UCI): ", bestMove);

        if (!bestMove || bestMove === "null" || bestMove === "(none)") {
            console.log("No valid moves from computer.");
            return;
        }

        const move = UCItoMove(bestMove);
        if (move) {
            await this.executeMove(move.from.row, move.from.col, move.to.row, move.to.col, move.promotion || null);
        }
    }

    async handleSquareClick(row: number, col: number, selectedSquare: { row: number, col: number } | null): Promise<{ row: number, col: number } | null> {
        if (this.isGameOver) return null;
        if (this.mode === 'PvC' && this.turn !== this.playerSide) return null;

        // If no square selected, try to select one
        if (!selectedSquare) {
            const piece = this.board[row]?.[col];
            if (piece && color(piece) === this.turn) {
                return { row, col }; // Return new selection
            }
            return null;
        }

        // If clicking same square, deselect
        if (selectedSquare.row === row && selectedSquare.col === col) {
            return null;
        }

        // Try to move
        const movingPiece = this.board[selectedSquare.row]?.[selectedSquare.col];
        if (!movingPiece) return null;

        let validMoveTo = [];
        if (movingPiece.toUpperCase() === 'K') {
            validMoveTo = getValidKingMoves(selectedSquare.row, selectedSquare.col, movingPiece, this.board, color(movingPiece), this.castleRights);
            validMoveTo = avoidCheck(validMoveTo, this.board, color(movingPiece), selectedSquare, movingPiece);
        } else {
            validMoveTo = getValidMoves_NoKing(selectedSquare.row, selectedSquare.col, movingPiece, this.board, color(movingPiece), this.enPassantTarget);
            validMoveTo = avoidCheck(validMoveTo, this.board, color(movingPiece), selectedSquare, movingPiece);
        }

        let isValid = false;
        let moveData = null;

        for (const move of validMoveTo) {
            if (move[0] === row && move[1] === col) {
                isValid = true;
                moveData = move;
                break;
            }
        }

        if (isValid) {
            await this.executeMove(selectedSquare.row, selectedSquare.col, row, col, null, moveData);
            return null; // Deselect after move
        } else {
            // If invalid move but clicked on own piece, select that piece instead
            const piece = this.board[row]?.[col];
            if (piece && color(piece) === this.turn) {
                return { row, col };
            }
            return null; // Deselect
        }
    }

    async executeMove(fromRow: number, fromCol: number, toRow: number, toCol: number, promotionChoice: string | null = null, preCalculatedMoveData: any = null) {
        const movingPiece = this.board[fromRow]?.[fromCol];
        if (!movingPiece) return;

        let shortCastle = false;
        let longCastle = false;
        let enPassant = false;

        // If we don't have pre-calculated data (e.g. from engine), we might need to infer special moves
        // But for simplicity, let's assume standard move unless specified
        if (preCalculatedMoveData && preCalculatedMoveData.length > 2) {
            if (preCalculatedMoveData[2] === 'O-O') shortCastle = true;
            if (preCalculatedMoveData[2] === 'O-O-O') longCastle = true;
            if (preCalculatedMoveData[2] === 'enPassant') enPassant = true;
        } else {
            // Infer from coordinates for engine moves
            if (movingPiece.toUpperCase() === 'K' && Math.abs(toCol - fromCol) === 2) {
                if (toCol > fromCol) shortCastle = true;
                else longCastle = true;
            }
            // Infer en passant (pawn diagonal move to empty square)
            if (movingPiece.toUpperCase() === 'P' && fromCol !== toCol && this.board[toRow]?.[toCol] === null) {
                enPassant = true;
            }
        }

        // Clear enPassantTarget
        for (let i = 0; i < this.enPassantTarget.length; i++) {
            if (this.enPassantTarget[i][2] === this.turn) {
                this.enPassantTarget.splice(i, 1);
                i--;
            }
        }

        if (shortCastle) {
            this.addHistoryRecord(-1, -1, -1, -1, "O-O");
            if (this.board[toRow]) this.board[toRow][toCol] = movingPiece!;
            if (this.board[fromRow]) this.board[fromRow][fromCol] = null;
            if (this.board[toRow]) {
                this.board[toRow][5] = this.board[toRow][7];
                this.board[toRow][7] = null;
            }
        } else if (longCastle) {
            this.addHistoryRecord(-1, -1, -1, -1, "O-O-O");
            if (this.board[toRow]) this.board[toRow][toCol] = movingPiece!;
            if (this.board[fromRow]) this.board[fromRow][fromCol] = null;
            if (this.board[toRow]) {
                this.board[toRow][3] = this.board[toRow][0];
                this.board[toRow][0] = null;
            }
        } else if (enPassant) {
            if (this.board[toRow]) this.board[toRow][toCol] = movingPiece!;
            if (this.board[fromRow]) this.board[fromRow][fromCol] = null;
            let direction = (color(movingPiece) === 'White') ? 1 : -1;
            if (this.board[toRow + direction]) this.board[toRow + direction][toCol] = null;
            this.addHistoryRecord(fromRow, fromCol, toRow, toCol, movingPiece);
        } else {
            if (this.board[toRow]) this.board[toRow][toCol] = movingPiece!;
            if (this.board[fromRow]) this.board[fromRow][fromCol] = null;

            if (movingPiece.toUpperCase() === 'P') {
                const promotion = canPromote(this.board, color(movingPiece));
                if (promotion.canPromote) {
                    let choice = promotionChoice;
                    if (!choice) {
                        // If human player, ask for promotion
                        if (this.mode === 'PvP' || (this.mode === 'PvC' && this.turn === this.playerSide)) {
                            choice = await new Promise<string>((resolve) => {
                                this.promotionCallback = resolve;
                                this.emitUpdate({ row: toRow, col: toCol, color: this.turn });
                            });
                            this.promotionCallback = null;
                        } else {
                            choice = 'q'; // Computer always promotes to queen for now
                        }
                    }
                    if (this.board[toRow] && choice) {
                        this.board[toRow][toCol] = (this.turn === 'White') ? choice.toUpperCase() : choice.toLowerCase();
                    }
                    this.addHistoryRecord(fromRow, fromCol, toRow, toCol, movingPiece, choice || null);
                } else {
                    if (Math.abs(toRow - fromRow) === 2) {
                        this.enPassantTarget.push([toRow, toCol, color(movingPiece)]);
                    }
                    this.addHistoryRecord(fromRow, fromCol, toRow, toCol, movingPiece);
                }
            } else {
                this.addHistoryRecord(fromRow, fromCol, toRow, toCol, movingPiece);
            }
        }

        this.checkThreeFold();
        this.blackInCheck = inCheck(this.board, 'Black');
        this.whiteInCheck = inCheck(this.board, 'White');
        this.turn = (this.turn === 'White') ? 'Black' : 'White';
        this.updateStatus();
        
        const result = checkGameResult(this.board, this.turn, this.blackInCheck, this.whiteInCheck, this.castleRights);
        if (result === 'Checkmate') {
            this.addHistoryRecord(-1, -1, -1, -1, "Checkmate");
            this.isGameOver = true;
        } else if (result === 'Stalemate') {
            this.addHistoryRecord(-1, -1, -1, -1, "Stalemate");
            this.isGameOver = true;
        }

        this.emitUpdate();

        // Do not await the computer move here — schedule it asynchronously so
        // the UI can immediately update (clear selection/possible-move markers)
        // before the engine starts thinking. Adding a short timeout helps
        // ensure Vue has a chance to render the cleared markers.
        if (!this.isGameOver && this.mode === 'PvC' && this.turn !== this.playerSide) {
            setTimeout(() => { void this.computerMove(); }, 30);
        }
    }

    resolvePromotion(piece: string) {
        if (this.promotionCallback) {
            this.promotionCallback(piece);
        }
    }
    
    getValidMovesForSquare(row: number, col: number): any[] {
        const piece = this.board[row]?.[col];
        if (!piece) return [];
        
        let validMoveTo = [];
        if (piece.toUpperCase() === 'K') {
            validMoveTo = getValidKingMoves(row, col, piece, this.board, color(piece), this.castleRights);
            validMoveTo = avoidCheck(validMoveTo, this.board, color(piece), {row, col}, piece);
        } else {
            validMoveTo = getValidMoves_NoKing(row, col, piece, this.board, color(piece), this.enPassantTarget);
            validMoveTo = avoidCheck(validMoveTo, this.board, color(piece), {row, col}, piece);
        }
        return validMoveTo;
    }
}

export const gameCore = new GameCore();

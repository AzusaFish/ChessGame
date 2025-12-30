// src/utils/chess-rules.ts

// --- Helper Functions ---

export function color(piece: string): 'White' | 'Black' {
    if (piece === piece.toUpperCase()) return 'White';
    return 'Black';
}

export function _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sleep(ms: number): Promise<void> {
    await _sleep(ms);
}

export function getAlgebraicNotation(row: number, col: number): string {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rank = 8 - row;
    return `${files[col]}${rank}`;
}

// --- Core Logic ---

export function canCapture(row: number, col: number, board: (string | null)[][], who: 'White' | 'Black'): boolean {
    if (row < 0 || row > 7 || col < 0 || col > 7) return false;
    const rowArr = board[row];
    if (!rowArr) return false;
    const piece = rowArr[col];
    if (!piece) return false;
    const pieceColor = (piece === piece.toUpperCase()) ? 'White' : 'Black';
    return pieceColor !== who;
}

function rookLikeMoves(fromRow: number, fromCol: number, board: (string | null)[][], who: 'White' | 'Black', validMoveTo: any[]) {
    //Up
    for (let r = fromRow - 1; r >= 0; r--) {
        if (board[r]?.[fromCol] === null) {
            validMoveTo.push([r, fromCol]);
        }
        else {
            if (canCapture(r, fromCol, board, who)) {
                validMoveTo.push([r, fromCol]);
            }
            break;
        }
    }
    //Down
    for (let r = fromRow + 1; r <= 7; r++) {
        if (board[r]?.[fromCol] === null) {
            validMoveTo.push([r, fromCol]);
        }
        else {
            if (canCapture(r, fromCol, board, who)) {
                validMoveTo.push([r, fromCol]);
            }
            break;
        }
    }
    //Left
    for (let c = fromCol - 1; c >= 0; c--) {
        if (board[fromRow]?.[c] === null) {
            validMoveTo.push([fromRow, c]);
        }
        else {
            if (canCapture(fromRow, c, board, who)) {
                validMoveTo.push([fromRow, c]);
            }
            break;
        }
    }
    //Right
    for (let c = fromCol + 1; c <= 7; c++) {
        if (board[fromRow]?.[c] === null) {
            validMoveTo.push([fromRow, c]);
        }
        else {
            if (canCapture(fromRow, c, board, who)) {
                validMoveTo.push([fromRow, c]);
            }
            break;
        }
    }
    return;
}

function bishopLikeMoves(fromRow: number, fromCol: number, board: (string | null)[][], who: 'White' | 'Black', validMoveTo: any[]) {
    //Top-Left
    for (let r = fromRow - 1, c = fromCol - 1; r >= 0 && c >= 0; r--, c--) {
        if (board[r]?.[c] === null) {
            validMoveTo.push([r, c]);
        }
        else {
            if (canCapture(r, c, board, who)) {
                validMoveTo.push([r, c]);
            }
            break;
        }
    }
    //Top-Right
    for (let r = fromRow - 1, c = fromCol + 1; r >= 0 && c <= 7; r--, c++) {
        if (board[r]?.[c] === null) {
            validMoveTo.push([r, c]);
        }
        else {
            if (canCapture(r, c, board, who)) {
                validMoveTo.push([r, c]);
            }
            break;
        }
    }
    //Bottom-Left
    for (let r = fromRow + 1, c = fromCol - 1; r <= 7 && c >= 0; r++, c--) {
        if (board[r]?.[c] === null) {
            validMoveTo.push([r, c]);
        }
        else {
            if (canCapture(r, c, board, who)) {
                validMoveTo.push([r, c]);
            }
            break;
        }
    }
    //Bottom-Right
    for (let r = fromRow + 1, c = fromCol + 1; r <= 7 && c <= 7; r++, c++) {
        if (board[r]?.[c] === null) {
            validMoveTo.push([r, c]);
        }
        else {
            if (canCapture(r, c, board, who)) {
                validMoveTo.push([r, c]);
            }
            break;
        }
    }
}

export function getValidMoves_NoKing(Row: number, Col: number, piece: string, board: (string | null)[][], who: 'White' | 'Black', enPassantTarget: any[] = []): any[] {
    let validMoveTo: any[] = [];
    switch (piece.toUpperCase()) {
        case 'P':
            {
                let direction = (who === 'White') ? -1 : 1;
                if (canCapture(Row + direction, Col - 1, board, who)) {
                    validMoveTo.push([Row + direction, Col - 1]);
                }
                if (canCapture(Row + direction, Col + 1, board, who)) {
                    validMoveTo.push([Row + direction, Col + 1]);
                }
                // En Passant
                if (enPassantTarget.length > 0) {
                    for (let i = 0; i < enPassantTarget.length; i++) {
                        if (Math.abs(enPassantTarget[i][1] - Col) === 1 && enPassantTarget[i][0] === Row && enPassantTarget[i][2] !== who) {
                            validMoveTo.push([Row + direction, enPassantTarget[i][1], 'enPassant']);
                        }
                    }
                }
                if (board[Row + direction]?.[Col] === null) {
                    validMoveTo.push([Row + direction, Col]);
                    if ((who === 'White' && Row === 6) || (who === 'Black' && Row === 1)) {
                        if (board[Row + 2 * direction]?.[Col] === null) {
                            validMoveTo.push([Row + 2 * direction, Col]);
                        }
                    }
                }
                return validMoveTo;
            }
        case 'R':
            {
                rookLikeMoves(Row, Col, board, who, validMoveTo);
                return validMoveTo;
            }
        case 'N':
            {
                const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
                for (const move of knightMoves) {
                    const newRow = Row + move[0]!;
                    const newCol = Col + move[1]!;
                    if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
                        if (board[newRow]?.[newCol] === null || canCapture(newRow, newCol, board, who)) {
                            validMoveTo.push([newRow, newCol]);
                        }
                    }
                }
                return validMoveTo;
            }
        case 'B':
            {
                bishopLikeMoves(Row, Col, board, who, validMoveTo);
                return validMoveTo;
            }
        case 'Q':
            {
                rookLikeMoves(Row, Col, board, who, validMoveTo);
                bishopLikeMoves(Row, Col, board, who, validMoveTo);
                return validMoveTo;
            }
    }
    return validMoveTo;
}

export function isSquareAttacked(board: (string | null)[][], who: 'White' | 'Black', row: number, col: number): boolean {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r]?.[c];

            if (piece && color(piece) === who) {
                let validMoves: any[] = [];
                if (piece.toUpperCase() === 'K') {
                    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
                    for (const dir of directions) {
                        const nr = r + dir[0]!;
                        const nc = c + dir[1]!;
                        if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
                            validMoves.push([nr, nc]);
                        }
                    }
                }
                else {
                    if (piece.toUpperCase() !== 'P') {
                        let _validMoves = getValidMoves_NoKing(r, c, piece, board, who);
                        for (const move of _validMoves) {
                            validMoves.push(move);
                        }
                    }
                    else {
                        let direction = (who === 'White') ? -1 : 1;
                        if (c - 1 >= 0) {
                            validMoves.push([r + direction, c - 1]);
                        }
                        if (c + 1 <= 7) {
                            validMoves.push([r + direction, c + 1]);
                        }
                    }
                }
                for (const move of validMoves) {
                    if (move[0] === row && move[1] === col) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

export function getValidKingMoves(row: number, col: number, piece: string, board: (string | null)[][], who: 'White' | 'Black', castleRights: any): any[] {
    const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];
    const validMoves: any[] = [];

    // Determine the opponent's color
    const opponent = (who === 'White') ? 'Black' : 'White';

    for (const dir of directions) {
        const newRow = row + dir[0]!;
        const newCol = col + dir[1]!;
        if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
            // Check if the square is empty or has an opponent piece (capture)
            // AND check if the square is NOT attacked by the opponent
            if ((board[newRow]?.[newCol] === null || canCapture(newRow, newCol, board, who)) && !isSquareAttacked(board, opponent, newRow, newCol)) {
                validMoves.push([newRow, newCol]);
            }
        }
    }
    //O-O castling
    if (who === 'White' && castleRights['wK']) {
        if (board[7]?.[5] === null && board[7]?.[6] === null) {
            if (!isSquareAttacked(board, opponent, 7, 5) && !isSquareAttacked(board, opponent, 7, 6) && !isSquareAttacked(board, opponent, 7, 4)) {
                validMoves.push([7, 6, "O-O"]);
            }
        }
    }
    if (who === 'Black' && castleRights['bK']) {
        if (board[0]?.[5] === null && board[0]?.[6] === null) {
            if (!isSquareAttacked(board, opponent, 0, 5) && !isSquareAttacked(board, opponent, 0, 6) && !isSquareAttacked(board, opponent, 0, 4)) {
                validMoves.push([0, 6, "O-O"]);
            }
        }
    }
    //O-O-O castling
    if (who === 'White' && castleRights['wQ']) {
        if (board[7]?.[1] === null && board[7]?.[2] === null && board[7]?.[3] === null) {
            if (!isSquareAttacked(board, opponent, 7, 2) && !isSquareAttacked(board, opponent, 7, 3) && !isSquareAttacked(board, opponent, 7, 4)) {
                validMoves.push([7, 2, "O-O-O"]);
            }
        }
    }
    if (who === 'Black' && castleRights['bQ']) {
        if (board[0]?.[1] === null && board[0]?.[2] === null && board[0]?.[3] === null) {
            if (!isSquareAttacked(board, opponent, 0, 2) && !isSquareAttacked(board, opponent, 0, 3) && !isSquareAttacked(board, opponent, 0, 4)) {
                validMoves.push([0, 2, "O-O-O"]);
            }
        }
    }
    return validMoves;
}

export function getKingPosition(Board: (string | null)[][], who: 'White' | 'Black'): number[] | null {
    let kingPos: number[] | null = null;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = Board[r]?.[c];
            if (piece && color(piece) === who && piece.toUpperCase() === 'K') {
                kingPos = [r, c];
                break;
            }
        }
        if (kingPos) break;
    }
    return kingPos;
}

export function inCheck(board: (string | null)[][], who: 'White' | 'Black'): boolean {
    const opponent = (who === 'White') ? 'Black' : 'White';
    const kingPos = getKingPosition(board, who);

    if (kingPos) {
        return isSquareAttacked(board, opponent, kingPos[0] as number, kingPos[1] as number);
    }
    return false;
}

export function avoidCheck(validMoveTo: any[], Board: (string | null)[][], who: 'White' | 'Black', selectedSquare: { row: number, col: number }, movingPiece: string): any[] {
    let finalMoves: any[] = [];

    for (const move of validMoveTo) {
        let isSafe = true;

        let tempBoard = JSON.parse(JSON.stringify(Board));
        if (tempBoard[move[0]]) {
             tempBoard[move[0]][move[1]] = movingPiece;
        }
        if (tempBoard[selectedSquare.row]) {
             tempBoard[selectedSquare.row][selectedSquare.col] = null;
        }

        if (move.length > 2 && move[2] === 'enPassant') {
            if (tempBoard[selectedSquare.row]) {
                tempBoard[selectedSquare.row][move[1]] = null;
            }
        }

        if (inCheck(tempBoard, who)) {
            isSafe = false;
        }

        if (isSafe) {
            finalMoves.push(move);
        }
    }
    return finalMoves;
}

export function checkGameResult(board: (string | null)[][], turn: 'White' | 'Black', blackInCheck: boolean, whiteInCheck: boolean, castleRights: any): 'Checkmate' | 'Stalemate' | 'Ongoing' {
    let hasValidMove = false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r]?.[c];
            if (piece && color(piece) === turn) {
                let validMoves: any[] = [];
                if (piece.toUpperCase() === 'K') {
                    validMoves = getValidKingMoves(r, c, piece, board, turn, castleRights || {});
                }
                else {
                    validMoves = getValidMoves_NoKing(r, c, piece, board, turn);
                }
                const tempSelectedSquare = { row: r, col: c };
                validMoves = avoidCheck(validMoves, board, turn, tempSelectedSquare, piece);
                if (validMoves.length > 0) {
                    hasValidMove = true;
                    break;
                }
            }
        }
        if (hasValidMove) break;
    }
    if (!hasValidMove) {
        if ((turn === 'White' && whiteInCheck) || (turn === 'Black' && blackInCheck)) {
            return 'Checkmate';
        }
        else {
            return 'Stalemate';
        }
    }
    return 'Ongoing';
}

export function canPromote(board: (string | null)[][], who: 'White' | 'Black'): { canPromote: boolean, row?: number, col?: number, color?: 'White' | 'Black' } {
    for (let col = 0; col < 8; col++) {
        if (who === 'White') {
            if (board[0]?.[col] && board[0][col] === 'P') {
                return { canPromote: true, row: 0, col: col, color: 'White' };
            }
        }
        else {
            if (board[7]?.[col] && board[7][col] === 'p') {
                return { canPromote: true, row: 7, col: col, color: 'Black' };
            }
        }
    }
    return { canPromote: false };
}

export function checkThreeRepeated(FENrecord: Map<string, number>): boolean {
    for (const [k, v] of FENrecord.entries()) {
        if (v >= 3) {
            return true;
        }
    }
    return false;
}

export function createFEN(board: (string | null)[][], who: 'White' | 'Black', castleRights: any, enPassantTarget: any[], halfRound: number, round: number): string {
    let fen = '';
    let emptyCnt = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r]?.[c];
            if (!piece) {
                emptyCnt++;
            }
            else {
                if (emptyCnt != 0) {
                    fen += emptyCnt.toString();
                    emptyCnt = 0;
                }
                fen += piece;
            }
        }
        if (emptyCnt != 0) {
            fen += emptyCnt.toString();
            emptyCnt = 0;
        }
        fen += '/';
    }
    fen = fen.slice(0, -1);
    fen += ' ';
    fen += (who === 'White') ? 'w ' : 'b ';

    let castlingStr = '';
    if (castleRights['wK']) castlingStr += 'K';
    if (castleRights['wQ']) castlingStr += 'Q';
    if (castleRights['bK']) castlingStr += 'k';
    if (castleRights['bQ']) castlingStr += 'q';
    if (castlingStr === '') castlingStr = '-';
    fen += castlingStr + ' ';

    let enPassantStr = '-';
    if (enPassantTarget.length > 0) {
        const target = enPassantTarget[enPassantTarget.length - 1];

        const destRow = target[0];
        const destCol = target[1];
        const pawnColor = target[2];

        let epRowIndex = 0;
        if (pawnColor === 'White') {
            epRowIndex = destRow + 1;
        }
        else {
            epRowIndex = destRow - 1;
        }

        const fileStr = String.fromCharCode('a'.charCodeAt(0) + destCol);
        const rankStr = (8 - epRowIndex).toString();
        enPassantStr = fileStr + rankStr;
    }
    fen += enPassantStr + ' ';
    fen += halfRound.toString() + ' ' + round.toString();

    return fen;
}

export function createFENForRecords(board: (string | null)[][], who: 'White' | 'Black', castleRights: any, enPassantTarget: any[], halfRound: number, round: number): string {
    return createFEN(board, who, castleRights, enPassantTarget, halfRound, round);
}

export function UCItoMove(bestMove: string | null): { from: { row: number, col: number }, to: { row: number, col: number }, promotion: string | null } | null {
    if (!bestMove || bestMove === '(none)') {
        return null;
    }
    bestMove = bestMove.trim();
    if (bestMove.length < 4) return null;
    
    const fromCol = bestMove.charCodeAt(0) - 'a'.charCodeAt(0);
    const fromRow = 8 - parseInt(bestMove[1] as string);
    const toCol = bestMove.charCodeAt(2) - 'a'.charCodeAt(0);
    const toRow = 8 - parseInt(bestMove[3] as string);

    let promotion: string | null = null;
    if (bestMove.length > 4) {
        promotion = bestMove[4] as string | null;
    }
    return { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol }, promotion: promotion };
}

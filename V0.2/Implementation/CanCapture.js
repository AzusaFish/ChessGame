function canCapture(row,col,board,who)
{
    if(row<0||row>7||col<0||col>7) return false;
    const piece=board[row][col];
    if(piece===null) return false;
    const pieceColor=(piece===piece.toUpperCase())?'White':'Black';
    return pieceColor!==who;
}

module.exports={canCapture};
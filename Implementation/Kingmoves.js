const canCapture=require('./CanCapture.js').canCapture;
const isSquareAttacked=require('./IsSquareAttacked.js').isSquareAttacked;

function getValidKingMoves(row,col,piece,board,who)
{
    const directions=[
        [-1,0], [1,0], [0,-1], [0,1],
        [-1,-1], [-1,1], [1,-1], [1,1]
    ];
    const validMoves=[];
    for(const dir of directions)
    {
        const newRow=row+dir[0];
        const newCol=col+dir[1];
        if(newRow>=0&&newRow<=7&&newCol>=0&&newCol<=7)
        {
            if((board[newRow][newCol]===null||canCapture(newRow,newCol,board,who))&&!isSquareAttacked(board,who,newRow,newCol))
            {
                validMoves.push([newRow,newCol]);
            }
        }
    }
    return validMoves;
}

module.exports={getValidKingMoves};
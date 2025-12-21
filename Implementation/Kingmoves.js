const canCapture=require('./CanCapture.js').canCapture;
const isSquareAttacked=require('./IsSquareAttacked.js').isSquareAttacked;

function getValidKingMoves(row,col,piece,board,who,castleRights)
{
    const directions=[
        [-1,0], [1,0], [0,-1], [0,1],
        [-1,-1], [-1,1], [1,-1], [1,1]
    ];
    const validMoves=[];
    
    // Determine the opponent's color
    const opponent = (who === 'White') ? 'Black' : 'White';

    for(const dir of directions)
    {
        const newRow=row+dir[0];
        const newCol=col+dir[1];
        if(newRow>=0&&newRow<=7&&newCol>=0&&newCol<=7)
        {
            // Check if the square is empty or has an opponent piece (capture)
            // AND check if the square is NOT attacked by the opponent
            if((board[newRow][newCol]===null||canCapture(newRow,newCol,board,who))&&!isSquareAttacked(board,opponent,newRow,newCol))
            {
                validMoves.push([newRow,newCol]);
            }
        }
    }
    //O-O castling
    if(who==='White'&&castleRights['wK'])
    {
        if(board[7][5]===null&&board[7][6]===null)
        {
            if(!isSquareAttacked(board,opponent,7,5)&&!isSquareAttacked(board,opponent,7,6)&&!isSquareAttacked(board,opponent,7,4))
            {
                validMoves.push([7,6,"O-O"]);
            }
        }
    }
    if(who==='Black'&&castleRights['bK'])
    {
        if(board[0][5]===null&&board[0][6]===null)
        {
            if(!isSquareAttacked(board,opponent,0,5)&&!isSquareAttacked(board,opponent,0,6)&&!isSquareAttacked(board,opponent,0,4))
            {
                validMoves.push([0,6,"O-O"]);
            }
        }
    }
    //O-O-O castling
    if(who==='White'&&castleRights['wQ'])
    {
        if(board[7][1]===null&&board[7][2]===null&&board[7][3]===null)
        {
            if(!isSquareAttacked(board,opponent,7,2)&&!isSquareAttacked(board,opponent,7,3)&&!isSquareAttacked(board,opponent,7,4))
            {
                validMoves.push([7,2,"O-O-O"]);
            }
        }
    }
    if(who==='Black'&&castleRights['bQ'])
    {
        if(board[0][1]===null&&board[0][2]===null&&board[0][3]===null)
        {
            if(!isSquareAttacked(board,opponent,0,2)&&!isSquareAttacked(board,opponent,0,3)&&!isSquareAttacked(board,opponent,0,4))
            {
                validMoves.push([0,2,"O-O-O"]);
            }
        }
    }
    return validMoves;
}

module.exports={getValidKingMoves};
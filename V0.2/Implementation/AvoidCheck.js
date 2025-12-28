const inCheck=require('./InCheck.js').inCheck;

function avoidCheck(validMoveTo,Board,who,selectedSquare,movingPiece)
{
    let finalMoves=[];
    
    for(const move of validMoveTo)
    {
        let isSafe=true;
        
        let tempBoard=JSON.parse(JSON.stringify(Board));
        tempBoard[move[0]][move[1]]=movingPiece;
        tempBoard[selectedSquare.row][selectedSquare.col]=null;

        if (move.length>2&&move[2]==='enPassant') 
        {
            tempBoard[selectedSquare.row][move[1]] = null;
        }
        
        if(inCheck(tempBoard,who))
        {
            isSafe=false;
        }
        
        if(isSafe)
        {
            finalMoves.push(move);
        }
    }
    return finalMoves;
}

module.exports={avoidCheck};

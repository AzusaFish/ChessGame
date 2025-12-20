const {canCapture}=require('./CanCapture.js');

let validMoveTo=[];

function rookLikeMoves(fromRow,fromCol,board,who)
{
    //Up
    for(let r=fromRow-1;r>=0;r--)
    {
        if(board[r][fromCol]===null)
        {
            validMoveTo.push([r,fromCol]);
        }
        else
        {
            if(canCapture(r,fromCol,board,who))
            {
                validMoveTo.push([r,fromCol]);
            }
            break;
        }
    }
    //Down
    for(let r=fromRow+1;r<=7;r++)
    {
        if(board[r][fromCol]===null)
        {
            validMoveTo.push([r,fromCol]);
        }
        else
        {
            if(canCapture(r,fromCol,board,who))
            {
                validMoveTo.push([r,fromCol]);
            }
            break;
        }
    }
    //Left
    for(let c=fromCol-1;c>=0;c--)
    {
        if(board[fromRow][c]===null)
        {
            validMoveTo.push([fromRow,c]);
        }
        else
        {
            if(canCapture(fromRow,c,board,who))
            {
                validMoveTo.push([fromRow,c]);
            }
            break;
        }
    }
    //Right
    for(let c=fromCol+1;c<=7;c++)
    {
        if(board[fromRow][c]===null)
        {
            validMoveTo.push([fromRow,c]);
        }
        else
        {
            if(canCapture(fromRow,c,board,who))
            {
                validMoveTo.push([fromRow,c]);
            }
            break;
        }       
    }
    return;
}

function bishopLikeMoves(fromRow,fromCol,board,who)
{
    //Top-Left
    for(let r=fromRow-1,c=fromCol-1;r>=0&&c>=0;r--,c--)
    {
        if(board[r][c]===null)
        {       
            validMoveTo.push([r,c]);
        }
        else
        {
            if(canCapture(r,c,board,who))
            {
                validMoveTo.push([r,c]);
            }
            break;
        }
    }
    //Top-Right
    for(let r=fromRow-1,c=fromCol+1;r>=0&&c<=7;r--,c++)
    {
        if(board[r][c]===null)      
        {
            validMoveTo.push([r,c]);
        }
        else
        {   
            if(canCapture(r,c,board,who))
            {
                validMoveTo.push([r,c]);
            }   
            break;
        }
    }
    //Bottom-Left
    for(let r=fromRow+1,c=fromCol-1;r<=7&&c>=0;r++,c--)
    {
        if(board[r][c]===null)
        {
            validMoveTo.push([r,c]);
        }
        else
        {
            if(canCapture(r,c,board,who))
            {
                validMoveTo.push([r,c]);
            }
            break;
        }
    }
    //Bottom-Right
    for(let r=fromRow+1,c=fromCol+1;r<=7&&c<=7;r++,c++)
    {
        if(board[r][c]===null)
        {
            validMoveTo.push([r,c]);
        }
        else
        {
            if(canCapture(r,c,board,who))
            {
                validMoveTo.push([r,c]);
            }
            break;
        }
    }
}

function getValidMoves_NoKing(Row,Col,piece,board,who)
{
    validMoveTo=[];
    switch (piece.toUpperCase())
    {
        case 'P':
            {
                let direction=(who==='White')?-1:1;
                if(canCapture(Row+direction,Col-1,board,who))
                {
                    validMoveTo.push([Row+direction,Col-1]);
                }
                if(canCapture(Row+direction,Col+1,board,who))
                {
                    validMoveTo.push([Row+direction,Col+1]);
                }
                if(board[Row+direction][Col]===null)
                {
                    validMoveTo.push([Row+direction,Col]);
                    if((who==='White'&&Row===6)||(who==='Black'&&Row===1))
                    {
                        if(board[Row+2*direction][Col]===null)
                        {
                            validMoveTo.push([Row+2*direction,Col]);
                        }
                    }
                }
                return validMoveTo;
            }
        case 'R':
            {
                rookLikeMoves(Row,Col,board,who);
                return validMoveTo;
            }
        case 'N':
            {
                const knightMoves=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
                for(const move of knightMoves)
                {
                    const newRow=Row+move[0];
                    const newCol=Col+move[1];
                    if(newRow>=0&&newRow<=7&&newCol>=0&&newCol<=7)
                    {
                        if(board[newRow][newCol]===null||canCapture(newRow,newCol,board,who))
                        {
                            validMoveTo.push([newRow,newCol]);
                        }
                    }
                }
                return validMoveTo; 
            }
        case 'B':
            {
                bishopLikeMoves(Row,Col,board,who);
                return validMoveTo;
            }
        case 'Q':
            {
                rookLikeMoves(Row,Col,board,who);
                bishopLikeMoves(Row,Col,board,who);
                return validMoveTo;
            }
    }
}

module.exports={getValidMoves_NoKing};
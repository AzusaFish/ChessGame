const color=require('./Color.js').color;

function isSquareAttacked(board,who,row,col)
{
    const opponent=(who==='White')?'Black':'White';
    for(let r=0;r<8;r++)
    {
        for(let c=0;c<8;c++)
        {
            const piece=board[r][c];
            if(piece&&color(piece)===opponent)
            {
                let validMoves=[];
                if(piece.toUpperCase()==='K') 
                {
                    const directions=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
                    for(const dir of directions) 
                    {
                        const nr=r+dir[0];
                        const nc=c+dir[1];
                        if(nr>=0&&nr<=7&&nc>=0&&nc<=7) 
                        {
                            validMoves.push([nr, nc]);
                        }
                    }
                }
                else 
                {
                    if(piece.toUpperCase()!=='P')
                    {
                        const getValidMoves_NoKing=require('./GetValidMoves.js').getValidMoves_NoKing;
                        let _validMoves=getValidMoves_NoKing(r,c,piece,board,opponent);
                        for(const move of _validMoves)
                        {
                            validMoves.push(move);
                        }
                    }
                    else
                    {
                        let direction=(opponent==='White')?-1:1;
                        if(c-1>=0)
                        {
                            validMoves.push([r+direction,c-1]);
                        }
                        if(c+1<=7)
                        {
                            validMoves.push([r+direction,c+1]);
                        }
                    }
                }
                for(const move of validMoves)
                {
                    if(move[0]===row&&move[1]===col)
                    {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

module.exports={isSquareAttacked};
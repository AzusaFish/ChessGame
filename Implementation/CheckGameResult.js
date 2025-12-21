const { avoidCheck } = require('./AvoidCheck.js');

const getValidMoves=require('./GetValidMoves.js').getValidMoves_NoKing;
const getValidKingMoves=require('./Kingmoves.js').getValidKingMoves;
const color=require('./Color.js').color;

function checkGameResult(board,turn,blackInCheck,whiteInCheck,castleRights)
{
    let hasValidMove=false;
    for(let r=0;r<8;r++)
    {
        for(let c=0;c<8;c++)
        {
            const piece=board[r][c];
            if(piece&&color(piece)===turn)
            {
                let validMoves=[];
                if(piece.toUpperCase()==='K')
                {
                    validMoves=getValidKingMoves(r,c,piece,board,turn,castleRights||{});
                }
                else
                {
                    validMoves=getValidMoves(r,c,piece,board,turn);
                }
                const tempSelectedSquare={row:r,col:c};
                validMoves=avoidCheck(validMoves,board,turn,tempSelectedSquare,piece);
                if(validMoves.length>0)
                {
                    hasValidMove=true;
                    break;
                }
            }
        }   
        if(hasValidMove) break;
    }
    if(!hasValidMove)
    {
        if((turn==='White'&&whiteInCheck)||(turn==='Black'&&blackInCheck))
        {
            return 'Checkmate';
        }
        else
        {
            return 'Stalemate';
        }
    }
    return 'Ongoing';
}

module.exports={checkGameResult};
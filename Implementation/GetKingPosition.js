const color=require('./Color.js').color;

function getKingPosition(Board,who)
{
    let kingPos=null;
    for(let r=0;r<8;r++)
    {
        for(let c=0;c<8;c++)
        {
            const piece=Board[r][c];
            if(piece&&color(piece)===who&&piece.toUpperCase()==='K')
            {
                kingPos=[r,c];
                break;
            }
        }
        if(kingPos) break;
    }
    return kingPos;
}

module.exports={getKingPosition};
const color=require('./Color.js').color;
const isSquareAttacked=require('./IsSquareAttacked.js').isSquareAttacked;   
const getKingPosition=require('./GetKingPosition.js').getKingPosition;

function inCheck(board,who)
{
    const opponent=(who==='White')?'Black':'White';
    const kingPos=getKingPosition(board,who);

    if(kingPos)
    {
        return isSquareAttacked(board,opponent,kingPos[0],kingPos[1]);
    }
}

module.exports={inCheck};
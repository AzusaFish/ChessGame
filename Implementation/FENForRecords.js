function createFENForRecords(board,who,castleRights,enPassantTarget,halfRound,round)
{
    let fen='';
    let emptyCnt=0;
    for(let r=0;r<8;r++)
    {
        for(let c=0;c<8;c++)
        {
            const piece=board[r][c];
            if(!piece)
            {
                emptyCnt++;
            }
            else
            {
                if(emptyCnt!=0)
                {
                    fen+=emptyCnt.toString();
                    emptyCnt=0;
                }
                fen+=piece;
            }
        }
        if(emptyCnt!=0)
        {
            fen+=emptyCnt.toString();
            emptyCnt=0;
        }
        fen+='/';
    }
    fen=fen.slice(0,-1);
    fen+=' ';
    fen+=(who==='White')?'w ':'b ';

    let castlingStr='';
    if(castleRights['wK']) castlingStr+='K';
    if(castleRights['wQ']) castlingStr+='Q';
    if(castleRights['bK']) castlingStr+='k';
    if(castleRights['bQ']) castlingStr+='q';
    if(castlingStr==='') castlingStr='-';
    fen+=castlingStr+' ';

    let enPassantStr='-';
    if(enPassantTarget.length>0)
    {
        const target=enPassantTarget[enPassantTarget.length-1];

        const destRow=target[0];
        const destCol=target[1];
        const pawnColor=target[2];
        
        let epRowIndex='';
        if(pawnColor==='White')
        {
            epRowIndex=destRow+1;
        }
        else
        {
            epRowIndex=destRow-1;
        }
        
        const fileStr=String.fromCharCode('a'.charCodeAt(0)+destCol);
        const rankStr=(8-epRowIndex).toString();
        enPassantStr=fileStr+rankStr;
    }
    fen+=enPassantStr+' ';
    fen+=halfRound.toString()+' '+round.toString();

    return fen;
}

module.exports={createFENForRecords};

function canPromote(board,who)
{
    for(let col=0;col<8;col++)
    {
        if(who==='White')
        {
            if(board[0][col]&&board[0][col]==='P')
            {
                return {canPromote:true,row:0,col:col,color:'White'};
            }
        }
        else
        {
            if(board[7][col]&&board[7][col]==='p')
            {
                return {canPromote:true,row:7,col:col,color:'Black'};
            }
        }
    }
    return {canPromote:false};
}

module.exports={canPromote};
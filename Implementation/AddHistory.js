function getAlgebraicNotation(row, col) 
{
    const files=['a','b','c','d','e','f','g','h'];
    const rank=8-row;
    return `${files[col]}${rank}`;
}

function addMoveToHistory(fromRow, fromCol, toRow, toCol, piece, promoteChoice = null) 
{
    if(piece==="O-O"||piece==="O-O-O")
    {
        const li=document.createElement('li');
        li.textContent=`${history.length}. ${piece}`;
        movesList.appendChild(li);
        return;
    }
    if(piece==="Checkmate")
    {
        const li=document.createElement('li');
        li.textContent=`${history.length}. Checkmate - Game Over`;
        movesList.appendChild(li);
        return;
    }
    if(piece==="Stalemate")
    {
        const li=document.createElement('li');
        li.textContent=`${history.length}. Stalemate - Game Over`;
        movesList.appendChild(li);
        return;
    }
    const from=getAlgebraicNotation(fromRow, fromCol);
    const to=getAlgebraicNotation(toRow, toCol);
    const pieceSymbol=piece.toUpperCase()==='P'?'':piece.toUpperCase(); // Pawn usually omitted
    const moveText=promoteChoice ? `${pieceSymbol} ${from}->${to}=${promoteChoice.toUpperCase()}` : `${pieceSymbol} ${from}->${to}`;
    
    const li=document.createElement('li');
    li.textContent=`${history.length}. ${moveText}`;
    movesList.appendChild(li);
    
    // Auto-scroll to bottom
    const historyContainer=document.getElementById('move-history');
    historyContainer.scrollTop=historyContainer.scrollHeight;
}

module.exports={addMoveToHistory};
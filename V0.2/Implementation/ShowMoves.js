function showMoves(validMoveTo)
{
    for(const move of validMoveTo)
    {
        const row=move[0];;
        const col=move[1];
        const square=document.querySelector(`.square[data-row='${row}'][data-col='${col}']`);
        square.classList.add('possible-move');
    }
}

function clearMoves()
{
    const squares=document.querySelectorAll('.square.possible-move');
    squares.forEach(square => square.classList.remove('possible-move'));
}

module.exports={showMoves,clearMoves};
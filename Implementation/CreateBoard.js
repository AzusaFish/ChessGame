const boardElement=document.getElementById('chessboard');

function getImageName(piece)
{
    if(!piece) return null;
    const color=(piece===piece.toUpperCase())?'w':'b';
    const type=piece.toUpperCase();
    return `img/${color}${type}.svg`;
}

function createBoard(Board,onClickCallback,playerSide)
{
    if(playerSide===undefined) playerSide='White';
    boardElement.innerHTML='';
    if(playerSide==='White')
    {
        for(let row=0;row<8;row++)
        {
            for(let col=0;col<8;col++)
            {
                const square=document.createElement('div');
                square.classList.add('square');

                if((row+col)%2===0)
                {
                    square.classList.add('white');
                }
                else
                {
                    square.classList.add('black');
                }

                square.dataset.row=row;
                square.dataset.col=col;
                square.onclick=() => onClickCallback(row,col,square);

                const piece=Board[row][col];
                if(piece)
                {
                    const img=document.createElement('div');
                    img.classList.add('piece');
                    img.style.backgroundImage=`url(${getImageName(piece)})`;
                    square.appendChild(img);
                }

                boardElement.appendChild(square);
            }
        }
    }
    else
    {
        for(let row=7;row>=0;row--)
        {
            for(let col=7;col>=0;col--)
            {
                const square=document.createElement('div');
                square.classList.add('square');

                if((row+col)%2===0)
                {
                    square.classList.add('white');
                }
                else
                {
                    square.classList.add('black');
                }

                square.dataset.row=row;
                square.dataset.col=col;
                square.onclick=() => onClickCallback(row,col,square);

                const piece=Board[row][col];
                if(piece)
                {
                    const img=document.createElement('div');
                    img.classList.add('piece');
                    img.style.backgroundImage=`url(${getImageName(piece)})`;
                    square.appendChild(img);
                }

                boardElement.appendChild(square);
            }
        }        
    }
}

module.exports={createBoard};
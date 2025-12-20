const showMoves=require('./Implementation/ShowMoves.js').showMoves;
const clearMoves=require('./Implementation/ShowMoves.js').clearMoves;
const canCapture=require('./Implementation/CanCapture.js').canCapture;
const getValidMoves_NoKing=require('./Implementation/GetValidMoves.js').getValidMoves_NoKing;
const getValidKingMoves=require('./Implementation/Kingmoves.js').getValidKingMoves;
const color=require('./Implementation/Color.js').color;

let Board=
[
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R'] 
]

const{createBoard}=require('./Implementation/CreateBoard.js');

let turn="White";
let castleRights={wK:true,wQ:true,bK:true,bQ:true};
let history=[];

// UI Elements
const turnIndicator=document.getElementById('turn-indicator');
const movesList=document.getElementById('moves-list');
const restartBtn=document.getElementById('restart-btn');

function updateStatus() 
{
    turnIndicator.textContent=turn;
    //turnIndicator.style.color=turn==='White'?'#333':'#709edd'; // Optional color coding
    if(Board[0][0]!=='r') castleRights.bQ=false;
    if(Board[0][7]!=='r') castleRights.bK=false;
    if(Board[7][0]!=='R') castleRights.wQ=false;
    if(Board[7][7]!=='R') castleRights.wK=false;
    if(Board[0][4]!=='k')
    {
        castleRights.bK=false;
        castleRights.bQ=false;
    }
    if(Board[7][4]!=='K')
    {
        castleRights.wK=false;
        castleRights.wQ=false;
    }
}

function getAlgebraicNotation(row, col) 
{
    const files=['a','b','c','d','e','f','g','h'];
    const rank=8-row;
    return `${files[col]}${rank}`;
}

function addMoveToHistory(fromRow, fromCol, toRow, toCol, piece) 
{
    const from=getAlgebraicNotation(fromRow, fromCol);
    const to=getAlgebraicNotation(toRow, toCol);
    const pieceSymbol=piece.toUpperCase()==='P'?'':piece.toUpperCase(); // Pawn usually omitted
    const moveText=`${pieceSymbol} ${from}->${to}`;
    
    const li=document.createElement('li');
    li.textContent=`${history.length}. ${moveText}`;
    movesList.appendChild(li);
    
    // Auto-scroll to bottom
    const historyContainer=document.getElementById('move-history');
    historyContainer.scrollTop=historyContainer.scrollHeight;
}

function restartGame() 
{
    // Reset Board
    Board = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R'] 
    ];
    
    // Reset State
    turn = "White";
    castleRights = {wK:true,wQ:true,bK:true,bQ:true};
    history = [];
    selectedSquare = null;
    
    // Reset UI
    movesList.innerHTML = '';
    updateStatus();
    createBoard(Board, clickSquare);
}

restartBtn.addEventListener('click', restartGame);

let selectedSquare=null;

function clickSquare(row,col,squareElement)
{
    let validMoveTo=[];
    if(!selectedSquare)
    {
        const piece=Board[row][col];
        if(piece)
        {
            if(color(piece)!==turn) return;
            selectedSquare={row,col,element:squareElement};
            squareElement.classList.add('selected');
            if(piece.toUpperCase()==='K')
            {
                validMoveTo=getValidKingMoves(row,col,piece,Board,color(piece));
            }
            else
            {
                validMoveTo=getValidMoves_NoKing(row,col,piece,Board,color(piece));
            }
            showMoves(validMoveTo);
        }
        return;
    }

    if(selectedSquare.row===row&&selectedSquare.col===col)
    {
        clearMoves();
        selectedSquare.element.classList.remove('selected');
        selectedSquare=null;
        return;
    }

    const movingPiece=Board[selectedSquare.row][selectedSquare.col];
    if(movingPiece.toUpperCase()==='K')
    {
        validMoveTo=getValidKingMoves(selectedSquare.row,selectedSquare.col,movingPiece,Board,color(movingPiece));
        
    }
    else
    {
        validMoveTo=getValidMoves_NoKing(selectedSquare.row,selectedSquare.col,movingPiece,Board,color(movingPiece));
    }
    
    let isValid=false;
    for(const move of validMoveTo)
    {
        if(move[0]===row&&move[1]===col)
        {
            isValid=true;
            break;
        }
    }
    
    if(Board[row][col]!==null&&!canCapture(row,col,Board,color(movingPiece)))
    {
        isValid=false;
    }

    if(isValid)
    {
        addMoveToHistory(selectedSquare.row, selectedSquare.col, row, col, movingPiece);
        Board[row][col]=movingPiece;
        Board[selectedSquare.row][selectedSquare.col]=null;
        history.push({from:{row:selectedSquare.row,col:selectedSquare.col},to:{row,col},piece:movingPiece});
        turn=(turn==='White')?'Black':'White';
        updateStatus();

        createBoard(Board,clickSquare);
        selectedSquare=null;
        clearMoves();
    }
    else
    {
        clearMoves();
        selectedSquare.element.classList.remove('selected');
        selectedSquare=null;
        const piece=Board[row][col];
        if(piece) clickSquare(row,col,squareElement);
    }
}

createBoard(Board,clickSquare);

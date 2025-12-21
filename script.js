const showMoves=require('./Implementation/ShowMoves.js').showMoves;
const clearMoves=require('./Implementation/ShowMoves.js').clearMoves;
const canCapture=require('./Implementation/CanCapture.js').canCapture;
const getValidMoves_NoKing=require('./Implementation/GetValidMoves.js').getValidMoves_NoKing;
const getValidKingMoves=require('./Implementation/Kingmoves.js').getValidKingMoves;
const color=require('./Implementation/Color.js').color;
const addMoveToHistory=require('./Implementation/AddHistory.js').addMoveToHistory;
const inCheck=require('./Implementation/InCheck.js').inCheck;
const avoidCheck=require('./Implementation/AvoidCheck.js').avoidCheck;
const getKingPosition=require('./Implementation/GetKingPosition.js').getKingPosition;
const checkGameResult=require('./Implementation/CheckGameResult.js').checkGameResult;

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
let blackInCheck=false;
let whiteInCheck=false;
let isGameOver=false;

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

function restartGame() 
{
    Board=[
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R'] 
    ];
    
    turn="White";
    castleRights={wK:true,wQ:true,bK:true,bQ:true};
    history=[];
    selectedSquare=null;
    blackInCheck=false;
    whiteInCheck=false;
    isGameOver=false;
    
    movesList.innerHTML='';
    updateStatus();
    createBoard(Board,clickSquare);
    updateCheckVisuals();
}

restartBtn.addEventListener('click', restartGame);

let selectedSquare=null;

function clickSquare(row,col,squareElement)
{
    if(isGameOver) return;

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
                validMoveTo=getValidKingMoves(row,col,piece,Board,color(piece),castleRights); 
                validMoveTo=avoidCheck(validMoveTo,Board,color(piece),selectedSquare,piece);
            }
            else
            {
                validMoveTo=getValidMoves_NoKing(row,col,piece,Board,color(piece));
                validMoveTo=avoidCheck(validMoveTo,Board,color(piece),selectedSquare,piece);
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
        validMoveTo=getValidKingMoves(selectedSquare.row,selectedSquare.col,movingPiece,Board,color(movingPiece),castleRights);
        validMoveTo=avoidCheck(validMoveTo,Board,color(movingPiece),selectedSquare,movingPiece);
    }
    else
    {
        validMoveTo=getValidMoves_NoKing(selectedSquare.row,selectedSquare.col,movingPiece,Board,color(movingPiece));
        validMoveTo=avoidCheck(validMoveTo,Board,color(movingPiece),selectedSquare,movingPiece);
    }
    
    let isValid=false;
    let shortCastle=false;
    let longCastle=false;
    for(const move of validMoveTo)
    {
        if(move[0]===row&&move[1]===col)
        {
            isValid=true;
            if(move.length>2)
            {
                if(move[2]==='O-O') shortCastle=true;
                if(move[2]==='O-O-O') longCastle=true;
            }
            break;
        }
    }
    
    if(Board[row][col]!==null&&!canCapture(row,col,Board,color(movingPiece)))
    {
        isValid=false;
    }

    if(isValid)
    {
        if(shortCastle)
        {
            addMoveToHistory(-1,-1,-1,-1,"O-O");
            // Move king
            Board[row][col]=movingPiece;
            Board[selectedSquare.row][selectedSquare.col]=null;
            // Move rook
            Board[row][5]=Board[row][7];
            Board[row][7]=null;
            history.push({shortCastle:true});
        }
        else if(longCastle)
        {
            addMoveToHistory(-1,-1,-1,-1,"O-O-O");
            // Move king
            Board[row][col]=movingPiece;
            Board[selectedSquare.row][selectedSquare.col]=null;
            // Move rook
            Board[row][3]=Board[row][0];
            Board[row][0]=null;
            history.push({longCastle:true});
        }
        else
        {
            addMoveToHistory(selectedSquare.row, selectedSquare.col, row, col, movingPiece);
            Board[row][col]=movingPiece;
            Board[selectedSquare.row][selectedSquare.col]=null;
            history.push({from:{row:selectedSquare.row,col:selectedSquare.col},to:{row,col},piece:movingPiece});
        }
        blackInCheck=inCheck(Board,'Black');
        whiteInCheck=inCheck(Board,'White');

        turn=(turn==='White')?'Black':'White';
        updateStatus();

        createBoard(Board,clickSquare);
        updateCheckVisuals();
        selectedSquare=null;
        clearMoves();

        const result=checkGameResult(Board,turn,blackInCheck,whiteInCheck,castleRights);
        console.log(`Game result check: ${result}`);
        if(result==='Checkmate')
        {
            addMoveToHistory(-1,-1,-1,-1,"Checkmate");
            setTimeout(() => {
            alert(`Checkmate! ${turn==='White'?'Black':'White'} wins.`)},100);
            isGameOver=true;
        }
        if(result==='Stalemate')
        {
            addMoveToHistory(-1,-1,-1,-1,"Stalemate");
            setTimeout(() => {
            alert("Stalemate! Draw.")},100);
            isGameOver=true;
        }
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

function updateCheckVisuals()
{
    console.log("Running updateCheckVisuals...");
    blackInCheck=inCheck(Board,'Black');
    whiteInCheck=inCheck(Board,'White');
    console.log(`Check status - Black: ${blackInCheck}, White: ${whiteInCheck}`);

    // Remove existing check highlights
    document.querySelectorAll('.square.in-check').forEach(elem=>elem.classList.remove('in-check'));

    let kingPos;
    if(blackInCheck)
    {
        console.log("Black is in check!");
        kingPos=getKingPosition(Board,'Black');
    }
    else if(whiteInCheck)
    {
        console.log("White is in check!");
        kingPos=getKingPosition(Board,'White');
    }

    if(kingPos)
    {
        console.log(`King found at [${kingPos[0]}, ${kingPos[1]}]`);
        const selector = `[data-row='${kingPos[0]}'][data-col='${kingPos[1]}']`;
        const selectedSquareElement=document.querySelector(selector);
        if(selectedSquareElement) 
        {
            selectedSquareElement.classList.add('in-check');
            console.log(`Added .in-check to square [${kingPos[0]}, ${kingPos[1]}]`);
        }
        else
        {
            console.error(`Could not find square with selector: ${selector}`);
        }
    }
}

createBoard(Board,clickSquare);
updateCheckVisuals();

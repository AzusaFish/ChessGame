"use strict";

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
const canPromote=require('./Implementation/CanPromote.js').canPromote;
const selectPromotion=require('./Implementation/PromotionSelect.js').showPromotionModal;
const createFEN=require('./Implementation/CreateFEN.js').createFEN;
const getBestMove=require('./Implementation/Engine.js').getBestMove;
const UCItoMove=require('./Implementation/Engine.js').UCItoMove;
const sleep=require('./Implementation/Sleep.js').sleep;
const checkThreeRepeated=require('./Implementation/CheckThreeRepeated.js').checkThreeRepeated;
const createFENForRecords=require('./Implementation/FENForRecords.js').createFENForRecords;

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
let isPromoting=false;
let enPassantTarget=[];
let mode="PvC"; // Possible modes: PvP, PvC
let playerSide=Math.random()<0.5?"White":"Black"; // Possible sides: White, Black
let diff=1; // Difficulty level for computer

const FENrecords=new Map();

// UI Elements
const turnIndicator=document.getElementById('turn-indicator');
const movesList=document.getElementById('moves-list');
const restartBtn=document.getElementById('restart-btn');

function updateStatus() 
{
    turnIndicator.textContent=turn;

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

function checkThreeFold()
{
    const fen=createFENForRecords(Board,turn,castleRights,enPassantTarget,Math.floor(history.length/2)+1,history.length+1);
    FENrecords[fen]=(FENrecords[fen]||0)+1;
    if(checkThreeRepeated(FENrecords))
    {
        addMoveToHistory(-1,-1,-1,-1,"Threefold repetition");
        setTimeout(()=>{ alert("Draw by threefold repetition."); }, 100);
        isGameOver = true;
        return;        
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
    enPassantTarget=[];
    mode="PvC";
    //playerSide=Math.random()<0.5?"White":"Black";
    playerSide=Math.random()<0.5?"White":"Black";
    diff=1;
    FENrecords.clear();
    
    movesList.innerHTML='';
    updateStatus();
    createBoard(Board,clickSquare,playerSide);
    updateCheckVisuals();
    checkThreeFold();

    if(mode==="PvC" && turn!==playerSide)
    {
        computerMove();
    }
}

restartBtn.addEventListener('click', restartGame);

async function getBestMoveWithDifficulty(fen,difficulty)
{
    let thinkTime;
    switch (difficulty)
    {
        case 1:
            {
                thinkTime=Math.floor(Math.random()*2+1);
                break;
            }
        case 2:
            {
                thinkTime=Math.floor(Math.random()*5+10);
                break;
            }
        case 3:
            {
                thinkTime=Math.floor(Math.random()*15+15);
                break;
            }
        case 4:
            {
                thinkTime=Math.floor(Math.random()*30+30);
                break;
            }
        case 5:
            {
                thinkTime=Math.floor(Math.random()*50+150);
                break;
            }
        default:
            {
                thinkTime=Math.floor(Math.random()*80+400);
                break;
            }
    }
    const startTime=Date.now();
    const move=await getBestMove(fen,thinkTime);
    const elapsed=Date.now()-startTime;
    await sleep(Math.max(0,Math.floor((Math.random()/2+0.2)*1800)-elapsed));
    return move;
}

async function computerMove()
{
    const fen=createFEN(Board,turn,castleRights,enPassantTarget,Math.floor(history.length/2)+1,history.length+1);
    const bestMove=await getBestMoveWithDifficulty(fen,diff);
    console.log("Computer's best move (UCI): ",bestMove);

    if(!bestMove||bestMove==="null"||bestMove==="(none)")
    {
        console.log("No valid moves from computer.");
        return;
    }

    const move=UCItoMove(bestMove);
    if(move)
    {
        const fromRow=move.from.row;
        const fromCol=move.from.col;
        const toRow=move.to.row;
        const toCol=move.to.col;
        
        const squareElement=document.querySelector(`[data-row='${fromRow}'][data-col='${fromCol}']`);
        await clickSquare(fromRow,fromCol,squareElement,true);
        const targetElement=document.querySelector(`[data-row='${toRow}'][data-col='${toCol}']`);
        await clickSquare(toRow,toCol,targetElement,true);
    }

    const result=checkGameResult(Board,turn,blackInCheck,whiteInCheck,castleRights);
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

let selectedSquare=null;

async function clickSquare(row,col,squareElement,isComputer=false)
{ 
    if(turn!==playerSide&&!isComputer)
    {
        return;
    }
    if(isGameOver||isPromoting) return;

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
                validMoveTo=getValidMoves_NoKing(row,col,piece,Board,color(piece),enPassantTarget);
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

    if(!movingPiece)
    {
        selectedSquare=null;
        clearMoves();
        return;
    }

    if(movingPiece.toUpperCase()==='K')
    {
        validMoveTo=getValidKingMoves(selectedSquare.row,selectedSquare.col,movingPiece,Board,color(movingPiece),castleRights);
        validMoveTo=avoidCheck(validMoveTo,Board,color(movingPiece),selectedSquare,movingPiece);
    }
    else
    {
        validMoveTo=getValidMoves_NoKing(selectedSquare.row,selectedSquare.col,movingPiece,Board,color(movingPiece),enPassantTarget);
        validMoveTo=avoidCheck(validMoveTo,Board,color(movingPiece),selectedSquare,movingPiece);
    }
    
    let isValid=false;
    let shortCastle=false;
    let longCastle=false;
    let enPassant=false;

    //clear enPassantTarget after each move
    for(let i=0;i<enPassantTarget.length;i++)
    {
        if(enPassantTarget[i][2]===turn)
        {
            enPassantTarget.splice(i,1);
            i--;
        }
    }

    for(const move of validMoveTo)
    {
        if(move[0]===row&&move[1]===col)
        {
            isValid=true;
            if(move.length>2)
            {
                if(move[2]==='O-O') shortCastle=true;
                if(move[2]==='O-O-O') longCastle=true;
                if(move[2]==='enPassant') enPassant=true;
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
        else if(enPassant)
        {
            Board[row][col]=movingPiece;
            Board[selectedSquare.row][selectedSquare.col]=null;
            // Remove the captured pawn
            let direction=(color(movingPiece)==='White')?1:-1;
            Board[row+direction][col]=null;
            addMoveToHistory(selectedSquare.row,selectedSquare.col,row,col,movingPiece);
            history.push({from:{row:selectedSquare.row,col:selectedSquare.col},to:{row,col},piece:movingPiece});
        }
        else
        {         
            Board[row][col]=movingPiece;
            Board[selectedSquare.row][selectedSquare.col]=null;

            if(movingPiece.toUpperCase()==='P')
            {
                let promotion=canPromote(Board,color(movingPiece));
                if(promotion.canPromote)
                {
                    isPromoting=true;
                    const promoteChoice=await selectPromotion(promotion.color);
                    isPromoting=false;
                    Board[promotion.row][promotion.col]=promoteChoice;
                    history.push({from:{row:selectedSquare.row,col:selectedSquare.col},to:{row,col},piece:movingPiece,promoteChoice:promoteChoice});
                    addMoveToHistory(selectedSquare.row,selectedSquare.col,row,col,movingPiece,promoteChoice);
                }
                else
                {
                    if(Math.abs(row-selectedSquare.row)===2)
                    {
                        enPassantTarget.push([row,col,color(movingPiece)]);
                    }
                    addMoveToHistory(selectedSquare.row, selectedSquare.col, row, col, movingPiece);
                    history.push({from:{row:selectedSquare.row,col:selectedSquare.col},to:{row,col},piece:movingPiece});
                }
            }
            else
            {
                addMoveToHistory(selectedSquare.row,selectedSquare.col,row,col,movingPiece);
                history.push({from:{row:selectedSquare.row,col:selectedSquare.col},to:{row,col},piece:movingPiece});
            }
        }

        checkThreeFold();
        
        blackInCheck=inCheck(Board,'Black');
        whiteInCheck=inCheck(Board,'White');

        turn=(turn==='White')?'Black':'White';
        updateStatus();

        createBoard(Board,clickSquare,playerSide);
        updateCheckVisuals();
        selectedSquare=null;
        clearMoves();

        const result=checkGameResult(Board,turn,blackInCheck,whiteInCheck,castleRights);
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

        if(!isGameOver&&turn!==playerSide)
        {
            await computerMove();
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
    blackInCheck=inCheck(Board,'Black');
    whiteInCheck=inCheck(Board,'White');

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
        const selector = `[data-row='${kingPos[0]}'][data-col='${kingPos[1]}']`;
        const selectedSquareElement=document.querySelector(selector);
        if(selectedSquareElement) 
        {
            selectedSquareElement.classList.add('in-check');
        }
    }
}

playerSide=Math.random()<0.5?"White":"Black";
createBoard(Board,clickSquare,playerSide);
updateCheckVisuals();
checkThreeFold();

if(mode==="PvC" && turn!==playerSide)
{
    computerMove();
}

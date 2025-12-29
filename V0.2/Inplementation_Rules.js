const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// --- Helper Functions ---

function color(piece)
{
    if(piece===piece.toUpperCase()) return 'White';
    return 'Black';
}

function _sleep(ms) 
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sleep(ms)
{
    await _sleep(ms);
}

function getAlgebraicNotation(row, col) 
{
    const files=['a','b','c','d','e','f','g','h'];
    const rank=8-row;
    return `${files[col]}${rank}`;
}

// --- Core Logic ---

function canCapture(row,col,board,who)
{
    if(row<0||row>7||col<0||col>7) return false;
    const piece=board[row][col];
    if(piece===null) return false;
    const pieceColor=(piece===piece.toUpperCase())?'White':'Black';
    return pieceColor!==who;
}

function rookLikeMoves(fromRow,fromCol,board,who,validMoveTo)
{
    //Up
    for(let r=fromRow-1;r>=0;r--)
    {
        if(board[r][fromCol]===null)
        {
            validMoveTo.push([r,fromCol]);
        }
        else
        {
            if(canCapture(r,fromCol,board,who))
            {
                validMoveTo.push([r,fromCol]);
            }
            break;
        }
    }
    //Down
    for(let r=fromRow+1;r<=7;r++)
    {
        if(board[r][fromCol]===null)
        {
            validMoveTo.push([r,fromCol]);
        }
        else
        {
            if(canCapture(r,fromCol,board,who))
            {
                validMoveTo.push([r,fromCol]);
            }
            break;
        }
    }
    //Left
    for(let c=fromCol-1;c>=0;c--)
    {
        if(board[fromRow][c]===null)
        {
            validMoveTo.push([fromRow,c]);
        }
        else
        {
            if(canCapture(fromRow,c,board,who))
            {
                validMoveTo.push([fromRow,c]);
            }
            break;
        }
    }
    //Right
    for(let c=fromCol+1;c<=7;c++)
    {
        if(board[fromRow][c]===null)
        {
            validMoveTo.push([fromRow,c]);
        }
        else
        {
            if(canCapture(fromRow,c,board,who))
            {
                validMoveTo.push([fromRow,c]);
            }
            break;
        }       
    }
    return;
}

function bishopLikeMoves(fromRow,fromCol,board,who,validMoveTo)
{
    //Top-Left
    for(let r=fromRow-1,c=fromCol-1;r>=0&&c>=0;r--,c--)
    {
        if(board[r][c]===null)
        {       
            validMoveTo.push([r,c]);
        }
        else
        {
            if(canCapture(r,c,board,who))
            {
                validMoveTo.push([r,c]);
            }
            break;
        }
    }
    //Top-Right
    for(let r=fromRow-1,c=fromCol+1;r>=0&&c<=7;r--,c++)
    {
        if(board[r][c]===null)      
        {
            validMoveTo.push([r,c]);
        }
        else
        {   
            if(canCapture(r,c,board,who))
            {
                validMoveTo.push([r,c]);
            }
            break;
        }
    }
    //Bottom-Left
    for(let r=fromRow+1,c=fromCol-1;r<=7&&c>=0;r++,c--)
    {
        if(board[r][c]===null)
        {
            validMoveTo.push([r,c]);
        }
        else
        {
            if(canCapture(r,c,board,who))
            {
                validMoveTo.push([r,c]);
            }
            break;
        }
    }
    //Bottom-Right
    for(let r=fromRow+1,c=fromCol+1;r<=7&&c<=7;r++,c++)
    {
        if(board[r][c]===null)
        {
            validMoveTo.push([r,c]);
        }
        else
        {
            if(canCapture(r,c,board,who))
            {
                validMoveTo.push([r,c]);
            }
            break;
        }
    }
}

function getValidMoves_NoKing(Row,Col,piece,board,who,enPassantTarget=[])
{
    let validMoveTo=[];
    switch (piece.toUpperCase())
    {
        case 'P':
            {
                let direction=(who==='White')?-1:1;
                if(canCapture(Row+direction,Col-1,board,who))
                {
                    validMoveTo.push([Row+direction,Col-1]);
                }
                if(canCapture(Row+direction,Col+1,board,who))
                {
                    validMoveTo.push([Row+direction,Col+1]);
                }
                // En Passant
                if(enPassantTarget.length>0)
                {
                    for(let i=0;i<enPassantTarget.length;i++)
                    {
                        if(Math.abs(enPassantTarget[i][1]-Col)===1&&enPassantTarget[i][0]===Row&&enPassantTarget[i][2]!==who)
                        {
                            validMoveTo.push([Row+direction,enPassantTarget[i][1],'enPassant']);
                        }
                    }
                }
                if(board[Row+direction][Col]===null)
                {
                    validMoveTo.push([Row+direction,Col]);
                    if((who==='White'&&Row===6)||(who==='Black'&&Row===1))
                    {
                        if(board[Row+2*direction][Col]===null)
                        {
                            validMoveTo.push([Row+2*direction,Col]);
                        }
                    }
                }
                return validMoveTo;
            }
        case 'R':
            {
                rookLikeMoves(Row,Col,board,who,validMoveTo);
                return validMoveTo;
            }
        case 'N':
            {
                const knightMoves=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
                for(const move of knightMoves)
                {
                    const newRow=Row+move[0];
                    const newCol=Col+move[1];
                    if(newRow>=0&&newRow<=7&&newCol>=0&&newCol<=7)
                    {
                        if(board[newRow][newCol]===null||canCapture(newRow,newCol,board,who))
                        {
                            validMoveTo.push([newRow,newCol]);
                        }
                    }
                }
                return validMoveTo; 
            }
        case 'B':
            {
                bishopLikeMoves(Row,Col,board,who,validMoveTo);
                return validMoveTo;
            }
        case 'Q':
            {
                rookLikeMoves(Row,Col,board,who,validMoveTo);
                bishopLikeMoves(Row,Col,board,who,validMoveTo);
                return validMoveTo;
            }
    }
}

function isSquareAttacked(board,who,row,col)
{
    for(let r=0;r<8;r++)
    {
        for(let c=0;c<8;c++)
        {
            const piece=board[r][c];

            if(piece&&color(piece)===who)
            {
                let validMoves=[];
                if(piece.toUpperCase()==='K') 
                {
                    const directions=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
                    for(const dir of directions) 
                    {
                        const nr=r+dir[0];
                        const nc=c+dir[1];
                        if(nr>=0&&nr<=7&&nc>=0&&nc<=7) 
                        {
                            validMoves.push([nr, nc]);
                        }
                    }
                }
                else 
                {
                    if(piece.toUpperCase()!=='P')
                    {
                        let _validMoves=getValidMoves_NoKing(r,c,piece,board,who);
                        for(const move of _validMoves)
                        {
                            validMoves.push(move);
                        }
                    }
                    else
                    {
                        let direction=(who==='White')?-1:1;
                        if(c-1>=0)
                        {
                            validMoves.push([r+direction,c-1]);
                        }
                        if(c+1<=7)
                        {
                            validMoves.push([r+direction,c+1]);
                        }
                    }
                }
                for(const move of validMoves)
                {
                    if(move[0]===row&&move[1]===col)
                    {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function getValidKingMoves(row,col,piece,board,who,castleRights)
{
    const directions=[
        [-1,0], [1,0], [0,-1], [0,1],
        [-1,-1], [-1,1], [1,-1], [1,1]
    ];
    const validMoves=[];
    
    // Determine the opponent's color
    const opponent = (who === 'White') ? 'Black' : 'White';

    for(const dir of directions)
    {
        const newRow=row+dir[0];
        const newCol=col+dir[1];
        if(newRow>=0&&newRow<=7&&newCol>=0&&newCol<=7)
        {
            // Check if the square is empty or has an opponent piece (capture)
            // AND check if the square is NOT attacked by the opponent
            if((board[newRow][newCol]===null||canCapture(newRow,newCol,board,who))&&!isSquareAttacked(board,opponent,newRow,newCol))
            {
                validMoves.push([newRow,newCol]);
            }
        }
    }
    //O-O castling
    if(who==='White'&&castleRights['wK'])
    {
        if(board[7][5]===null&&board[7][6]===null)
        {
            if(!isSquareAttacked(board,opponent,7,5)&&!isSquareAttacked(board,opponent,7,6)&&!isSquareAttacked(board,opponent,7,4))
            {
                validMoves.push([7,6,"O-O"]);
            }
        }
    }
    if(who==='Black'&&castleRights['bK'])
    {
        if(board[0][5]===null&&board[0][6]===null)
        {
            if(!isSquareAttacked(board,opponent,0,5)&&!isSquareAttacked(board,opponent,0,6)&&!isSquareAttacked(board,opponent,0,4))
            {
                validMoves.push([0,6,"O-O"]);
            }
        }
    }
    //O-O-O castling
    if(who==='White'&&castleRights['wQ'])
    {
        if(board[7][1]===null&&board[7][2]===null&&board[7][3]===null)
        {
            if(!isSquareAttacked(board,opponent,7,2)&&!isSquareAttacked(board,opponent,7,3)&&!isSquareAttacked(board,opponent,7,4))
            {
                validMoves.push([7,2,"O-O-O"]);
            }
        }
    }
    if(who==='Black'&&castleRights['bQ'])
    {
        if(board[0][1]===null&&board[0][2]===null&&board[0][3]===null)
        {
            if(!isSquareAttacked(board,opponent,0,2)&&!isSquareAttacked(board,opponent,0,3)&&!isSquareAttacked(board,opponent,0,4))
            {
                validMoves.push([0,2,"O-O-O"]);
            }
        }
    }
    return validMoves;
}

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

function inCheck(board,who)
{
    const opponent=(who==='White')?'Black':'White';
    const kingPos=getKingPosition(board,who);

    if(kingPos)
    {
        return isSquareAttacked(board,opponent,kingPos[0],kingPos[1]);
    }
}

function avoidCheck(validMoveTo,Board,who,selectedSquare,movingPiece)
{
    let finalMoves=[];
    
    for(const move of validMoveTo)
    {
        let isSafe=true;
        
        let tempBoard=JSON.parse(JSON.stringify(Board));
        tempBoard[move[0]][move[1]]=movingPiece;
        tempBoard[selectedSquare.row][selectedSquare.col]=null;

        if (move.length>2&&move[2]==='enPassant') 
        {
            tempBoard[selectedSquare.row][move[1]] = null;
        }
        
        if(inCheck(tempBoard,who))
        {
            isSafe=false;
        }
        
        if(isSafe)
        {
            finalMoves.push(move);
        }
    }
    return finalMoves;
}

function checkGameResult(board,turn,blackInCheck,whiteInCheck,castleRights)
{
    let hasValidMove=false;
    for(let r=0;r<8;r++)
    {
        for(let c=0;c<8;c++)
        {
            const piece=board[r][c];
            if(piece&&color(piece)===turn)
            {
                let validMoves=[];
                if(piece.toUpperCase()==='K')
                {
                    validMoves=getValidKingMoves(r,c,piece,board,turn,castleRights||{});
                }
                else
                {
                    validMoves=getValidMoves_NoKing(r,c,piece,board,turn);
                }
                const tempSelectedSquare={row:r,col:c};
                validMoves=avoidCheck(validMoves,board,turn,tempSelectedSquare,piece);
                if(validMoves.length>0)
                {
                    hasValidMove=true;
                    break;
                }
            }
        }   
        if(hasValidMove) break;
    }
    if(!hasValidMove)
    {
        if((turn==='White'&&whiteInCheck)||(turn==='Black'&&blackInCheck))
        {
            return 'Checkmate';
        }
        else
        {
            return 'Stalemate';
        }
    }
    return 'Ongoing';
}

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

function checkThreeRepeated(FENrecord) 
{
    for(const [k,v] of FENrecord.entries())
    {
        if(v>=3)
        {
            return true;
        }
    }
    return false;
}

function createFEN(board,who,castleRights,enPassantTarget,halfRound,round)
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

function createFENForRecords(board,who,castleRights,enPassantTarget,halfRound,round)
{
    return createFEN(board,who,castleRights,enPassantTarget,halfRound,round);
}

// --- UI Functions ---

function addMoveToHistory(fromRow, fromCol, toRow, toCol, piece, promoteChoice = null, historyLength) 
{
    const movesList = document.getElementById('moves-list');
    const historyContainer = document.getElementById('move-history');

    if(piece==="O-O"||piece==="O-O-O")
    {
        const li=document.createElement('li');
        li.textContent=`${historyLength}. ${piece}`;
        movesList.appendChild(li);
        return;
    }
    if(piece==="Checkmate")
    {
        const li=document.createElement('li');
        li.textContent=`${historyLength}. Checkmate - Game Over`;
        movesList.appendChild(li);
        return;
    }
    if(piece==="Stalemate")
    {
        const li=document.createElement('li');
        li.textContent=`${historyLength}. Stalemate - Game Over`;
        movesList.appendChild(li);
        return;
    }
    if(piece==="Threefold repetition")
    {
        const li=document.createElement('li');
        li.textContent=`${historyLength}. Draw by Threefold repetition`;
        movesList.appendChild(li);
        return;
    }

    const from=getAlgebraicNotation(fromRow, fromCol);
    const to=getAlgebraicNotation(toRow, toCol);
    const pieceSymbol=piece.toUpperCase()==='P'?'':piece.toUpperCase(); // Pawn usually omitted
    const moveText=promoteChoice ? `${pieceSymbol} ${from}->${to}=${promoteChoice.toUpperCase()}` : `${pieceSymbol} ${from}->${to}`;
    
    const li=document.createElement('li');
    li.textContent=`${historyLength}. ${moveText}`;
    movesList.appendChild(li);
    
    // Auto-scroll to bottom
    if(historyContainer) {
        historyContainer.scrollTop=historyContainer.scrollHeight;
    }
}

function getImageName(piece)
{
    if(!piece) return null;
    const color=(piece===piece.toUpperCase())?'w':'b';
    const type=piece.toUpperCase();
    return `img/${color}${type}.svg`;
}

function createBoard(Board,onClickCallback,playerSide)
{
    const boardElement=document.getElementById('chessboard');
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

function showPromotionModal(who) 
{
    return new Promise((resolve) => 
    {
        const modal = document.getElementById('promotion-modal');
        const buttons = modal.querySelectorAll('.promo-btn');

        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');

        buttons.forEach(btn => 
        {
            btn.onclick = () => 
            {
                const piece = btn.dataset.piece;
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');

                resolve(who === 'White' ? piece : piece.toLowerCase());
                buttons.forEach(b => b.onclick = null);
            };
        });

        modal.querySelector('.promotion-backdrop').onclick = () => 
        {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            resolve(who === 'White' ? 'Q' : 'q');
            buttons.forEach(b => b.onclick = null);
            modal.querySelector('.promotion-backdrop').onclick = null;
        };
    });
}

function showMoves(validMoveTo)
{
    for(const move of validMoveTo)
    {
        const row=move[0];;
        const col=move[1];
        const square=document.querySelector(`.square[data-row='${row}'][data-col='${col}']`);
        if(square) square.classList.add('possible-move');
    }
}

function clearMoves()
{
    const squares=document.querySelectorAll('.square.possible-move');
    squares.forEach(square => square.classList.remove('possible-move'));
}

// --- Engine Logic ---

function getEngineLogPath()
{
    const baseDir = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const dir = path.join(baseDir, 'ChessGame');
    try { fs.mkdirSync(dir, { recursive: true }); } catch(_) {}
    return path.join(dir, 'engine.log');
}

function logEngine(message)
{
    const line = `[${new Date().toISOString()}] ${message}\n`;
    try { fs.appendFileSync(getEngineLogPath(), line, 'utf8'); } catch(_) {}
    console.log(message);
}

// Determine the directory containing Bridge.exe
let bridgeDir;
const prodBridgePath = path.join(process.resourcesPath || '', 'Bridge.exe');

if (process.resourcesPath && fs.existsSync(prodBridgePath))
{
    // Production: Bridge.exe is in the resources folder
    bridgeDir = process.resourcesPath;
}
else
{
    // Development: Bridge.exe is in the project root
    bridgeDir = __dirname;
}

const bridgeExePath = path.join(bridgeDir, 'Bridge.exe');
logEngine(`Engine: using bridgeDir=${bridgeDir}`);
logEngine(`Engine: using bridgeExePath=${bridgeExePath}`);

const bridgeProcess=spawn(bridgeExePath,[],{cwd:bridgeDir, windowsHide:true});

bridgeProcess.on('error',(err)=>
{
    logEngine(`Engine ERROR: Failed to start Bridge process: ${err && err.stack ? err.stack : String(err)}`);
});

bridgeProcess.on('exit', (code, signal) =>
{
    logEngine(`Engine: Bridge process exited code=${code} signal=${signal}`);
});

let engineResolve=null;

bridgeProcess.stdout.on('data',(data)=>
{
    const output=data.toString();
    logEngine(`Engine stdout: ${output}`);

    const lines=output.split('\n');
    for(const line of lines)
    {
        if(line.startsWith('bestmove'))
        {
            const parts=line.split(' ');
            const bestMove=parts[1];
            if(engineResolve)
            {
                engineResolve(bestMove);
                engineResolve=null;
            }
        }
    }
});

bridgeProcess.stderr.on('data', (data) =>
{
    logEngine(`Engine stderr: ${data.toString()}`);
});

function getBestMove(fen,timeOut)
{
    return new Promise((resolve,reject)=>
    {
        if(engineResolve)
        {
            reject(new Error('Engine busy: previous request still pending'));
            return;
        }

        engineResolve=resolve;
        const cmd = `bestmove ${timeOut} ${fen}\n`;
        logEngine(`Engine stdin: ${cmd.trim()}`);
        bridgeProcess.stdin.write(cmd);

        const guardMs = Math.max(3000, Number(timeOut || 0) + 5000);
        setTimeout(() =>
        {
            if(engineResolve === resolve)
            {
                engineResolve = null;
                reject(new Error(`Engine timeout after ${guardMs}ms`));
            }
        }, guardMs);
    });
}

function UCItoMove(bestMove)
{
    if(!bestMove||bestMove === '(none)')
    {
        return null;
    }
    bestMove = bestMove.trim();
    const fromCol=bestMove.charCodeAt(0)-'a'.charCodeAt(0);
    const fromRow=8-parseInt(bestMove[1]);
    const toCol=bestMove.charCodeAt(2)-'a'.charCodeAt(0);
    const toRow=8-parseInt(bestMove[3]);

    let promotion=null;
    if(bestMove.length>4)
    {
        promotion=bestMove[4];
    }
    return {from:{row:fromRow,col:fromCol},to:{row:toRow,col:toCol},promotion:promotion};
}

module.exports={
    addMoveToHistory,
    avoidCheck,
    canCapture,
    canPromote,
    checkGameResult,
    checkThreeRepeated,
    color,
    createBoard,
    createFEN,
    createFENForRecords,
    getBestMove,
    UCItoMove,
    getKingPosition,
    getValidMoves_NoKing,
    inCheck,
    isSquareAttacked,
    getValidKingMoves,
    showPromotionModal,
    showMoves,
    clearMoves,
    sleep
};

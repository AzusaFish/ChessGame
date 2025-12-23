const spawn=require('child_process').spawn;
const path=require('path');

const bridgePath='Bridge.exe';
const bridgeProcess=spawn(bridgePath,[],{cwd:path.join(__dirname,'..')});

bridgeProcess.on('error',(err)=>
{
    console.error('Failed to start Bridge process:',err);
});

let engineResolve=null;

bridgeProcess.stdout.on('data',(data)=>
{
    const output=data.toString();
    console.log('Engine output:', output);

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

function getBestMove(fen,timeOut)
{
    return new Promise((resolve,reject)=>
    {
        engineResolve=resolve;

        bridgeProcess.stdin.write(`bestmove ${timeOut} ${fen}\n`);
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

module.exports={getBestMove,UCItoMove};
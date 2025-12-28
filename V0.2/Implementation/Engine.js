const spawn=require('child_process').spawn;
const path=require('path');
const fs=require('fs');
const os=require('os');

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
    // Development: Bridge.exe is in the project root (parent of Implementation/)
    bridgeDir = path.join(__dirname, '..');
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

module.exports={getBestMove,UCItoMove};
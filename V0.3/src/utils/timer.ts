export function timer()
{
    let whiteTime: number = 0;
    let blackTime: number = 0;
    let currentTurn: 'White' | 'Black' = 'White';
    let timerId: number | null = null;
    const tickInterval: number = 200;

    function stopTimer()
    {
        if(timerId !== null)
        {
            clearInterval(timerId);
            timerId = null;
        }
    }

    function startTimer(timeLimit: number, startTurn: 'White' | 'Black')
    {
        whiteTime = timeLimit * 60 * 1000;
        blackTime = timeLimit * 60 * 1000;
        currentTurn = startTurn;
        stopTimer();
        timerId = setInterval(_tick, tickInterval);
    }

    function returnTime_White()
    {
        return (Math.floor(whiteTime/1000/60)).toString() + ':' + ((Math.floor(whiteTime/1000))%60).toString().padStart(2, '0');
    }

    function returnTime_Black()
    {
        return (Math.floor(blackTime/1000/60)).toString() + ':' + ((Math.floor(blackTime/1000))%60).toString().padStart(2, '0');
    }

    function _tick()
    {
        if(currentTurn === 'White')
        {
            whiteTime -= tickInterval;
        }
        else
        {
            blackTime -= tickInterval;
        }
    }

    function switchTurn()
    {
        currentTurn = currentTurn === 'White' ? 'Black' : 'White';
    }


    function getRemainingTime_White()
    {
        return whiteTime;
    }

    function getRemainingTime_Black()
    {
        return blackTime;
    }

    return {
        startTimer,
        stopTimer,
        switchTurn,
        returnTime_White,
        returnTime_Black,
        getRemainingTime_White,
        getRemainingTime_Black
    };
}

// 单例适配：方便按原先方式导入使用命名函数
const _timer = timer();
export const startTimer = _timer.startTimer;
export const stopTimer = _timer.stopTimer;
export const switchTurn = _timer.switchTurn;
export const returnTime_White = _timer.returnTime_White;
export const returnTime_Black = _timer.returnTime_Black;
export const getRemainingTime_White = _timer.getRemainingTime_White;
export const getRemainingTime_Black = _timer.getRemainingTime_Black;

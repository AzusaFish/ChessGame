function _sleep(ms) 
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sleep(ms)
{
    await _sleep(ms);
}

module.exports={sleep};

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

module.exports={checkThreeRepeated};
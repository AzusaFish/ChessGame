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

module.exports={showPromotionModal};
(function () {
    const overlay   = document.getElementById('articleModal');
    const card      = document.getElementById('modalCard');
    const closeBtn  = document.getElementById('modalClose');
    const banner    = document.getElementById('modalBanner');
    const catEl     = document.getElementById('modalCategory');
    const titleEl   = document.getElementById('modalTitle');
    const dateEl    = document.getElementById('modalDate');
    const textEl    = document.getElementById('modalText');

    function openModal(article) {
        const theme = article.dataset.theme || '';
        card.className = 'modal-card ' + theme;
        banner.src = article.dataset.img || '';
        banner.alt = article.dataset.title || '';
        catEl.textContent = article.dataset.category || '';
        catEl.className = 'category ' + (article.dataset.catClass || '');
        titleEl.textContent = article.dataset.title || '';
        dateEl.textContent = article.dataset.date || '';
        textEl.textContent = article.dataset.full || '';

        card.scrollTop = 0;
        overlay.classList.add('active', 'fade-in');
        overlay.classList.remove('fade-out');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        overlay.classList.add('fade-out');
        overlay.classList.remove('fade-in');
        setTimeout(function() {
            overlay.classList.remove('active', 'fade-out');
            document.body.style.overflow = '';
        }, 250);
    }

    document.querySelectorAll('.news-row[data-title]').forEach(function (article) {
        article.addEventListener('click', function () { openModal(article); });
    });

    closeBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });
})();
document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('gifts-grid');
    const loader = document.getElementById('loader');
    const template = document.getElementById('gift-card-template');
    const filtersContainer = document.getElementById('filters');

    let allGifts = [];

    const getPriorityInfo = (priority) => {
        const p = (priority || 'medium').toLowerCase();
        if (p === 'high' || p === 'высокий') return { class: 'priority-high', text: 'ERR: CRITICAL' };
        if (p === 'low' || p === 'низкий') return { class: 'priority-low', text: 'INFO: LOW' };
        return { class: 'priority-medium', text: 'WARN: NORMAL' };
    };

    const renderGifts = (giftsToRender) => {
        gridContainer.innerHTML = '';

        if (giftsToRender.length === 0) {
            gridContainer.innerHTML = '<p style="color: var(--text-comment); grid-column: 1 / -1; text-align: center; font-size: 1.1rem; padding: 20px;">// Карточек не найдено. Возврат 404.</p>';
            return;
        }

        giftsToRender.forEach((gift, index) => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.card');
            card.style.animation = `fadeIn 0.5s ease-out ${index * 0.1}s backwards`;

            const img = clone.querySelector('.card-image');
            img.src = gift.image && gift.image.trim() !== '' ? gift.image : 'https://placehold.co/600x400/161b22/8b949e?text=Image+Not+Found';
            img.onerror = function () {
                this.src = 'https://placehold.co/600x400/161b22/8b949e?text=Broken_Link.png';
            };

            const pBadge = clone.querySelector('.priority-badge');
            const prioInfo = getPriorityInfo(gift.priority);
            pBadge.classList.add(prioInfo.class);
            pBadge.textContent = prioInfo.text;

            const cBadge = clone.querySelector('.category-badge');
            if (gift.category) {
                cBadge.textContent = `{ ${gift.category} }`;
            } else {
                cBadge.style.display = 'none';
            }

            const safeTitle = gift.title.replace(/"/g, "'");
            clone.querySelector('.card-title').innerHTML = `<span style="color:var(--text-keyword)">const</span> <span style="color:var(--text-primary)">gift</span> = <span style="color:var(--text-string)">"${safeTitle}"</span>;`;

            clone.querySelector('.card-description').textContent = gift.description || '// Без описания';
            clone.querySelector('.card-price').textContent = gift.price || 'null';

            const btn = clone.querySelector('.card-btn');
            if (gift.link) {
                btn.href = gift.link;
            } else {
                btn.style.display = 'none';
            }

            gridContainer.appendChild(clone);
        });
    };

    const initFilters = (gifts) => {
        const categories = new Set();
        gifts.forEach(g => {
            if (g.category && g.category.trim() !== '') {
                categories.add(g.category.trim());
            }
        });

        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.filter = category;
            btn.textContent = `"${category}"`;
            filtersContainer.appendChild(btn);
        });

        filtersContainer.addEventListener('click', (e) => {
            if (!e.target.classList.contains('filter-btn')) return;

            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const filterVal = e.target.dataset.filter;

            if (filterVal === 'all') {
                renderGifts(allGifts);
            } else {
                const filtered = allGifts.filter(g => g.category && g.category.trim() === filterVal);
                renderGifts(filtered);
            }
        });
    };

    setTimeout(() => {
        fetch('gifts.json')
            .then(r => r.json())
            .then(gifts => {
                allGifts = gifts;
                loader.classList.add('hidden');
                gridContainer.classList.remove('hidden');

                initFilters(gifts);
                renderGifts(gifts);
            })
            .catch(err => {
                loader.classList.add('hidden');
                gridContainer.classList.remove('hidden');
                gridContainer.innerHTML = `<p style="color: var(--text-keyword); grid-column: 1 / -1;">[FATAL ERROR]: Не удалось распарсить gifts.json. ${err.message}</p>`;
            });
    }, 800);
});

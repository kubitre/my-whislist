document.addEventListener('DOMContentLoaded', () => {
  const gridContainer = document.getElementById('gifts-grid');
  const loader = document.getElementById('loader');
  const template = document.getElementById('gift-card-template');

  // Функция для создания задержки анимации при появлении карточек
  const getAnimationDelay = (index) => `${index * 0.1}s`;

  // Разбор приоритета: возвращает класс для бейджа и текст
  const getPriorityInfo = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    
    if (p === 'high' || p === 'высокий') {
      return { class: 'priority-high', text: '🔥 Очень хочу' };
    }
    if (p === 'low' || p === 'низкий') {
      return { class: 'priority-low', text: 'Подождет' };
    }
    return { class: 'priority-medium', text: 'Хорошо бы' };
  };

  // Имитация небольшой задержки для красоты (0.5с), затем загрузка json
  setTimeout(() => {
    fetch('gifts.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(gifts => {
        // Скрываем лоадер и показываем сетку
        loader.classList.add('hidden');
        gridContainer.classList.remove('hidden');

        if (gifts.length === 0) {
          gridContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1 / -1; font-size: 1.2rem;">Вишлист пока пуст. Добавьте подарки в gifts.json!</p>';
          return;
        }

        // Рендер карточек на основе JSON
        gifts.forEach((gift, index) => {
          const clone = template.content.cloneNode(true);
          const card = clone.querySelector('.card');
          
          // Анимация с небольшой задержкой для каждой следующей карточки
          card.style.animationDelay = getAnimationDelay(index);
          
          // Изображение
          const img = clone.querySelector('.card-image');
          img.src = gift.image && gift.image.trim() !== '' 
            ? gift.image 
            : 'https://placehold.co/600x400/161b22/8b949e?text=No+Image';
          img.alt = gift.title;
          
          // Обработка ошибки загрузки пикчи
          img.onerror = function() {
            this.src = 'https://placehold.co/600x400/161b22/8b949e?text=Image+Error';
          };

          // Бейдж приоритета
          const badge = clone.querySelector('.badge');
          const prioInfo = getPriorityInfo(gift.priority);
          badge.classList.add(prioInfo.class);
          badge.textContent = prioInfo.text;

          // Текст
          clone.querySelector('.card-title').textContent = gift.title;
          clone.querySelector('.card-description').textContent = gift.description || '';
          
          // Цена
          const priceEl = clone.querySelector('.card-price');
          priceEl.textContent = gift.price || '';

          // Кнопка ссылки
          const btn = clone.querySelector('.card-btn');
          if (gift.link) {
            btn.href = gift.link;
          } else {
            btn.style.display = 'none'; // Скрываем если ссылки нет
          }

          gridContainer.appendChild(clone);
        });
      })
      .catch(error => {
        console.error('Ошибка при загрузке данных:', error);
        loader.classList.add('hidden');
        gridContainer.classList.remove('hidden');
        gridContainer.innerHTML = `
          <div style="text-align: center; grid-column: 1 / -1; padding: 40px; background: rgba(255,71,87,0.1); border-radius: 20px; border: 1px solid rgba(255,71,87,0.3);">
            <h2 style="color: var(--priority-high); margin-bottom: 10px;">Ой, что-то пошло не так!</h2>
            <p style="color: var(--text-secondary);">Не удалось загрузить <code>gifts.json</code>. Убедитесь, что файл существует и JSON в нем валидный.</p>
          </div>
        `;
      });
  }, 500);
});

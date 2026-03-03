// ===== НАСТРОЙКА: Вставьте сюда ссылку на опубликованный CSV из Google Таблиц =====
// Пример: https://docs.google.com/spreadsheets/d/e/2PAC.../pub?gid=0&single=true&output=csv
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYjvF5ewN3vOTRjEjoRat3YlrqQfO-WY8ISokNoZ8RtTvjeDbEHsKG5queTz8HwHf4p9xOBCYlvrht/pub?gid=0&single=true&output=csv'; // Замените эту ссылку на вашу из Google Таблиц!

document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('gifts-grid');
    const loader = document.getElementById('loader');
    const template = document.getElementById('gift-card-template');
    const filtersContainer = document.getElementById('filters');

    let allGifts = [];

    const getBookedGifts = () => JSON.parse(localStorage.getItem('booked_gifts') || '[]');
    const saveBookedGifts = (arr) => localStorage.setItem('booked_gifts', JSON.stringify(arr));

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
            const bookedIds = getBookedGifts();
            const isBooked = bookedIds.includes(String(gift.id)) || gift.isBookedFromSheet;

            if (isBooked) {
                card.classList.add('booked');
                btn.innerHTML = `<span class="btn-icon">📦</span> <span class="btn-text">Забронировано</span>`;
                btn.style.borderColor = 'var(--festive-red)';
                btn.style.color = 'var(--text-primary)';
                btn.style.background = 'rgba(255, 68, 68, 0.2)';
                btn.disabled = true;
            } else if (gift.link) {
                btn.dataset.id = gift.id;
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const booked = getBookedGifts();
                    if (!booked.includes(String(gift.id))) {
                        booked.push(String(gift.id));
                        saveBookedGifts(booked);
                        renderGifts(allGifts); // Re-render to show booked status
                    }
                    window.open(gift.link, '_blank', 'noopener,noreferrer');
                });
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

    const parseCSV = (text) => {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const result = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const obj = {};
            const row = [];
            let cur = '';
            let inQuotes = false;
            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                if (char === '"' && lines[i][j + 1] === '"') {
                    cur += '"';
                    j++;
                } else if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    row.push(cur);
                    cur = '';
                } else {
                    cur += char;
                }
            }
            row.push(cur);
            headers.forEach((h, idx) => {
                if (h) obj[h] = row[idx] ? row[idx].trim() : '';
            });

            const rawBooked = (obj['забронировано'] || obj['booked'] || '').toString().toLowerCase().trim();
            const isBookedFromSheet = rawBooked === 'да' || rawBooked === 'yes' || rawBooked === '1' || rawBooked === 'true' || rawBooked === '+';

            result.push({
                id: obj['id'] || String(i),
                title: obj['название'] || obj['title'] || '',
                description: obj['описание'] || obj['description'] || '',
                price: obj['цена'] || obj['price'] || '',
                link: obj['ссылка'] || obj['link'] || '',
                image: obj['картинка'] || obj['image'] || '',
                priority: obj['приоритет'] || obj['priority'] || '',
                category: obj['категория'] || obj['category'] || '',
                isBookedFromSheet: isBookedFromSheet
            });
        }
        return result.filter(g => g.title !== '');
    };

    setTimeout(() => {
        fetch(SHEET_CSV_URL)
            .then(async r => {
                if (SHEET_CSV_URL.endsWith('.json')) {
                    return await r.json();
                } else {
                    const text = await r.text();
                    return parseCSV(text);
                }
            })
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
                gridContainer.innerHTML = `<p style="color: var(--text-keyword); grid-column: 1 / -1;">[FATAL ERROR]: Не удалось загрузить данные. Убедитесь, что ссылка на Google Таблицу (CSV) корректна.<br><br>Техническая ошибка: ${err.message}</p>`;
            });
    }, 800);

    // Анимация терминала и загрузки
    const termCmd = document.getElementById('term-cmd');
    const termBoot = document.getElementById('term-boot-seq');
    const out1 = document.getElementById('term-out-1');
    const out2 = document.getElementById('term-out-2');
    const inputRow = document.getElementById('command-input-row');
    const cliInput = document.getElementById('cli-input');
    const termOutputContainer = document.getElementById('term-output');

    if (termCmd) {
        termCmd.classList.add('active');
        setTimeout(() => {
            termCmd.classList.remove('active');
            termCmd.classList.add('done');
            termBoot.classList.remove('hidden');

            out1.classList.add('active');
            setTimeout(() => {
                out1.classList.remove('active');
                out1.classList.add('done');
                out2.classList.add('active');

                setTimeout(() => {
                    out2.classList.remove('active');
                    out2.classList.add('done');

                    // Показываем инпут
                    inputRow.classList.remove('hidden');
                    cliInput.focus();
                }, 1500);
            }, 1000);
        }, 2000);
    }

    // Терминал: фокус на инпут при клике на окно терминала
    document.querySelector('.terminal-window').addEventListener('click', (e) => {
        if (!e.target.closest('.terminal-header')) {
            cliInput.focus();
        }
    });

    // Обработка команд терминала
    const processCommand = (cmdStr) => {
        const parts = cmdStr.trim().split(/\s+/);
        const command = parts[0].toLowerCase();

        const outputLine = document.createElement('div');
        outputLine.style.marginBottom = '10px';
        outputLine.innerHTML = `<span class="prompt">user@wishlist:~$</span> <span style="color:var(--text-primary)">${cmdStr}</span>`;
        termOutputContainer.insertBefore(outputLine, inputRow);

        const responseLine = document.createElement('div');
        responseLine.style.marginBottom = '15px';
        responseLine.style.color = 'var(--text-secondary)';

        if (command === 'help') {
            responseLine.innerHTML = `
                Доступные команды:<br>
                <span style="color:var(--text-keyword)">help</span> - показать это сообщение<br>
                <span style="color:var(--text-keyword)">clear</span> - очистить терминал<br>
                <span style="color:var(--text-keyword)">ls</span> (или <span style="color:var(--text-keyword)">wishlist</span>) - вывести список подарков<br>
                <span style="color:var(--text-keyword)">git push &lt;id&gt;</span> - забронировать подарок по ID
            `;
        } else if (command === 'clear') {
            const children = Array.from(termOutputContainer.children);
            children.forEach(child => {
                if (child !== inputRow) {
                    child.remove();
                }
            });
            return;
        } else if (command === 'ls' || command === 'wishlist') {
            if (allGifts.length === 0) {
                responseLine.textContent = 'Список подарков пуст или еще загружается.';
            } else {
                let listHtml = '<div style="display:grid; gap:5px; margin-top:5px;">';
                const bookedIds = getBookedGifts();
                allGifts.forEach(g => {
                    const isBooked = bookedIds.includes(String(g.id)) || g.isBookedFromSheet;
                    const badge = isBooked ? '<span style="color:var(--festive-red)">[BOOKED]</span>' : '<span style="color:var(--festive-green)">[AVAILABLE]</span>';
                    listHtml += `<div><span style="color:var(--text-number)">ID: ${g.id}</span> | ${badge} | <span style="color:var(--text-string)">${g.price}</span> | ${g.title}</div>`;
                });
                listHtml += '</div>';
                responseLine.innerHTML = listHtml;
            }
        } else if (command === 'git' && parts[1] === 'push') {
            const giftId = parts[2];
            if (!giftId) {
                responseLine.innerHTML = `<span style="color:var(--text-keyword)">error:</span> Укажите ID подарка. Пример: git push 1`;
            } else {
                const targetGift = allGifts.find(g => String(g.id) === giftId);
                if (!targetGift) {
                    responseLine.innerHTML = `<span style="color:var(--text-keyword)">error:</span> Подарок с ID ${giftId} не найден. Используйте команду ls, чтобы увидеть список.`;
                } else {
                    const bookedIds = getBookedGifts();
                    const isBooked = bookedIds.includes(String(giftId)) || targetGift.isBookedFromSheet;
                    if (isBooked) {
                        responseLine.innerHTML = `<span style="color:var(--text-keyword)">error:</span> Подарок '${targetGift.title}' уже забронирован!`;
                    } else {
                        bookedIds.push(String(giftId));
                        saveBookedGifts(bookedIds);
                        responseLine.innerHTML = `Pushing gift <span style="color:var(--text-number)">${giftId}</span> ('${targetGift.title}') to booked... <span style="color:var(--festive-green)">Success!</span>`;
                        renderGifts(allGifts); // Перерендериваем карточки
                    }
                }
            }
        } else if (command !== '') {
            responseLine.innerHTML = `bash: command not found: ${command}. Введите <span style="color:var(--text-keyword)">help</span> для списка команд.`;
        }

        if (command !== '') {
            termOutputContainer.insertBefore(responseLine, inputRow);
        }

        termOutputContainer.scrollTop = termOutputContainer.scrollHeight;
    };

    cliInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = cliInput.value;
            cliInput.value = '';
            processCommand(cmd);
        }
    });

    // Обработка кнопок macOS (терминал)
    const btnClose = document.querySelector('.btn-close');
    const btnMin = document.querySelector('.btn-min');
    const btnMax = document.querySelector('.btn-max');
    const termWindow = document.querySelector('.terminal-window');

    if (btnClose) {
        btnClose.addEventListener('click', () => {
            const children = Array.from(termOutputContainer.children);
            children.forEach(child => {
                if (child !== inputRow) {
                    child.remove();
                }
            });
        });
    }

    if (btnMin) {
        btnMin.addEventListener('click', () => {
            termWindow.classList.remove('terminal-maximized');
            termWindow.classList.toggle('terminal-minimized');
        });
    }

    if (btnMax) {
        btnMax.addEventListener('click', () => {
            termWindow.classList.remove('terminal-minimized');
            termWindow.classList.toggle('terminal-maximized');
            if (termWindow.classList.contains('terminal-maximized')) {
                cliInput.focus();
            }
        });
    }

    // Интерактивные частицы
    document.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.terminal-window')) return;
        if (document.body.classList.contains('minimal-mode')) return;

        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = e.pageX - 10 + 'px';
        sparkle.style.top = e.pageY - 10 + 'px';
        document.body.appendChild(sparkle);

        setTimeout(() => { sparkle.remove(); }, 800);
    });

    // Minimal Mode Toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('minimal-mode');
            const isMinimal = document.body.classList.contains('minimal-mode');
            themeBtn.textContent = isMinimal ? 'Restore effects' : 'sudo killall effects';
        });
    }
});

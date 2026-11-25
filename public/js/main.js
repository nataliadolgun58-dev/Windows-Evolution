
// Отримуємо кнопку відкриття меню
const menuToggle = document.getElementById('menuToggle');

// Отримуємо бічну панель
const sidebar = document.getElementById('sidebar');

// Перевіряємо, чи існують ці елементи на сторінці
if (menuToggle && sidebar) {

    // Обробляємо натискання на кнопку меню
    menuToggle.addEventListener('click', () => {

        // Додаємо або прибираємо клас open
        sidebar.classList.toggle('open');

    });

}


// ===== Статистика з бази даних (головна сторінка) =====
async function loadStats() {
    const dbStatus = document.getElementById('dbStatus');
    if (!dbStatus) return; // не головна сторінка

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const s = await response.json();

        set('totalSystems', s.totalSystems);
        set('evolutionYears', s.evolutionYears);
        set('maxCompare', s.maxCompare);
        set('importFormatsCount', s.importFormats.length);
        set('importFormatsList', s.importFormats.join(' / '));
        dbStatus.textContent = 'БАЗУ ПІДКЛЮЧЕНО';
    } catch (error) {
        // Не показуємо вигадані числа, якщо база недоступна
        dbStatus.textContent = 'БАЗА НЕДОСТУПНА';
        document.getElementById('dbDot')?.classList.add('offline');
        console.error('Не вдалося завантажити статистику:', error);
    }
}

loadStats();

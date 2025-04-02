document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const wasExpanded = localStorage.getItem('sidebarExpanded') === 'true';
    const isMobile = window.innerWidth <= 768;

    // Инициализация только для десктопов
    if (!isMobile) {
        if (wasExpanded) {
            sidebar.classList.add('expanded');
        }

        setTimeout(() => {
            sidebar.classList.add('animated');
        }, 10);
    }

    // Обработчик клика
    sidebar.addEventListener('click', (e) => {
        if (!isMobile && !e.target.closest('a')) {
            sidebar.classList.toggle('expanded');
            localStorage.setItem('sidebarExpanded', sidebar.classList.contains('expanded'));
        }
    });
});
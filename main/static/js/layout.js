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
    } else {
        // Ensure the sidebar is not expanded on mobile
        sidebar.classList.remove('expanded');
    }

    // Обработчик клика
    sidebar.addEventListener('click', (e) => {
        if (!isMobile && !e.target.closest('a')) {
            sidebar.classList.toggle('expanded');
            localStorage.setItem('sidebarExpanded', sidebar.classList.contains('expanded'));
        }
    });

    // Обработчик изменения размера окна
    window.addEventListener('resize', () => {
        const newIsMobile = window.innerWidth <= 768;
        if (newIsMobile) {
            sidebar.classList.remove('expanded');
        } else {
            if (wasExpanded) {
                sidebar.classList.add('expanded');
            }
        }
    });
});

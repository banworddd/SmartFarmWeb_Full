document.addEventListener('DOMContentLoaded', () => {
    // === Константы и сопоставления ===
    const orgTypeIcons = {
        'supplier': 'fas fa-truck',
        'partner': 'fas fa-handshake',
        'government': 'fas fa-landmark',
        'other': 'fas fa-building'
    };

    // === DOM элементы ===
    const orgTabsList = document.getElementById('orgTabsList');
    const orgDescription = document.getElementById('orgDescription');
    let currentOrgId = null;

    // === Вспомогательные функции ===
    const getCookie = name => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                return decodeURIComponent(cookie.substring(name.length + 1));
            }
        }
        return null;
    };

    // === Создание вкладки организации ===
    const createOrgTab = (org, isActive = false) => {
        const tab = document.createElement('div');
        tab.className = `org-tab${isActive ? ' active' : ''}`;
        tab.dataset.orgId = org.organization.id;
        tab.dataset.orgSlug = org.organization.slug;
        
        const icon = document.createElement('i');
        icon.className = orgTypeIcons[org.organization.type] || 'fas fa-building';
        
        const name = document.createElement('span');
        name.textContent = org.organization.name;
        
        tab.appendChild(icon);
        tab.appendChild(name);
        
        tab.addEventListener('click', () => switchOrg(org));
        
        return tab;
    };

    // === Переключение организации ===
    const switchOrg = (org) => {
        if (currentOrgId === org.organization.id) return;
        
        // Обновляем активную вкладку
        document.querySelectorAll('.org-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.orgId === org.organization.id.toString());
        });
        
        // Обновляем описание
        if (orgDescription) {
            orgDescription.textContent = org.organization.description || 'Нет описания';
        }
        
        currentOrgId = org.organization.id;

        // Генерируем событие смены организации
        document.dispatchEvent(new CustomEvent('orgChanged', {
            detail: {
                id: org.organization.id,
                slug: org.organization.slug,
                name: org.organization.name
            }
        }));
    };

    // === Загрузка организаций ===
    const loadOrganizations = async () => {
        try {
            const response = await fetch('/api/v1/user_pages/user_organizations/', {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Ошибка загрузки организаций');

            const organizations = await response.json();
            
            if (!organizations.length) {
                if (orgTabsList) {
                    orgTabsList.innerHTML = `
                        <div class="empty-state-container">
                            <div class="no-orgs">
                                <i class="fas fa-building"></i>
                                <h3>Нет доступных организаций</h3>
                                <p>Вы не состоите ни в одной организации</p>
                            </div>
                        </div>
                    `;
                }
                return;
            }

            // Очищаем список вкладок
            if (orgTabsList) {
                orgTabsList.innerHTML = '';
                
                // Добавляем вкладки
                organizations.forEach((org, index) => {
                    const tab = createOrgTab(org, index === 0);
                    orgTabsList.appendChild(tab);
                });
                
                // Активируем первую организацию
                if (organizations.length > 0) {
                    switchOrg(organizations[0]);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            if (orgTabsList) {
                orgTabsList.innerHTML = `
                    <div class="empty-state-container">
                        <div class="error-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <h3>Ошибка загрузки</h3>
                            <p>Не удалось загрузить список организаций</p>
                        </div>
                    </div>
                `;
            }
        }
    };

    // === Инициализация ===
    if (orgTabsList) {
        loadOrganizations();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Используем slug из глобальной переменной
    const slug = FARM_SLUG;
    
    // Элементы DOM
    const farmName = document.getElementById('farmName');
    const farmDescription = document.getElementById('farmDescription');
    const farmAddress = document.getElementById('farmAddress');
    const farmOwnerName = document.getElementById('farmOwnerName');
    const farmOwnerPhone = document.getElementById('farmOwnerPhone');
    const farmOwnerEmail = document.getElementById('farmOwnerEmail');
    const farmCreatedAt = document.getElementById('farmCreatedAt');
    const farmUpdatedAt = document.getElementById('farmUpdatedAt');
    const farmUsersList = document.getElementById('farmUsersList');

    // Элементы DOM для родительской организации
    const orgName = document.getElementById('orgName');
    const orgDescription = document.getElementById('orgDescription');
    const orgAddress = document.getElementById('orgAddress');
    const orgType = document.getElementById('orgType');

    // Загрузка данных фермы
    function loadFarmData() {
        fetch(`/api/v1/farm/?slug=${slug}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных');
            }
            return response.json();
        })
        .then(data => {
            updateFields(data);
            // После загрузки данных фермы загружаем данные родительской организации и пользователей
            loadParentOrganizationData();
            loadFarmUsers();
        })
        .catch(error => {
            console.error('Error:', error);
            showGlobalError('Не удалось загрузить данные фермы');
        });
    }

    // Загрузка данных родительской организации
    function loadParentOrganizationData() {
        fetch(`/api/v1/farm_ext_org/?slug=${slug}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных организации');
            }
            return response.json();
        })
        .then(data => {
            updateOrganizationFields(data);
        })
        .catch(error => {
            console.error('Error:', error);
            showGlobalError('Не удалось загрузить данные организации');
        });
    }

    // Загрузка пользователей фермы
    function loadFarmUsers() {
        fetch(`/api/v1/farm_users/?slug=${slug}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки пользователей');
            }
            return response.json();
        })
        .then(users => {
            updateUsersList(users);
        })
        .catch(error => {
            console.error('Error:', error);
            showGlobalError('Не удалось загрузить список пользователей');
        });
    }

    // Обновление полей данными фермы
    function updateFields(data) {
        // Основные поля
        const fields = {
            'farmName': data.name,
            'farmDescription': data.description || 'Нет описания',
            'farmAddress': data.address || 'Адрес не указан',
            'farmOwnerName': data.owner?.user_full_name || 'Владелец не указан',
            'farmOwnerPhone': data.owner?.phone_number || 'Телефон не указан',
            'farmOwnerEmail': data.owner?.email || 'Email не указан',
            'farmCreatedAt': formatDate(data.created_at),
            'farmUpdatedAt': formatDate(data.updated_at)
        };

        // Обновляем только существующие поля
        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // Обновление полей данными организации
    function updateOrganizationFields(data) {
        const fields = {
            'orgName': data.name,
            'orgDescription': data.description || 'Нет описания',
            'orgAddress': data.address || 'Адрес не указан',
            'orgType': getOrganizationTypeName(data.type)
        };

        // Обновляем только существующие поля
        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // --- Карточка пользователя как на странице организации ---
    function createUserCard(user, index) {
        const roleIcons = {
            'admin': 'fas fa-user-shield',
            'technician': 'fas fa-tools',
            'viewer': 'fas fa-eye'
        };
        const roleNames = {
            'admin': 'Администратор',
            'technician': 'Техник',
            'viewer': 'Наблюдатель'
        };
        const isCurrentUser = (typeof CURRENT_USER_EMAIL !== 'undefined') && user.user.email === CURRENT_USER_EMAIL;
        const isFirstCard = index === 0 && isCurrentUser;
        return `
            <div class="user-card ${isFirstCard ? 'current-user' : ''}" data-user-id="${user.id}">
                <div class="user-info">
                    <div class="user-name">
                        <i class="fas fa-user"></i>
                        ${user.user.user_full_name}
                    </div>
                    <div class="user-badges">
                        <div class="badge-container">
                            <span class="farm-role role-${user.role}" data-role="${user.role}">
                                <i class="${roleIcons[user.role] || 'fas fa-user'}"></i>
                                <span class="role-label">${roleNames[user.role] || 'Неизвестная роль'}</span>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="user-contacts">
                    <span><i class="fas fa-envelope"></i> ${user.user.email}</span>
                    <span><i class="fas fa-phone"></i> ${user.user.phone_number}</span>
                </div>
                <div class="user-meta">
                    <i class="fas fa-clock"></i>
                    <span>Обновлено: ${formatDate(user.updated_at)}</span>
                </div>
            </div>
        `;
    }

    // Обновление списка пользователей
    function updateUsersList(users) {
        if (!farmUsersList) return;
        if (users.length === 0) {
            farmUsersList.innerHTML = '<div class="no-data">Нет пользователей</div>';
            return;
        }
        farmUsersList.innerHTML = users.map(createUserCard).join('');
    }

    // Получение иконки для роли
    function getRoleIcon(role) {
        const icons = {
            'admin': 'fa-user-shield',
            'technician': 'fa-tools',
            'viewer': 'fa-eye'
        };
        return icons[role] || 'fa-user';
    }

    // Получение названия роли
    function getRoleName(role) {
        const names = {
            'admin': 'Администратор',
            'technician': 'Техник',
            'viewer': 'Наблюдатель'
        };
        return names[role] || 'Неизвестная роль';
    }

    // Получение названия типа организации
    function getOrganizationTypeName(type) {
        const types = {
            'government': 'Государственная',
            'private': 'Частная',
            'municipal': 'Муниципальная'
        };
        return types[type] || 'Неизвестный тип';
    }

    // Вспомогательные функции
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        
        // Если дата уже в нужном формате (DD.MM.YYYY HH:mm), возвращаем её как есть
        if (dateString.match(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/)) {
            return dateString;
        }

        // Для других форматов пытаемся преобразовать
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Некорректная дата';

        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Функция для показа глобальных ошибок
    function showGlobalError(message) {
        let toast = document.getElementById('globalErrorToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'globalErrorToast';
            toast.className = 'global-error-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
    }

    // Загружаем данные при загрузке страницы
    loadFarmData();

    // Обработка кликов по бейджам
    const badges = document.querySelectorAll('.detail-badge');
    
    badges.forEach(badge => {
        badge.addEventListener('click', function() {
            // Закрываем все остальные бейджи
            badges.forEach(b => {
                if (b !== badge) {
                    b.classList.remove('expanded');
                }
            });
            
            // Переключаем текущий бейдж
            badge.classList.toggle('expanded');
        });
    });

    // Добавляю обработчик для раскрытия бейджа роли
    document.addEventListener('click', function(e) {
        const badge = e.target.closest('.farm-role');
        if (badge) {
            document.querySelectorAll('.farm-role.expanded').forEach(b => {
                if (b !== badge) b.classList.remove('expanded');
            });
            badge.classList.toggle('expanded');
        }
    });
}); 
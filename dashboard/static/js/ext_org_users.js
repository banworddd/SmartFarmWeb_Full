let editingUserId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Константы для иконок и названий
    const roleIcons = {
        'admin': 'fas fa-user-shield',
        'manager': 'fas fa-user-cog',
        'member': 'fas fa-user',
        'guest': 'fas fa-user-tag'
    };

    const roleNames = {
        'admin': 'Администратор',
        'manager': 'Менеджер',
        'member': 'Сотрудник',
        'guest': 'Гость'
    };

    const statusIcons = {
        'approved': 'fas fa-check-circle',
        'pending': 'fas fa-hourglass-half',
        'rejected': 'fas fa-times-circle'
    };

    const statusNames = {
        'approved': 'Одобрено',
        'pending': 'В ожидании',
        'rejected': 'Отклонено'
    };

    // Возможные значения ролей и статусов
    const roleOptions = [
        { value: 'admin', label: 'Администратор' },
        { value: 'manager', label: 'Менеджер' },
        { value: 'member', label: 'Сотрудник' },
        { value: 'guest', label: 'Гость' }
    ];
    const statusOptions = [
        { value: 'approved', label: 'Одобрено' },
        { value: 'pending', label: 'В ожидании' },
        { value: 'rejected', label: 'Отклонено' }
    ];

    // DOM элементы
    const usersList = document.getElementById('usersList');

    // Вспомогательные функции
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

    const formatDate = dateString => {
        if (!dateString) return '';
        if (dateString.match(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/)) {
            return dateString;
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Некорректная дата';
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const showGlobalError = message => {
        let toast = document.getElementById('globalErrorToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'globalErrorToast';
            toast.className = 'global-error-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 5000);
    };

    let currentOrdering = '';

    // Загрузка пользователей организации
    const loadOrganizationUsers = () => {
        const roleFilter = document.getElementById('userRoleFilter')?.value;
        const statusFilter = document.getElementById('userStatusFilter')?.value;
        const nameFilter = document.getElementById('userNameFilter')?.value;

        let url = `/api/v1/ext_org/users/?organization=${ORGANIZATION_SLUG}`;
        if (roleFilter) url += `&role=${roleFilter}`;
        if (statusFilter) url += `&status=${statusFilter}`;
        if (nameFilter) url += `&user_name=${nameFilter}`;
        if (currentOrdering) url += `&ordering=${currentOrdering}`;

        // Сначала получаем текущего пользователя
        fetch(`/api/v1/ext_org/request_user/?organization=${ORGANIZATION_SLUG}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(currentUser => {
            // Затем получаем остальных пользователей
            fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'include'
            })
            .then(response => response.json())
            .then(users => {
                if (!usersList) return;
                let html = '';
                if (currentUser && currentUser.id) {
                    html += `<div class="current-user-card">${createUserCard(currentUser)}</div>`;
                }
                html += users.length ? 
                    users.map(user => createUserCard(user)).join('') :
                    createUserCard('empty');
                usersList.innerHTML = html;
            })
            .catch(error => {
                console.error('Error:', error);
                if (usersList) {
                    usersList.innerHTML = createUserCard('empty');
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    // Создание карточки пользователя
    const createUserCard = user => {
        if (user === 'empty') {
            return `
                <div class="farm-card empty-state-card">
                    <div class="farm-user-center">
                        <i class="fas fa-users empty-state-icon"></i>
                        <div class="user-names">
                            <span class="user-first-name" style="display:block;width:100%;">Нет пользователей</span>
                            <span class="user-last-name" style="display:block;width:100%;">Попробуйте изменить параметры фильтрации</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const fullName = `${user.user.first_name || ''} ${user.user.last_name || ''}`.trim();
        const isAdminOrManager = USER_ROLE === 'admin' || USER_ROLE === 'manager';
        const isEditing = editingUserId == user.id;
        
        // --- Кнопка редактирования ---
        const editBtn = isAdminOrManager && !isEditing ? `
            <button class="edit-membership-btn" data-user-id="${user.id}" title="Редактировать роль и статус" style="position:absolute;top:10px;right:10px;z-index:3;">
                <i class="fas fa-pencil-alt"></i>
            </button>
        ` : '';

        // --- Бейджи или селекты ---
        let badgesHtml;
        if (isEditing) {
            badgesHtml = `
                <div class="edit-badges-row">
                  <select class="edit-select" name="role">
                      ${roleOptions.map(opt => `<option value="${opt.value}"${user.role === opt.value ? ' selected' : ''}>${opt.label}</option>`).join('')}
                  </select>
                  <select class="edit-select" name="status">
                      ${statusOptions.map(opt => `<option value="${opt.value}"${user.status === opt.value ? ' selected' : ''}>${opt.label}</option>`).join('')}
                  </select>
                </div>
                <div class="edit-badges-actions" style="position:absolute;top:10px;right:10px;z-index:3;">
                  <button class="save-edit-membership-btn" data-user-id="${user.id}" title="Сохранить"><i class="fas fa-check"></i></button>
                  <button class="cancel-edit-membership-btn" data-user-id="${user.id}" title="Отмена"><i class="fas fa-times"></i></button>
                </div>
            `;
        } else {
            badgesHtml = `
                <span class="farm-role badge-toggle role-${user.role}">
                    <i class="${roleIcons[user.role] || 'fas fa-user'}"></i>
                    <span class="role-label">${roleNames[user.role] || user.role}</span>
                </span>
                <span class="farm-status badge-toggle status-${user.status}">
                    <i class="${statusIcons[user.status] || 'fas fa-info-circle'}"></i>
                    <span class="status-label">${statusNames[user.status] || user.status}</span>
                </span>
            `;
        }

        return `
            <div class="farm-card" style="position:relative;">
                ${editBtn}
                <div class="farm-user-center">
                    <img src="${user.user.profile_pic || ''}" alt="${fullName}" class="user-avatar">
                    <div class="user-names">
                        <span class="user-first-name">${user.user.first_name || ''}</span>
                        <span class="user-last-name">${user.user.last_name || ''}</span>
                    </div>
                </div>
                <div class="farm-divider"></div>
                <div class="farm-badges">${badgesHtml}</div>
                <div class="farm-divider"></div>
                <div class="farm-meta">
                    <span><i class="fas fa-clock"></i> Обновлено: ${formatDate(user.updated_at)}</span>
                    ${isAdminOrManager && user.user.email ? `<span><i class="fas fa-envelope"></i> ${user.user.email}</span>` : ''}
                    ${isAdminOrManager && user.user.phone_number ? `<span><i class="fas fa-phone"></i> ${user.user.phone_number}</span>` : ''}
                </div>
            </div>
        `;
    };

    // Обработчики событий
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Инициализация обработчиков
    const initEventListeners = () => {
        const userRoleFilter = document.getElementById('userRoleFilter');
        const userStatusFilter = document.getElementById('userStatusFilter');
        const userNameFilter = document.getElementById('userNameFilter');

        if (userRoleFilter) {
            userRoleFilter.addEventListener('change', loadOrganizationUsers);
        }
        if (userStatusFilter) {
            userStatusFilter.addEventListener('change', loadOrganizationUsers);
        }
        if (userNameFilter) {
            userNameFilter.addEventListener('input', debounce(loadOrganizationUsers, 300));
        }

        // Обработка кликов по бейджам только внутри usersList
        if (usersList) {
            // Удаляем старый обработчик, если он есть
            usersList.removeEventListener('click', handleBadgeClick);
            
            // Создаем отдельную функцию для обработчика
            function handleBadgeClick(e) {
                // Проверяем, кликнули ли мы по бейджу или его дочернему элементу
                const badge = e.target.closest('.farm-role, .farm-status, .farm-type');
                
                if (badge) {
                    e.preventDefault();
                    e.stopPropagation();
                    badge.classList.toggle('expanded');
                }
            }
            
            // Добавляем новый обработчик
            usersList.addEventListener('click', handleBadgeClick);
        } else {
            console.error('usersList element not found!');
        }

        document.querySelectorAll('.sort-badge').forEach(badge => {
            badge.addEventListener('click', e => {
                if (!e.target.closest('.sort-arrow')) {
                    badge.classList.toggle('expanded');
                }
            });
            badge.querySelectorAll('.sort-arrow').forEach(arrow => {
                arrow.addEventListener('click', e => {
                    e.stopPropagation();
                    document.querySelectorAll('.sort-arrow').forEach(a => a.classList.remove('active'));
                    arrow.classList.add('active');
                    const sortField = badge.dataset.sort;
                    const direction = arrow.dataset.direction;
                    currentOrdering = direction === 'desc' ? `-${sortField}` : sortField;
                    loadOrganizationUsers();
                });
            });
        });
    };

    // --- Обработчики событий для редактирования ---
    document.addEventListener('click', function(e) {
        // Клик по карандашику
        const editBtn = e.target.closest('.edit-membership-btn');
        if (editBtn) {
            editingUserId = editBtn.dataset.userId;
            loadOrganizationUsers();
            return;
        }
        // Клик по отмене
        const cancelBtn = e.target.closest('.cancel-edit-membership-btn');
        if (cancelBtn) {
            editingUserId = null;
            loadOrganizationUsers();
            return;
        }
        // Клик по сохранению
        const saveBtn = e.target.closest('.save-edit-membership-btn');
        if (saveBtn) {
            const card = saveBtn.closest('.farm-card');
            const userId = saveBtn.dataset.userId;
            const role = card.querySelector('select[name="role"]').value;
            const status = card.querySelector('select[name="status"]').value;
            saveMembershipEdit(userId, role, status);
            return;
        }
    });

    // --- PATCH-запрос к API ---
    function saveMembershipEdit(userId, role, status) {
        fetch(`/api/v1/ext_org/user/?organization=${ORGANIZATION_SLUG}&id=${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include',
            body: JSON.stringify({ role, status })
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сохранения');
            return response.json();
        })
        .then(() => {
            editingUserId = null;
            loadOrganizationUsers();
        })
        .catch(error => {
            showGlobalError(error.message || 'Ошибка сохранения');
        });
    }

    // Инициализация
    if (document.getElementById('usersList')) {
        loadOrganizationUsers();
        initEventListeners();
    }
}); 
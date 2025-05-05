let globalErrorToastTimeout = null;
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

document.addEventListener('DOMContentLoaded', function() {
    // Используем slug из глобальной переменной
    const slug = ORGANIZATION_SLUG;
    
    // Элементы DOM
    const orgName = document.getElementById('orgName');
    const orgType = document.getElementById('orgType');
    const orgDescription = document.getElementById('orgDescription');
    const orgAddress = document.getElementById('orgAddress');
    const orgEmail = document.getElementById('orgEmail');
    const orgPhone = document.getElementById('orgPhone');
    const orgWebsite = document.getElementById('orgWebsite');
    const orgCreatedAt = document.getElementById('orgCreatedAt');
    const orgUpdatedAt = document.getElementById('orgUpdatedAt');
    const editOrgBtn = document.getElementById('editOrgBtn');
    const editOrgModal = document.getElementById('editOrgModal');
    const closeModal = document.querySelector('.close-modal');
    const editOrgForm = document.getElementById('editOrgForm');

    // Элементы фильтров пользователей
    const userRoleFilter = document.getElementById('userRoleFilter');
    const userStatusFilter = document.getElementById('userStatusFilter');
    const userNameFilter = document.getElementById('userNameFilter');
    const usersList = document.getElementById('usersList');

    // Если пользователь админ, добавляем возможность редактирования
    if (CURRENT_USER_ROLE === 'admin') {
        addEditCapabilities();
    }

    // Загрузка данных организации
    function loadOrganizationData() {
        fetch(`/api/v1/external_organization/?slug=${slug}`, {
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
        })
        .catch(error => {
            console.error('Error:', error);
            showGlobalError('Не удалось загрузить данные организации');
        });
    }

    // Добавление возможности редактирования для администраторов
    function addEditCapabilities() {
        // Добавляем обработчики для бейджей
        document.addEventListener('click', function(e) {
            const roleBadge = e.target.closest('.user-role');
            const statusBadge = e.target.closest('.user-status');
            
            // Удалить или закомментировать:
            // if (roleBadge) {
            //     const userId = roleBadge.closest('.user-card').dataset.userId;
            //     const currentRole = roleBadge.dataset.role;
            //     showRoleEditModal(userId, currentRole);
            // }
            // if (statusBadge) {
            //     const userId = statusBadge.closest('.user-card').dataset.userId;
            //     const currentStatus = statusBadge.dataset.status;
            //     showStatusEditModal(userId, currentStatus);
            // }
        });
    }

    // Обновление роли пользователя
    window.updateUserRole = function(userId) {
        const editForm = document.querySelector(`.user-card[data-user-id="${userId}"] .edit-form`);
        const newRole = editForm.querySelector('.edit-select').value;
        
        fetch(`/api/v1/external_organization_user/?organization=${slug}&id=${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ role: newRole }),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка обновления роли');
            return response.json();
        })
        .then(() => {
            loadOrganizationUsers();
            showSuccess('Роль пользователя успешно обновлена');
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Не удалось обновить роль пользователя');
            cancelEdit(editForm.querySelector('.cancel-edit'));
        });
    };

    // Обновление статуса пользователя
    window.updateUserStatus = function(userId) {
        const editForm = document.querySelector(`.user-card[data-user-id="${userId}"] .edit-form`);
        const newStatus = editForm.querySelector('.edit-select').value;
        
        fetch(`/api/v1/external_organization_user/?organization=${slug}&id=${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ status: newStatus }),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка обновления статуса');
            return response.json();
        })
        .then(() => {
            loadOrganizationUsers();
            showSuccess('Статус пользователя успешно обновлен');
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Не удалось обновить статус пользователя');
            cancelEdit(editForm.querySelector('.cancel-edit'));
        });
    };

    // Обновление полей данными
    function updateFields(data) {
        document.getElementById('orgName').textContent = data.name;
        document.getElementById('orgType').textContent = getOrganizationTypeName(data.type);
        document.getElementById('orgDescription').textContent = data.description || 'Нет описания';
        document.getElementById('orgAddress').textContent = data.address || 'Адрес не указан';
        document.getElementById('orgEmail').textContent = data.email || 'Email не указан';
        document.getElementById('orgPhone').textContent = data.phone || 'Телефон не указан';
        document.getElementById('orgWebsite').textContent = data.website || 'Веб-сайт не указан';
        document.getElementById('orgCreatedAt').textContent = formatDate(data.created_at);
        document.getElementById('orgUpdatedAt').textContent = formatDate(data.updated_at);
    }

    // Управление модальным окном
    function showModal() {
        editOrgModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        editOrgModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Обработка отправки формы
    editOrgForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('editOrgName').value,
            type: document.getElementById('editOrgType').value,
            address: document.getElementById('editOrgAddress').value,
            email: document.getElementById('editOrgEmail').value,
            phone: document.getElementById('editOrgPhone').value,
            website: document.getElementById('editOrgWebsite').value,
            description: document.getElementById('editOrgDescription').value
        };

        fetch(`/api/v1/external_organization/?slug=${slug}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(formData),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка сохранения данных');
            }
            return response.json();
        })
        .then(data => {
            hideModal();
            loadOrganizationData();
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Не удалось сохранить изменения');
        });
    });

    // Обработка редактирования полей
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const targetId = this.dataset.target;
            const field = document.getElementById(targetId);
            const fieldName = field.dataset.field;
            const detailItem = field.closest('.detail-item');
            
            // Если поле уже в режиме редактирования, выходим
            if (detailItem.classList.contains('editing')) return;
            
            // Сохраняем текущее значение
            const oldText = field.textContent;
            
            // Создаем input для редактирования
            const input = document.createElement(fieldName === 'description' ? 'textarea' : 'input');
            input.className = 'editable-input';
            input.value = oldText;
            
            if (fieldName === 'type') {
                // Для типа организации создаем select
                const select = document.createElement('select');
                select.className = 'editable-input';
                const options = {
                    'supplier': 'Поставщик',
                    'partner': 'Партнер',
                    'government': 'Государственная',
                    'other': 'Другое'
                };
                Object.entries(options).forEach(([value, text]) => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = text;
                    option.selected = text === oldText;
                    select.appendChild(option);
                });
                input = select;
            }
            
            // Создаем кнопки действий
            const actions = document.createElement('div');
            actions.className = 'editable-actions';
            
            const saveBtn = document.createElement('button');
            saveBtn.className = 'save-btn';
            saveBtn.innerHTML = '<i class="fas fa-check"></i>';
            
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'cancel-btn';
            cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
            
            actions.appendChild(saveBtn);
            actions.appendChild(cancelBtn);
            
            // Обработчик крестика — по аналогии с user_profile.js
            cancelBtn.addEventListener('click', function() {
                field.textContent = oldText;
                detailItem.classList.remove('editing');
                actions.remove();
                input.remove();
                if (this.closest('.edit-btn')) this.closest('.edit-btn').style.display = '';
            });
            
            // Функция сохранения изменений
            function saveEdit() {
                const newValue = input.value;
                
                fetch(`/api/v1/external_organization/?slug=${slug}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        [fieldName]: newValue
                    }),
                    credentials: 'include'
                })
                .then(async response => {
                    const data = await response.json();
                    if (!response.ok) {
                        console.log('API PATCH error response:', data);
                        let errorMsg = '';
                        if (typeof data === 'object' && data !== null) {
                            // Если ошибка в конкретном поле (например, {email: ["..."]})
                            if (Object.keys(data).length === 1) {
                                const fieldErrors = Object.values(data)[0];
                                errorMsg = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
                            } else {
                                // Если несколько ошибок
                                errorMsg = Object.entries(data)
                                    .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors[0] : errors}`)
                                    .join('\n');
                            }
                        } else {
                            errorMsg = data.detail || JSON.stringify(data);
                        }
                        showGlobalError(errorMsg);
                        return;
                    }
                    field.textContent = fieldName === 'type' ? 
                        getOrganizationTypeName(newValue) : newValue;
                    detailItem.classList.remove('editing');
                    actions.remove();
                    input.remove();
                })
                .catch(error => {
                    console.error('Error:', error);
                    showGlobalError('Не удалось сохранить изменения: ' + (error.message || error));
                    cancelEdit();
                });
            }
            
            // Добавляем обработчики событий
            saveBtn.addEventListener('click', saveEdit);
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                }
            });
            input.addEventListener('keyup', function(e) {
                if (e.key === 'Escape') {
                    cancelEdit();
                }
            });
            
            // Заменяем текст на input
            field.textContent = '';
            detailItem.classList.add('editing');
            field.appendChild(input);
            field.parentNode.insertBefore(actions, field.nextSibling);
            
            // Фокусируемся на input
            input.focus();
        });
    });

    // Обработчики событий
    if (editOrgBtn) {
        editOrgBtn.addEventListener('click', showModal);
    }
    closeModal.addEventListener('click', hideModal);
    window.addEventListener('click', function(e) {
        if (e.target === editOrgModal) hideModal();
    });

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

    function getOrganizationTypeName(type) {
        const types = {
            'supplier': 'Поставщик',
            'partner': 'Партнер',
            'government': 'Государственная',
            'other': 'Другое'
        };
        return types[type] || type;
    }

    // Функция для показа уведомления об успехе
    function showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Функция для показа ошибок — только через showGlobalError
    function showError(message) {
        showGlobalError(message);
    }

    // Загружаем данные при загрузке страницы
    loadOrganizationData();

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

    // Загрузка пользователей организации
    function loadOrganizationUsers() {
        const roleFilter = userRoleFilter.value;
        const statusFilter = userStatusFilter.value;
        const nameFilter = userNameFilter.value;

        let url = `/api/v1/external_organization_users/?organization=${slug}`;
        if (roleFilter) url += `&role=${roleFilter}`;
        if (statusFilter) url += `&status=${statusFilter}`;
        if (nameFilter) url += `&user_name=${nameFilter}`;

        fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(users => {
            usersList.innerHTML = users.length ? 
                users.map((user, index) => createUserCard(user, index)).join('') :
                '<div class="empty-state">Нет пользователей, соответствующих фильтрам</div>';
        })
        .catch(error => {
            console.error('Error:', error);
            usersList.innerHTML = '<div class="error-state">Не удалось загрузить список пользователей</div>';
        });
    }

    // Создание карточки пользователя
    function createUserCard(user, index) {
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
            'rejected': 'fas fa-times'
        };

        const statusNames = {
            'approved': 'Одобрено',
            'pending': 'В ожидании',
            'rejected': 'Отклонено'
        };

        const isCurrentUser = user.user.email === CURRENT_USER_EMAIL;
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
                            <span class="user-role role-${user.role}" data-role="${user.role}">
                                <i class="${roleIcons[user.role] || 'fas fa-user'}"></i>
                                <span class="role-label">${roleNames[user.role] || user.role}</span>
                            </span>
                            ${CURRENT_USER_ROLE === 'admin' ? `
                                <div class="edit-controls">
                                    <button class="edit-btn" onclick="showRoleEdit(${user.id}, '${user.role}')">
                                        <i class="fas fa-pencil-alt"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                        <div class="badge-container">
                            <span class="user-status status-${user.status}" data-status="${user.status}">
                                <i class="${statusIcons[user.status] || 'fas fa-circle'}"></i>
                                <span class="status-label">${statusNames[user.status] || user.status}</span>
                            </span>
                            ${CURRENT_USER_ROLE === 'admin' ? `
                                <div class="edit-controls">
                                    <button class="edit-btn" onclick="showStatusEdit(${user.id}, '${user.status}')">
                                        <i class="fas fa-pencil-alt"></i>
                                    </button>
                                </div>
                            ` : ''}
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

    // Показ редактирования роли
    window.showRoleEdit = function(userId, currentRole) {
        const badgeContainer = document.querySelector(`.user-card[data-user-id="${userId}"] .user-role`).parentElement;
        const currentBadge = badgeContainer.querySelector('.user-role');
        
        const editControls = badgeContainer.querySelector('.edit-controls');
        editControls.style.display = 'none';
        
        const editForm = document.createElement('div');
        editForm.className = 'edit-form';
        editForm.innerHTML = `
            <select class="edit-select">
                <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>Администратор</option>
                <option value="manager" ${currentRole === 'manager' ? 'selected' : ''}>Менеджер</option>
                <option value="member" ${currentRole === 'member' ? 'selected' : ''}>Сотрудник</option>
                <option value="guest" ${currentRole === 'guest' ? 'selected' : ''}>Гость</option>
            </select>
            <button class="save-edit" onclick="updateUserRole(${userId})">
                <i class="fas fa-check"></i>
            </button>
            <button class="cancel-edit" onclick="cancelEdit(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        currentBadge.style.display = 'none';
        badgeContainer.appendChild(editForm);
    };

    // Показ редактирования статуса
    window.showStatusEdit = function(userId, currentStatus) {
        const badgeContainer = document.querySelector(`.user-card[data-user-id="${userId}"] .user-status`).parentElement;
        const currentBadge = badgeContainer.querySelector('.user-status');
        
        const editControls = badgeContainer.querySelector('.edit-controls');
        editControls.style.display = 'none';
        
        const editForm = document.createElement('div');
        editForm.className = 'edit-form';
        editForm.innerHTML = `
            <select class="edit-select">
                <option value="approved" ${currentStatus === 'approved' ? 'selected' : ''}>Одобрено</option>
                <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>В ожидании</option>
                <option value="rejected" ${currentStatus === 'rejected' ? 'selected' : ''}>Отклонено</option>
            </select>
            <button class="save-edit" onclick="updateUserStatus(${userId})">
                <i class="fas fa-check"></i>
            </button>
            <button class="cancel-edit" onclick="cancelEdit(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        currentBadge.style.display = 'none';
        badgeContainer.appendChild(editForm);
    };

    // Обработчики фильтров
    userRoleFilter.addEventListener('change', loadOrganizationUsers);
    userStatusFilter.addEventListener('change', loadOrganizationUsers);
    userNameFilter.addEventListener('input', debounce(loadOrganizationUsers, 300));

    // Загружаем пользователей при загрузке страницы
    loadOrganizationUsers();

    // Обработка кликов по бейджам пользователей
    document.addEventListener('click', function(e) {
        if (e.target.closest('.user-role') || e.target.closest('.user-status')) {
            const badge = e.target.closest('.user-role') || e.target.closest('.user-status');
            
            // Закрываем все остальные бейджи того же типа
            const type = badge.classList.contains('user-role') ? 'user-role' : 'user-status';
            document.querySelectorAll(`.${type}`).forEach(b => {
                if (b !== badge) {
                    b.classList.remove('expanded');
                }
            });
            
            // Переключаем текущий бейдж
            badge.classList.toggle('expanded');
        }
    });

    // Добавляем обработчик для поиска по имени
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});

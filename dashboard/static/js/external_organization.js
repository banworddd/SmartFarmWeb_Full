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
            showError('Не удалось загрузить данные организации');
        });
    }

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
            const currentValue = field.textContent;
            
            // Создаем input для редактирования
            const input = document.createElement(fieldName === 'description' ? 'textarea' : 'input');
            input.className = 'editable-input';
            input.value = currentValue;
            
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
                    option.selected = text === currentValue;
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
            
            // Функция отмены редактирования
            function cancelEdit() {
                field.textContent = currentValue;
                detailItem.classList.remove('editing');
                actions.remove();
                input.remove();
            }
            
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
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Ошибка сохранения');
                    }
                    return response.json();
                })
                .then(data => {
                    field.textContent = fieldName === 'type' ? 
                        getOrganizationTypeName(newValue) : newValue;
                    detailItem.classList.remove('editing');
                    actions.remove();
                    input.remove();
                })
                .catch(error => {
                    console.error('Error:', error);
                    showError('Не удалось сохранить изменения');
                    cancelEdit();
                });
            }
            
            // Добавляем обработчики событий
            saveBtn.addEventListener('click', saveEdit);
            cancelBtn.addEventListener('click', cancelEdit);
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
            detailItem.insertBefore(actions, detailItem.firstChild);
            
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
        const date = new Date(dateString);
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

    function showError(message) {
        // Здесь можно добавить отображение ошибки
        console.error(message);
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
});

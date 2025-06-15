document.addEventListener('DOMContentLoaded', () => {
    // === Константы и сопоставления ===
    const fieldApiMap = {
        farmNameValue: 'name',
        farmSlugValue: 'slug',
        farmDescriptionValue: 'description',
        farmCreatedAtValue: 'created_at',
        farmUpdatedAtValue: 'updated_at'
    };

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

    // === Редактирование ===
    const createEditField = (field, value) => {
        const div = document.createElement('div');
        div.contentEditable = 'true';
        div.className = 'edit-input';
        div.dataset.field = field;
        div.innerText = value;
        return div;
    };

    const saveField = async (field, value) => {
        try {
            const body = { [field]: value };
            const response = await fetch(`/api/v1/farm/main_data/?slug=${FARM_SLUG}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) {
                const error = new Error('Ошибка сохранения');
                error.responseData = data;
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    };

    const handleEditClick = (button) => {
        const field = button.dataset.target;
        const apiField = fieldApiMap[field];
        if (!apiField) {
            return;
        }
        const fieldElement = document.getElementById(field);
        const currentValue = fieldElement.textContent;
        const container = fieldElement.parentElement;
        container.classList.add('editing');
        const input = createEditField(field, currentValue);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'edit-error-message';
        errorDiv.style.display = 'none';
        errorDiv.style.marginBottom = '4px';
        container.insertBefore(errorDiv, fieldElement);
        const confirmButton = document.createElement('button');
        confirmButton.className = 'save-edit save-edit-membership-btn';
        confirmButton.innerHTML = '<i class="fas fa-check"></i>';
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-edit cancel-edit-membership-btn';
        cancelButton.innerHTML = '<i class="fas fa-times"></i>';
        button.style.display = 'none';
        fieldElement.style.display = 'none';
        container.appendChild(input);
        container.appendChild(confirmButton);
        container.appendChild(cancelButton);
        input.focus();

        const handleSave = async () => {
            try {
                const newValue = input.innerText.trim();
                if (newValue === currentValue) {
                    cancelEdit();
                    return;
                }
                const data = await saveField(apiField, newValue);
                fieldElement.textContent = newValue;
                cancelEdit();
            } catch (error) {
                let errorMsg = error.message || 'Ошибка сохранения';
                if (error.responseData && error.responseData[apiField] && Array.isArray(error.responseData[apiField])) {
                    errorMsg = error.responseData[apiField][0];
                }
                errorDiv.textContent = errorMsg;
                errorDiv.style.display = 'block';
                input.classList.add('edit-input-error');
            }
        };

        const cancelEdit = () => {
            input.remove();
            confirmButton.remove();
            cancelButton.remove();
            errorDiv.remove();
            button.style.display = '';
            fieldElement.style.display = '';
            container.classList.remove('editing');
        };

        input.addEventListener('input', () => {
            errorDiv.style.display = 'none';
            input.classList.remove('edit-input-error');
        });
        confirmButton.addEventListener('click', handleSave);
        cancelButton.addEventListener('click', cancelEdit);
        input.addEventListener('blur', handleSave);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
    };

    // === Загрузка данных фермы ===
    const loadFarmData = () => {
        fetch(`/api/v1/farm/main_data/?slug=${FARM_SLUG}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            return response.json();
        })
        .then(data => {
            document.title = `${data.name}`;
            
            // Обновляем основные поля
            const farmNameValue = document.getElementById('farmNameValue');
            if (farmNameValue) farmNameValue.textContent = data.name;
            
            const farmSlugValue = document.getElementById('farmSlugValue');
            if (farmSlugValue) farmSlugValue.textContent = data.slug;
            
            const farmDescriptionValue = document.getElementById('farmDescriptionValue');
            if (farmDescriptionValue) farmDescriptionValue.textContent = data.description || 'Нет описания';
            
            const farmCreatedAtValue = document.getElementById('farmCreatedAtValue');
            if (farmCreatedAtValue) farmCreatedAtValue.textContent = formatDate(data.created_at);
            
            const farmUpdatedAtValue = document.getElementById('farmUpdatedAtValue');
            if (farmUpdatedAtValue) farmUpdatedAtValue.textContent = formatDate(data.updated_at);

            // Настраиваем кнопки редактирования
            const isAdmin = USER_ROLE === 'admin';
            const editButtons = document.querySelectorAll('.edit-btn');
            editButtons.forEach(button => {
                button.style.display = isAdmin ? '' : 'none';
                if (isAdmin) {
                    button.addEventListener('click', () => handleEditClick(button));
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
            const errorMessage = 'Не удалось загрузить данные фермы';
            const elements = [
                'farmNameValue',
                'farmSlugValue',
                'farmDescriptionValue',
                'farmCreatedAtValue',
                'farmUpdatedAtValue'
            ];
            elements.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.textContent = errorMessage;
            });
        });
    };

    // === Раскрывающиеся бейджи (toggle) ===
    document.querySelectorAll('.badge-toggle').forEach(badge => {
        badge.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
        badge.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.classList.toggle('expanded');
            }
        });
    });

    // Загружаем данные при загрузке страницы
    if (document.getElementById('farmNameValue')) {
        loadFarmData();
    }
}); 
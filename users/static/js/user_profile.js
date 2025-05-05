document.addEventListener('DOMContentLoaded', function() {
    // Элементы страницы
    const profilePic = document.getElementById('profilePic');
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const dateJoined = document.getElementById('dateJoined');
    const status = document.getElementById('status');

    // Кнопки редактирования
    const editButtons = document.querySelectorAll('.edit-btn');

    // Элементы для загрузки аватарки
    const avatarBadge = document.querySelector('.avatar-badge');
    const avatarInput = document.getElementById('avatarInput');

    // Загрузка данных профиля
    async function loadProfileData() {
        try {
            const response = await fetch('/api/v1/custom_user_profile/');
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных профиля');
            }
            const data = await response.json();
            
            // Заполнение полей данными
            profilePic.src = data.profile_pic;
            firstName.textContent = data.first_name;
            lastName.textContent = data.last_name;
            email.textContent = data.email;
            phone.textContent = data.phone_number;
            dateJoined.textContent = data.date_joined;
            status.textContent = data.is_active ? 'Активен' : 'Неактивен';
        } catch (error) {
            console.error('Ошибка:', error);
            showError('Не удалось загрузить данные профиля');
        }
    }

    // Функция для отображения ошибки над полем
    function showFieldError(field, message) {
        // Удаляем старую ошибку, если есть
        const oldError = field.parentElement.querySelector('.field-error');
        if (oldError) oldError.remove();

        // Создаем элемент с ошибкой
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;

        // Вставляем ошибку перед полем
        field.parentElement.insertBefore(errorElement, field);

        // Добавляем класс ошибки к полю ввода
        if (field.classList.contains('editable-input')) {
            field.classList.add('error');
        }

        // Удаляем ошибку через 5 секунд
        setTimeout(() => {
            errorElement.remove();
            if (field.classList.contains('editable-input')) {
                field.classList.remove('error');
            }
        }, 5000);
    }

    // Функция для показа глобального всплывающего окна ошибок
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

    // Функция для обработки ошибок API
    function handleApiError(errorData, field) {
        // Если ошибка строка
        if (typeof errorData === 'string') {
            showGlobalError(errorData);
            return;
        }

        // Если ошибка массив
        if (Array.isArray(errorData)) {
            showGlobalError(errorData[0]);
            return;
        }

        // Если ошибка объект с message
        if (errorData.message) {
            showGlobalError(errorData.message);
            return;
        }

        // Если ошибка объект с полями (например, {first_name: ["..."]})
        if (typeof errorData === 'object') {
            let found = false;
            let globalMessages = [];
            Object.keys(errorData).forEach(key => {
                const msg = Array.isArray(errorData[key]) ? errorData[key][0] : errorData[key];
                globalMessages.push(msg);
                found = true;
            });
            if (found && globalMessages.length) {
                showGlobalError(globalMessages.join('\n'));
                return;
            }
        }

        // Если формат ошибки не распознан
        showGlobalError('Произошла ошибка при обновлении данных');
    }

    // Инлайн-редактирование поля
    function handleEdit(editableField, originalValue) {
        const container = editableField.closest('.editable-container');
        const detailItem = container.closest('.detail-item');
        if (detailItem.classList.contains('editing')) return;
        detailItem.classList.add('editing');

        // Скрыть карандаш
        const editBtn = container.querySelector('.edit-btn');
        if (editBtn) editBtn.style.display = 'none';

        // Сохраняем старый текст
        const oldText = editableField.textContent;
        // Очищаем editableField
        editableField.textContent = '';

        // Создаем input
        const input = document.createElement('input');
        input.className = 'editable-input';
        input.value = originalValue;
        input.type = editableField.dataset.field === 'email' ? 'email' : 
                    (editableField.dataset.field === 'phone_number' ? 'tel' : 'text');
        // Вставляем input внутрь editableField
        editableField.appendChild(input);

        // Кнопки
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
        // Вставляем actions после editableField (span), а не внутрь
        container.insertBefore(actions, editableField.nextSibling);

        input.focus();

        // Сохранение
        saveBtn.onclick = async () => {
            try {
                const response = await fetch('/api/v1/custom_user_profile/', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        [input.dataset.field || editableField.dataset.field]: input.value
                    })
                });

                const data = await response.json();
                console.log('API Response:', data);

                if (!response.ok) {
                    handleApiError(data, input);
                    return;
                }

                editableField.textContent = input.value;
                resetField();
            } catch (error) {
                showFieldError(input, 'Произошла ошибка при обновлении данных');
                editableField.textContent = oldText;
            }
        };

        // Отмена
        cancelBtn.onclick = () => {
            editableField.textContent = oldText;
            resetField();
        };

        // Enter/ESC
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveBtn.click();
            }
        });
        input.addEventListener('keyup', function(e) {
            if (e.key === 'Escape') {
                cancelBtn.click();
            }
        });

        function resetField() {
            detailItem.classList.remove('editing');
            // Удаляем .editable-actions
            const actions = container.querySelector('.editable-actions');
            if (actions) actions.remove();
            // Показываем карандаш обратно
            if (editBtn) editBtn.style.display = '';
        }
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

    function showError(message) {
        alert(message);
    }

    function showSuccess(message) {
        alert(message);
    }

    // Обработчики событий
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const editableField = button.closest('.editable-container').querySelector('.editable-field');
            handleEdit(editableField, editableField.textContent);
        });
    });

    // Обработчик клика по аватарке
    avatarBadge.addEventListener('click', () => {
        avatarInput.click();
    });

    // Обработчик выбора файла
    avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Проверяем размер файла (максимум 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showGlobalError('Размер файла не должен превышать 5MB');
            return;
        }

        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            showGlobalError('Пожалуйста, выберите изображение');
            return;
        }

        // Создаем FormData для отправки файла
        const formData = new FormData();
        formData.append('profile_pic', file);

        try {
            const response = await fetch('/api/v1/custom_user_profile/', {
                method: 'PATCH',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData
            });

            const data = await response.json();
            console.log('API Response:', data);

            if (!response.ok) {
                handleApiError(data, avatarInput);
                return;
            }

            profilePic.src = data.profile_pic;
        } catch (error) {
            showGlobalError('Произошла ошибка при загрузке файла');
        }
    });

    // Делегированная логика раскрытия бейджей (как в user_external_organizations.js)
    const orgDetails = document.querySelector('.organization-details');
    if (orgDetails) {
        orgDetails.addEventListener('click', function(e) {
            const badge = e.target.closest('.detail-badge, .user-role, .user-status');
            if (!badge) return;
            // Не раскрывать, если клик по кнопке редактирования
            if (e.target.closest('.edit-btn')) return;
            console.log('Clicked badge:', badge);
            // Закрыть все остальные
            orgDetails.querySelectorAll('.detail-badge.expanded, .user-role.expanded, .user-status.expanded').forEach(b => {
                if (b !== badge) b.classList.remove('expanded');
            });
            badge.classList.toggle('expanded');
        });
    }

    // Удаляем текстовые узлы между бейджем и editable-container (чтобы порядок DOM был как на organization)
    function cleanDetailItemWhitespace() {
        document.querySelectorAll('.detail-item').forEach(item => {
            const children = Array.from(item.childNodes);
            for (let i = 0; i < children.length - 1; i++) {
                if (
                    children[i].nodeType === Node.ELEMENT_NODE &&
                    children[i].classList.contains('detail-badge') &&
                    children[i+1].nodeType === Node.TEXT_NODE
                ) {
                    item.removeChild(children[i+1]);
                }
            }
        });
    }
    cleanDetailItemWhitespace();

    // Загрузка данных при открытии страницы
    loadProfileData();
}); 
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

    // === Смена пароля (инлайн-стиль) ===
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const cancelChangePassword = document.getElementById('cancelChangePassword');
    const passwordPlaceholder = document.getElementById('passwordPlaceholder');

    // Загрузка данных профиля
    async function loadProfileData() {
        try {
            const response = await fetch('/api/v1/profile/user_data/');
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных профиля');
            }
            const data = await response.json();
            
            // Заполнение полей данными
            profilePic.src = data.profile_pic || '/profile_pics/default.png';
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
            if (field && field.classList) {
                field.classList.add('error');
                setTimeout(() => field.classList.remove('error'), 5000);
            }
            showGlobalError(errorData);
            return;
        }

        // Если ошибка массив
        if (Array.isArray(errorData)) {
            if (field && field.classList) {
                field.classList.add('error');
                setTimeout(() => field.classList.remove('error'), 5000);
            }
            showGlobalError(errorData[0]);
            return;
        }

        // Если ошибка объект с message
        if (errorData.message) {
            if (field && field.classList) {
                field.classList.add('error');
                setTimeout(() => field.classList.remove('error'), 5000);
            }
            showGlobalError(errorData.message);
            return;
        }

        // Если ошибка объект с полями (например, {first_name: ["..."]})
        if (typeof errorData === 'object') {
            let found = false;
            let globalMessages = [];
            Object.keys(errorData).forEach(key => {
                // Найти поле на странице по data-field
                const input = document.querySelector(`[data-field="${key}"]`);
                if (input && input.classList) {
                    input.classList.add('error');
                    setTimeout(() => input.classList.remove('error'), 5000);
                }
                // Для аватарки
                if (key === 'profile_pic') {
                    const pic = document.getElementById('profilePic');
                    if (pic) {
                        pic.classList.add('error');
                        setTimeout(() => pic.classList.remove('error'), 5000);
                    }
                }
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
        if (field && field.classList) {
            field.classList.add('error');
            setTimeout(() => field.classList.remove('error'), 5000);
        }
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
                const response = await fetch('/api/v1/profile/user_data/', {
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

    // Обработчик клика по аватарке (только по картинке)
    profilePic.addEventListener('click', () => {
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
            const response = await fetch('/api/v1/profile/user_data/', {
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

    // Обработчик удаления аватарки
    const removeAvatarBtn = document.getElementById('removeAvatarBtn');
    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/v1/profile/user_data/', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({ profile_pic: null })
                });
                const data = await response.json();
                if (!response.ok) {
                    handleApiError(data, document.getElementById('profilePic'));
                    return;
                }
                profilePic.src = data.profile_pic;
                showGlobalError('Аватарка удалена');
            } catch (error) {
                showGlobalError('Не удалось удалить аватарку');
            }
        });
    }

    // Делегированная логика раскрытия бейджей (как в user_ext_orgs.js)
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

    // === Смена пароля (инлайн-стиль) ===
    if (changePasswordBtn && changePasswordForm && cancelChangePassword && passwordPlaceholder) {
        changePasswordBtn.addEventListener('click', function() {
            changePasswordForm.style.display = 'flex';
            changePasswordBtn.style.display = 'none';
            passwordPlaceholder.style.display = 'none';
        });
        cancelChangePassword.addEventListener('click', function() {
            changePasswordForm.style.display = 'none';
            changePasswordBtn.style.display = '';
            passwordPlaceholder.style.display = '';
            changePasswordForm.reset();
        });
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const currentPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword1').value;
            const newPasswordConfirmation = document.getElementById('newPassword2').value;

            // === JS-валидация пароля ===
            if (newPassword.length < 8) {
                showGlobalError('Пароль должен содержать минимум 8 символов');
                return;
            }
            if (!/[0-9]/.test(newPassword)) {
                showGlobalError('Пароль должен содержать хотя бы одну цифру');
                return;
            }
            if (!/[A-Z]/.test(newPassword)) {
                showGlobalError('Пароль должен содержать хотя бы одну заглавную букву');
                return;
            }
            if (!/[a-z]/.test(newPassword)) {
                showGlobalError('Пароль должен содержать хотя бы одну строчную букву');
                return;
            }
            if (newPassword !== newPasswordConfirmation) {
                showGlobalError('Пароли не совпадают');
                return;
            }

            try {
                const response = await fetch('/api/v1/profile/user_change_password/', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                        new_password_confirmation: newPasswordConfirmation
                    })
                });
                const data = await response.json();
                if (!response.ok) {
                    let errorMsg = '';
                    if (typeof data === 'object' && data !== null) {
                        if (data.detail) errorMsg = data.detail;
                        else errorMsg = Object.values(data).flat().join('\n');
                    } else {
                        errorMsg = 'Ошибка смены пароля';
                    }
                    showGlobalError(errorMsg);
                    return;
                }
                showGlobalError('Пароль успешно изменён');
                changePasswordForm.style.display = 'none';
                changePasswordBtn.style.display = '';
                passwordPlaceholder.style.display = '';
                changePasswordForm.reset();
            } catch (error) {
                showGlobalError('Ошибка соединения с сервером');
            }
        });
    }

    // === Глазик для показа/скрытия пароля ===
    document.querySelectorAll('#changePasswordForm .toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.closest('.password-wrapper').querySelector('input');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // === Динамическая полоска сложности пароля (только полоска, без текста) ===
    const newPasswordInput = document.getElementById('newPassword1');
    let strengthBar = null;
    if (newPasswordInput) {
        // Ищем .strength-bar после поля пароля
        strengthBar = newPasswordInput.closest('form').querySelector('.strength-bar');
    }
    if (newPasswordInput && strengthBar) {
        newPasswordInput.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);
            strengthBar.className = 'strength-bar';
            if (this.value.length === 0) {
                strengthBar.style.width = '0';
                strengthBar.style.background = '';
                return;
            }
            if (strength === 'weak') {
                strengthBar.style.width = '30%';
                strengthBar.style.background = '#e74c3c';
            } else if (strength === 'medium') {
                strengthBar.style.width = '60%';
                strengthBar.style.background = '#f39c12';
            } else {
                strengthBar.style.width = '100%';
                strengthBar.style.background = '#2ecc71';
            }
        });
    }

    // === Функция для проверки силы пароля (как в reg.js) ===
    function checkPasswordStrength(password) {
        if (password.length < 8) return 'weak';
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        let score = 0;
        if (hasUpper && hasLower) score += 2;
        if (hasNumber) score++;
        if (hasSpecial) score++;
        if (password.length >= 10) score++;
        if (score <= 2) return 'weak';
        if (score <= 4) return 'medium';
        return 'strong';
    }
}); 
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

    // === Смена пароля (модальное окно) ===
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
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

    // === Инлайн-редактирование для основных полей (как в ext_org) ===
    // Маппинг id поля -> имя поля в API
    const apiFieldMap = {
        firstName: 'first_name',
        lastName: 'last_name',
        email: 'email',
        phone: 'phone_number'
    };
    function handleEditClick(button) {
        const field = button.dataset.target;
        const apiField = apiFieldMap[field] || field;
        const fieldElement = document.getElementById(field);
        const currentValue = fieldElement.textContent;
        const container = fieldElement.parentElement;
        if (container.classList.contains('editing')) return;
        container.classList.add('editing');

        // Создаем элементы редактирования
        const input = document.createElement('div');
        input.contentEditable = 'true';
        input.className = 'edit-input';
        input.dataset.field = field;
        input.innerText = currentValue;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'edit-error-message';
        errorDiv.style.display = 'none';
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
                const url = '/api/v1/profile/user_data/';
                const body = JSON.stringify({ [apiField]: newValue });
                console.log('[PATCH] URL:', url);
                console.log('[PATCH] BODY:', body);
                const response = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body
                });
                const data = await response.json();
                console.log('[PATCH] STATUS:', response.status);
                console.log('[PATCH] RESPONSE:', data);
                if (!response.ok) {
                    let errorMsg = data.message || 'Ошибка сохранения';
                    if (data[apiField] && Array.isArray(data[apiField])) {
                        errorMsg = data[apiField][0];
                    } else if (typeof data === 'object') {
                        // Если ошибка валидации по другому полю
                        const firstKey = Object.keys(data)[0];
                        if (Array.isArray(data[firstKey])) {
                            errorMsg = data[firstKey][0];
                        }
                    }
                    errorDiv.textContent = errorMsg;
                    errorDiv.style.display = 'block';
                    input.classList.add('edit-input-error');
                    return;
                }
                fieldElement.textContent = newValue;
                cancelEdit();
            } catch (error) {
                errorDiv.textContent = 'Ошибка сохранения';
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
    }

    // Навесить обработчики на все org-field-edit.edit-btn
    document.querySelectorAll('.org-field-edit.edit-btn').forEach(button => {
        if (button.id === 'changePasswordBtn') {
            button.addEventListener('click', () => {
                document.getElementById('changePasswordModal').style.display = 'flex';
            });
        } else {
            button.addEventListener('click', () => handleEditClick(button));
        }
    });

    // === Раскрытие бейджей farm-type badge-toggle ===
    document.querySelectorAll('.farm-type.badge-toggle').forEach(badge => {
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

    // === Смена пароля (модальное окно) ===
    if (changePasswordForm) {
        changePasswordForm.setAttribute('novalidate', 'novalidate');
        ['oldPassword', 'newPassword1', 'newPassword2'].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.removeAttribute('required');
        });
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Очистить старые ошибки
            document.querySelectorAll('#changePasswordForm .edit-error-message').forEach(el => el.style.display = 'none');
            document.querySelectorAll('#changePasswordForm .edit-input').forEach(el => el.classList.remove('edit-input-error'));

            const oldPassword = document.getElementById('oldPassword');
            const newPassword1 = document.getElementById('newPassword1');
            const newPassword2 = document.getElementById('newPassword2');

            let hasError = false;
            // Проверка старого пароля
            if (!oldPassword.value) {
                showFieldErrorModal(oldPassword, 'Заполните это поле');
                hasError = true;
            }
            // Проверка нового пароля
            if (!newPassword1.value) {
                showFieldErrorModal(newPassword1, 'Заполните это поле');
                hasError = true;
            } else if (newPassword1.value.length < 8) {
                showFieldErrorModal(newPassword1, 'Пароль должен содержать минимум 8 символов');
                hasError = true;
            } else if (!/[0-9]/.test(newPassword1.value)) {
                showFieldErrorModal(newPassword1, 'Пароль должен содержать хотя бы одну цифру');
                hasError = true;
            } else if (!/[A-Z]/.test(newPassword1.value)) {
                showFieldErrorModal(newPassword1, 'Пароль должен содержать хотя бы одну заглавную букву');
                hasError = true;
            } else if (!/[a-z]/.test(newPassword1.value)) {
                showFieldErrorModal(newPassword1, 'Пароль должен содержать хотя бы одну строчную букву');
                hasError = true;
            }
            // Проверка подтверждения
            if (!newPassword2.value) {
                showFieldErrorModal(newPassword2, 'Заполните это поле');
                hasError = true;
            } else if (newPassword1.value !== newPassword2.value) {
                showFieldErrorModal(newPassword2, 'Пароли не совпадают');
                hasError = true;
            }
            if (hasError) return;

            try {
                const response = await fetch('/api/v1/profile/user_change_password/', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        current_password: oldPassword.value,
                        new_password: newPassword1.value,
                        new_password_confirmation: newPassword2.value
                    })
                });
                const data = await response.json();
                if (!response.ok) {
                    console.log('[PATCH] STATUS:', response.status);
                    console.log('[PATCH] BODY:', {
                        current_password: oldPassword.value,
                        new_password: newPassword1.value,
                        new_password_confirmation: newPassword2.value
                    });
                    console.log('[PATCH] RESPONSE:', data);

                    if (data.current_password) showFieldErrorModal(oldPassword, data.current_password[0]);
                    if (data.new_password) showFieldErrorModal(newPassword1, data.new_password[0]);
                    if (data.new_password_confirmation) showFieldErrorModal(newPassword2, data.new_password_confirmation[0]);
                    if (data.non_field_errors) showFieldErrorModal(oldPassword, data.non_field_errors[0]);
                    if (data.detail) showFieldErrorModal(oldPassword, data.detail);
                    return;
                }
                // Успех — закрыть модалку и сбросить форму
                document.getElementById('changePasswordModal').style.display = 'none';
                changePasswordForm.reset();
            } catch (error) {
                showFieldErrorModal(oldPassword, 'Ошибка соединения с сервером');
            }
        });

        // Найти все password inputs в форме смены пароля
        ['oldPassword', 'newPassword1', 'newPassword2'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                // Создать .field-block, если его нет
                let fieldBlock = input.closest('.field-block');
                if (!fieldBlock) {
                    fieldBlock = document.createElement('div');
                    fieldBlock.className = 'field-block';
                    // Найти label (предыдущий label)
                    const label = input.previousElementSibling && input.previousElementSibling.tagName === 'LABEL' ? input.previousElementSibling : null;
                    if (label) {
                        input.parentNode.insertBefore(fieldBlock, label);
                        fieldBlock.appendChild(label);
                    } else {
                        input.parentNode.insertBefore(fieldBlock, input);
                    }
                    // Переместить input внутрь .password-wrapper
                    let wrapper = document.createElement('div');
                    wrapper.className = 'password-wrapper';
                    wrapper.style.position = 'relative';
                    fieldBlock.appendChild(wrapper);
                    wrapper.appendChild(input);
                    // Глазик
                    const eyeBtn = document.createElement('button');
                    eyeBtn.type = 'button';
                    eyeBtn.tabIndex = -1;
                    eyeBtn.className = 'toggle-password';
                    eyeBtn.style.position = 'absolute';
                    eyeBtn.style.right = '10px';
                    eyeBtn.style.top = '50%';
                    eyeBtn.style.transform = 'translateY(-50%)';
                    eyeBtn.style.background = 'none';
                    eyeBtn.style.border = 'none';
                    eyeBtn.style.color = '#888';
                    eyeBtn.style.cursor = 'pointer';
                    eyeBtn.innerHTML = '<i class="fas fa-eye"></i>';
                    wrapper.appendChild(eyeBtn);
                    eyeBtn.addEventListener('click', function() {
                        if (input.type === 'password') {
                            input.type = 'text';
                            eyeBtn.querySelector('i').classList.replace('fa-eye', 'fa-eye-slash');
                        } else {
                            input.type = 'password';
                            eyeBtn.querySelector('i').classList.replace('fa-eye-slash', 'fa-eye');
                        }
                    });
                    // Добавить edit-error-message
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'edit-error-message';
                    errorDiv.style.display = 'none';
                    fieldBlock.insertBefore(errorDiv, wrapper);
                }
            }
        });

        // Полоска сложности пароля
        const newPassword1 = document.getElementById('newPassword1');
        const newPassword1Wrapper = newPassword1.parentNode; // .password-wrapper
        let strengthBar = document.getElementById('passwordStrengthBar');
        if (!strengthBar) {
            const barWrapper = document.createElement('div');
            barWrapper.className = 'password-strength';
            strengthBar = document.createElement('div');
            strengthBar.className = 'strength-bar';
            strengthBar.id = 'passwordStrengthBar';
            barWrapper.appendChild(strengthBar);
            // Вставляем полоску после .password-wrapper
            newPassword1Wrapper.parentNode.insertBefore(barWrapper, newPassword1Wrapper.nextSibling);
        }
        newPassword1.addEventListener('input', function() {
            const val = newPassword1.value;
            let score = 0;
            if (val.length >= 8) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[a-z]/.test(val)) score++;
            // 0-1: слабый, 2-3: средний, 4: сильный
            strengthBar.className = 'strength-bar';
            if (!val) {
                strengthBar.style.width = '0';
                strengthBar.style.background = '';
            } else if (score <= 1) {
                strengthBar.style.width = '30%';
                strengthBar.style.background = '#e74c3c';
            } else if (score <= 3) {
                strengthBar.style.width = '60%';
                strengthBar.style.background = '#f39c12';
            } else {
                strengthBar.style.width = '100%';
                strengthBar.style.background = '#2ecc71';
            }
        });
    }

    // showFieldErrorModal теперь ищет .edit-error-message в .field-block
    function showFieldErrorModal(input, message) {
        let fieldBlock = input.closest('.field-block');
        if (!fieldBlock) return;
        let errorDiv = fieldBlock.querySelector('.edit-error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'edit-error-message';
            fieldBlock.insertBefore(errorDiv, fieldBlock.querySelector('.password-wrapper'));
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        input.classList.add('edit-input-error');
    }

    // Закрытие модального окна смены пароля
    const closeChangePasswordModal = document.getElementById('closeChangePasswordModal');
    if (closeChangePasswordModal) {
        closeChangePasswordModal.addEventListener('click', () => {
            document.getElementById('changePasswordModal').style.display = 'none';
            document.getElementById('changePasswordForm').reset();
            document.getElementById('changePasswordError').style.display = 'none';
        });
    }
    const cancelChangePassword = document.getElementById('cancelChangePassword');
    if (cancelChangePassword) {
        cancelChangePassword.addEventListener('click', () => {
            document.getElementById('changePasswordModal').style.display = 'none';
            document.getElementById('changePasswordForm').reset();
            document.getElementById('changePasswordError').style.display = 'none';
        });
    }
    // Клик вне модального окна — закрыть
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('changePasswordModal');
        if (modal && e.target === modal) {
            modal.style.display = 'none';
            document.getElementById('changePasswordForm').reset();
            document.getElementById('changePasswordError').style.display = 'none';
        }
    });
}); 
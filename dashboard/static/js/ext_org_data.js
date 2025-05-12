document.addEventListener('DOMContentLoaded', () => {
    // === Константы и сопоставления ===
    const orgTypeNames = {
        'supplier': 'Поставщик',
        'partner': 'Партнер',
        'government': 'Государственная',
        'other': 'Другое'
    };
    const fieldApiMap = {
        orgNameValue: 'name',
        orgTypeValue: 'type',
        orgDescriptionValue: 'description',
        orgAddressValue: 'address',
        orgEmailValue: 'email',
        orgPhoneValue: 'phone',
        orgWebsiteValue: 'website',
        orgCreatedAtValue: 'created_at',
        orgUpdatedAtValue: 'updated_at'
    };
    const metaBlock = document.querySelector('.org-block-meta');

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
    const checkAccess = () => {
        if (USER_STATUS !== 'approved') {
            const contentWrapper = document.querySelector('.content-wrapper');
            if (contentWrapper) {
                contentWrapper.innerHTML = `
                    <div class="empty-state-container">
                        <div class="no-orgs">
                            <i class="fas fa-lock"></i>
                            <h3>У вас нет доступа к этой организации</h3>
                            <p>Дождитесь одобрения вашей заявки администратором организации</p>
                        </div>
                    </div>
                `;
            }
            return false;
        }
        return true;
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
            const response = await fetch(`/api/v1/ext_org/main_data/?slug=${ORGANIZATION_SLUG}`, {
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
    // === Загрузка данных организации ===
    const loadOrganizationData = () => {
        if (!checkAccess()) return;
        fetch(`/api/v1/ext_org/main_data/?slug=${ORGANIZATION_SLUG}`, {
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
            document.title = `Организация ${data.name}`;
            const orgTypeValue = document.getElementById('orgTypeValue');
            const orgTypeBadge = document.querySelector('.farm-type');
            if (orgTypeValue && orgTypeBadge) {
                orgTypeValue.textContent = orgTypeNames[data.type] || data.type;
                orgTypeBadge.className = 'farm-type badge-toggle';
                if (data.type) orgTypeBadge.classList.add(`type-${data.type}`);
            }
            const orgDescriptionValue = document.getElementById('orgDescriptionValue');
            if (orgDescriptionValue) orgDescriptionValue.textContent = data.description || 'Нет описания';
            const orgAddressValue = document.getElementById('orgAddressValue');
            if (orgAddressValue) orgAddressValue.textContent = data.address || 'Адрес не указан';
            const orgEmailValue = document.getElementById('orgEmailValue');
            if (orgEmailValue) orgEmailValue.textContent = data.email || 'Email не указан';
            const orgPhoneValue = document.getElementById('orgPhoneValue');
            if (orgPhoneValue) orgPhoneValue.textContent = data.phone || 'Телефон не указан';
            const orgCreatedAtValue = document.getElementById('orgCreatedAtValue');
            if (orgCreatedAtValue) orgCreatedAtValue.textContent = formatDate(data.created_at);
            const orgUpdatedAtValue = document.getElementById('orgUpdatedAtValue');
            if (orgUpdatedAtValue) orgUpdatedAtValue.textContent = formatDate(data.updated_at);
            const isAdmin = USER_ROLE === 'admin';
            const isManager = USER_ROLE === 'manager';
            const editButtons = document.querySelectorAll('.edit-btn');
            if (metaBlock) {
                metaBlock.style.display = (isAdmin || isManager) ? '' : 'none';
            }
            editButtons.forEach(button => {
                button.style.display = isAdmin ? '' : 'none';
                if (isAdmin) {
                    button.addEventListener('click', () => handleEditClick(button));
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
            const orgName = document.getElementById('orgName');
            const orgType = document.getElementById('orgType');
            const orgDescription = document.getElementById('orgDescription');
            const orgAddress = document.getElementById('orgAddress');
            const orgEmail = document.getElementById('orgEmail');
            const orgPhone = document.getElementById('orgPhone');
            const orgCreatedAt = document.getElementById('orgCreatedAt');
            const orgUpdatedAt = document.getElementById('orgUpdatedAt');
            if (orgName) orgName.textContent = 'Ошибка загрузки';
            if (orgType) orgType.textContent = 'Ошибка загрузки';
            if (orgDescription) orgDescription.textContent = 'Не удалось загрузить данные организации';
            if (orgAddress) orgAddress.textContent = 'Ошибка загрузки';
            if (orgEmail) orgEmail.textContent = 'Ошибка загрузки';
            if (orgPhone) orgPhone.textContent = 'Ошибка загрузки';
            if (orgCreatedAt) orgCreatedAt.textContent = 'Ошибка загрузки';
            if (orgUpdatedAt) orgUpdatedAt.textContent = 'Ошибка загрузки';
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
    if (document.getElementById('orgName')) {
        loadOrganizationData();
    }
}); 
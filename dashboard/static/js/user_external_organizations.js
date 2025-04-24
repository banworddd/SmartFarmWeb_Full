document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const orgsList = document.getElementById('orgsList');
    const addOrgBtn = document.getElementById('addOrgBtn');
    const addOrgModal = document.getElementById('addOrgModal');
    const closeModal = document.querySelector('.close-modal');
    const addOrgForm = document.getElementById('addOrgForm');

    // Элементы фильтров
    const roleFilter = document.getElementById('roleFilter');
    const nameFilter = document.getElementById('nameFilter');

    // Загрузка данных организаций с учетом фильтров
    function loadOrganizations() {
        // Добавляем класс обновления
        orgsList.classList.add('updating');

        // Формируем URL с параметрами фильтрации
        const params = new URLSearchParams();
        if (roleFilter.value) params.append('role', roleFilter.value);
        if (nameFilter.value) params.append('organization_name', nameFilter.value);

        const url = `/api/v1/user_organizations/?${params.toString()}`;
        console.log('Отправляем запрос:', url);

        fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            console.log('Получены данные:', data);
            const noOrgsMessage = document.querySelector('.no-orgs');

            if (data.length === 0) {
                orgsList.innerHTML = '';
                noOrgsMessage.style.display = 'flex';
            } else {
                orgsList.innerHTML = '';
                data.forEach(org => {
                    orgsList.innerHTML += createOrgCard(org);
                });
                noOrgsMessage.style.display = 'none';
            }

            // Удаляем класс обновления после небольшой задержки
            setTimeout(() => {
                orgsList.classList.remove('updating');
            }, 50);
        })
        .catch(error => {
            console.error('Error:', error);
            orgsList.innerHTML = '';
            const errorState = document.querySelector('.error-state');
            if (errorState) {
                errorState.style.display = 'flex';
            }
            orgsList.classList.remove('updating');
        });
    }

    // Управление модальным окном
    function showModal() {
        addOrgModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        addOrgModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Обработчики событий
    addOrgBtn.addEventListener('click', showModal);
    closeModal.addEventListener('click', hideModal);

    window.addEventListener('click', function(e) {
        if (e.target === addOrgModal) hideModal();
    });

    // Обработка формы
    addOrgForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('orgName').value,
            description: document.getElementById('orgDescription').value
        };

        fetch('/api/v1/organizations/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(formData),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            hideModal();
            addOrgForm.reset();
            loadOrganizations();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ошибка: ' + error.message);
        });
    });

    // Получение CSRF токена
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

    // Обработчики событий для фильтров
    roleFilter.addEventListener('change', loadOrganizations);

    // Обработчик для поиска с задержкой
    let searchTimeout;
    nameFilter.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadOrganizations, 500);
    });

    // Первоначальная загрузка
    loadOrganizations();

    function createOrgCard(org) {
        return `
            <div class="farm-card" data-org-id="${org.id}">
                <div class="farm-header">
                    <h3 class="farm-name">${org.organization.name}</h3>
                    <div class="farm-badges">
                        <span class="farm-role role-${org.role}">${org.role}</span>
                        <span class="farm-status status-${org.status}">${org.status}</span>
                    </div>
                </div>
                <p class="farm-description">${org.organization.description || 'Нет описания'}</p>
                <div class="farm-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${org.organization.address || 'Нет адреса'}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(org.updated_at)}</span>
                </div>
            </div>
        `;
    }

    function formatDate(dateString) {
        // Разбиваем строку на дату и время
        const [datePart, timePart] = dateString.split(' ');
        // Разбиваем дату на день, месяц и год
        const [day, month, year] = datePart.split('.');
        // Создаем объект Date (месяцы в JS начинаются с 0)
        const date = new Date(year, month - 1, day);
        // Форматируем дату в нужный формат
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}); 
document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const farmsList = document.getElementById('farmsList');
    const addFarmBtn = document.getElementById('addFarmBtn');
    const addFarmModal = document.getElementById('addFarmModal');
    const closeModal = document.querySelector('.close-modal');
    const addFarmForm = document.getElementById('addFarmForm');
    
    // Элементы фильтров
    const roleFilter = document.getElementById('roleFilter');
    const nameFilter = document.getElementById('nameFilter');
    const orgFilter = document.getElementById('orgFilter');

    // Загрузка данных ферм с учетом фильтров
    function loadFarms() {
        // Добавляем класс обновления
        farmsList.classList.add('updating');

        // Формируем URL с параметрами фильтрации
        const params = new URLSearchParams();
        if (roleFilter.value) params.append('role', roleFilter.value);
        if (nameFilter.value) params.append('farm_name', nameFilter.value);
        if (orgFilter.value) params.append('organization', orgFilter.value);

        const url = `/api/v1/user_farms/?${params.toString()}`;

        fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            const noFarmsMessage = document.querySelector('.no-farms');
            
            if (data.length === 0) {
                farmsList.innerHTML = '';
                noFarmsMessage.style.display = 'flex';
            } else {
                // Собираем уникальные организации
                const organizations = new Set();
                data.forEach(farm => {
                    if (farm.farm.organization_name) {
                        organizations.add(farm.farm.organization_name);
                    }
                });

                // Обновляем выпадающий список организаций
                updateOrganizationFilter(organizations);

                farmsList.innerHTML = '';
                data.forEach(farm => {
                    farmsList.innerHTML += createFarmCard(farm);
                });
                noFarmsMessage.style.display = 'none';
            }

            // Удаляем класс обновления после небольшой задержки
            setTimeout(() => {
                farmsList.classList.remove('updating');
            }, 50);
        })
        .catch(error => {
            console.error('Error:', error);
            farmsList.innerHTML = '';
            const errorState = document.querySelector('.error-state');
            if (errorState) {
                errorState.style.display = 'flex';
            }
            farmsList.classList.remove('updating');
        });
    }

    // Функция обновления фильтра организаций
    function updateOrganizationFilter(organizations) {
        const currentValue = orgFilter.value;
        orgFilter.innerHTML = '<option value="">Все организации</option>';
        
        organizations.forEach(org => {
            const option = document.createElement('option');
            option.value = org;
            option.textContent = org;
            orgFilter.appendChild(option);
        });

        // Восстанавливаем выбранное значение, если оно все еще существует
        if (currentValue && Array.from(organizations).includes(currentValue)) {
            orgFilter.value = currentValue;
        }
    }

    // Управление модальным окном
    function showModal() {
        addFarmModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        addFarmModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Обработчики событий
    addFarmBtn.addEventListener('click', showModal);
    closeModal.addEventListener('click', hideModal);

    window.addEventListener('click', function(e) {
        if (e.target === addFarmModal) hideModal();
    });

    // Обработка формы
    addFarmForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('farmName').value,
            description: document.getElementById('farmDescription').value
        };

        fetch('/api/farms/', {
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
            addFarmForm.reset();
            loadFarms();
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
    roleFilter.addEventListener('change', loadFarms);
    orgFilter.addEventListener('change', loadFarms);
    
    // Обработчик для поиска с задержкой
    let searchTimeout;
    nameFilter.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadFarms, 500);
    });

    // Первоначальная загрузка
    loadFarms();

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

    function createFarmCard(farm) {
        return `
            <div class="farm-card" data-farm-id="${farm.id}">
                <div class="farm-header">
                    <h3 class="farm-name">${farm.farm.name}</h3>
                    <div class="farm-badges">
                        <span class="farm-role role-${farm.role}">${farm.role}</span>
                        ${farm.farm.organization_name ? `<span class="farm-organization">${farm.farm.organization_name}</span>` : ''}
                    </div>
                </div>
                <p class="farm-description">${farm.farm.description || 'Нет описания'}</p>
                <div class="farm-meta">
                    <span><i class="fas fa-user-shield"></i> ${farm.farm.owner_full_name}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(farm.joined_at)}</span>
                </div>
            </div>
        `;
    }
});
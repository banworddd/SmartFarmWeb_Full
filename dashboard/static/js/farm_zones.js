document.addEventListener('DOMContentLoaded', () => {
    // const FARM_SLUG = '{{ slug }}'; // Получаем slug фермы из шаблона - Эту строку удаляем

    // DOM элементы
    const zonesList = document.getElementById('zonesList');
    const addZoneBtn = document.getElementById('addZoneBtn');
    const addZoneModal = document.getElementById('addZoneModal');
    const closeAddZoneModal = document.getElementById('closeAddZoneModal');
    const cancelAddZone = document.getElementById('cancelAddZone');
    const addZoneForm = document.getElementById('addZoneForm');
    const zoneNameFilter = document.getElementById('zoneNameFilter');
    const zoneTypeFilter = document.getElementById('zoneTypeFilter');

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
    let currentEditingZoneId = null; // Добавляем переменную для отслеживания редактируемой зоны

    // Загрузка зон фермы
    const loadFarmZones = () => {
        const nameFilter = zoneNameFilter?.value;
        const typeFilter = zoneTypeFilter?.value;

        let url = `/api/v1/farm/zones/?slug=${FARM_SLUG}`;
        if (nameFilter) url += `&name__icontains=${nameFilter}`;
        if (typeFilter) url += `&zone_type=${typeFilter}`;
        if (currentOrdering) url += `&ordering=${currentOrdering}`;

        fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
        .then(response => {
             if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.detail || data.error || 'Ошибка загрузки зон');
                });
            }
            return response.json();
        })
        .then(zones => {
            if (!zonesList) return;
            let html = zones.length ? 
                zones.map(zone => createZoneCard(zone)).join('') :
                createZoneCard('empty');
            zonesList.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading farm zones:', error);
            if (zonesList) {
                zonesList.innerHTML = createZoneCard('empty');
            }
             showGlobalError(error.message || 'Ошибка загрузки зон');
        });
    };

    // Создание карточки зоны
    const createZoneCard = zone => {
        if (zone === 'empty') {
            return `
                <div class="farm-card empty-state-card">
                    <div class="farm-user-center">
                        <i class="fas fa-map-marked-alt empty-state-icon"></i>
                        <div class="user-names">
                            <span class="user-first-name" style="display:block;width:100%;">Нет зон</span>
                            <span class="user-last-name" style="display:block;width:100%;">Попробуйте изменить параметры фильтрации или добавьте новую зону</span>
                        </div>
                    </div>
                </div>
            `;
        }

         const zoneTypeNames = {
            'greenhouse': 'Теплица',
            'field': 'Поле',
            'storage': 'Склад',
            'livestock': 'Животноводческий комплекс',
            'other': 'Другое'
        };

        const formatDate = dateString => {
            if (!dateString) return 'не указано';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return 'Некорректная дата';
                 return date.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch { 
                return dateString; // Возвращаем оригинальную строку, если парсинг не удался
            }
        };

        const isEditing = currentEditingZoneId == zone.id; // Проверяем, редактируется ли текущая зона

        // HTML для редактирования
        if (isEditing) {
            return `
                <div class="farm-card" data-zone-id="${zone.id}">
                    <form class="edit-zone-form">
                        <div class="form-group">
                             <label for="editZoneName_${zone.id}">Название зоны</label>
                             <div class="input-wrapper">
                                 <i class="fas fa-signature field-icon"></i>
                                 <input type="text" id="editZoneName_${zone.id}" name="name" value="${zone.name || ''}" required class="edit-input">
                             </div>
                              <div class="field-error"></div>
                        </div>
                         <div class="form-group">
                             <label for="editZoneType_${zone.id}">Тип зоны</label>
                             <div class="input-wrapper">
                                 <i class="fas fa-tag field-icon"></i>
                                 <select id="editZoneType_${zone.id}" name="zone_type" required class="edit-input">
                                     <option value="greenhouse" ${zone.zone_type === 'greenhouse' ? 'selected' : ''}>Теплица</option>
                                     <option value="field" ${zone.zone_type === 'field' ? 'selected' : ''}>Поле</option>
                                     <option value="storage" ${zone.zone_type === 'storage' ? 'selected' : ''}>Склад</option>
                                     <option value="livestock" ${zone.zone_type === 'livestock' ? 'selected' : ''}>Животноводческий комплекс</option>
                                     <option value="other" ${zone.zone_type === 'other' ? 'selected' : ''}>Другое</option>
                                 </select>
                              </div>
                               <div class="field-error"></div>
                         </div>
                          <div class="form-group">
                              <label for="editZoneArea_${zone.id}">Площадь (кв.м.)</label>
                              <div class="input-wrapper">
                                  <i class="fas fa-chart-area field-icon"></i>
                                  <input type="number" id="editZoneArea_${zone.id}" name="area" value="${zone.area !== null && zone.area !== undefined ? zone.area : ''}" step="0.01" class="edit-input">
                               </div>
                                <div class="field-error"></div>
                          </div>
                         <div class="form-group">
                             <label for="editZoneDescription_${zone.id}">Описание</label>
                             <div class="input-wrapper">
                                 <i class="fas fa-file-alt field-icon"></i>
                                 <textarea id="editZoneDescription_${zone.id}" name="description" class="edit-input">${zone.description || ''}</textarea>
                              </div>
                               <div class="field-error"></div>
                         </div>
                         <div class="form-actions">
                             <button type="button" class="cancel-btn cancel-edit-zone" data-zone-id="${zone.id}">
                                 <i class="fas fa-times"></i> Отмена
                             </button>
                             <button type="submit" class="submit-btn save-edit-zone" data-zone-id="${zone.id}">
                                 <i class="fas fa-check"></i> Сохранить
                             </button>
                         </div>
                    </form>
                </div>
            `;
        }

        // HTML для отображения
        return `
            <div class="farm-card" data-zone-id="${zone.id}">
                 <div class="farm-header">
                    <div class="farm-header-main">
                        <span class="farm-name">${zone.name}</span>
                        <button class="edit-membership-btn edit-zone-btn" data-zone-id="${zone.id}" title="Редактировать зону">
                           <i class="fas fa-pencil-alt"></i>
                        </button>
                    </div>
                     <div class="farm-badges">
                        <span class="farm-type badge-toggle" tabindex="0" role="button" aria-expanded="false">
                            <i class="fas fa-tag"></i>
                            <span class="type-label">${zoneTypeNames[zone.zone_type] || zone.zone_type}</span>
                        </span>
                         ${zone.area ? 
                            `<span class="farm-type badge-toggle" tabindex="0" role="button" aria-expanded="false">
                                <i class="fas fa-chart-area"></i>
                                <span class="type-label">Площадь: ${zone.area} кв.м.</span>
                            </span>` : ''}
                    </div>
                </div>
                 ${zone.description ? `<div class="farm-divider"></div><p class="farm-description">${zone.description}</p>` : ''}
                <div class="farm-divider"></div>
                <div class="farm-meta">
                    <span><i class="fas fa-calendar-plus"></i> Создано: ${formatDate(zone.created_at)}</span>
                    <span><i class="fas fa-clock"></i> Обновлено: ${formatDate(zone.updated_at)}</span>
                </div>
            </div>
        `;
    };

     // Обработчики событий для фильтрации и сортировки
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

    const initZoneEventListeners = () => {
        if (zoneNameFilter) {
            zoneNameFilter.addEventListener('input', debounce(loadFarmZones, 300));
        }
        if (zoneTypeFilter) {
            zoneTypeFilter.addEventListener('change', loadFarmZones);
        }

        // Обработка кликов по бейджам (если нужно сделать их раскрывающимися)
        if (zonesList) {
             // Удаляем старый обработчик, если он есть (чтобы не дублировать)
            zonesList.removeEventListener('click', handleZoneBadgeClick);

            // Создаем отдельную функцию для обработчика кликов по бейджам
            function handleZoneBadgeClick(e) {
                const badge = e.target.closest('.badge-toggle'); // Используем более общий класс
                if (badge) {
                    e.preventDefault();
                    e.stopPropagation();
                    badge.classList.toggle('expanded');
                }
            }

            // Добавляем новый обработчик
            zonesList.addEventListener('click', handleZoneBadgeClick);
        }

        // Обработчики сортировки
         document.querySelectorAll('.content-wrapper .sort-badge').forEach(badge => {
            badge.addEventListener('click', e => {
                // Проверяем, что клик не по стрелке сортировки
                if (!e.target.closest('.sort-arrow')) {
                    badge.classList.toggle('expanded');
                }
            });

            // Обработчики кликов по стрелкам сортировки
            badge.querySelectorAll('.sort-arrow').forEach(arrow => {
                arrow.addEventListener('click', e => {
                    e.stopPropagation(); // Остановить всплытие, чтобы не сработал родительский обработчик бейджа

                    // Удалить класс 'active' у всех стрелок сортировки в этом блоке
                    badge.closest('.sort-fields').querySelectorAll('.sort-arrow').forEach(a => a.classList.remove('active'));

                    // Добавить класс 'active' к текущей стрелке
                    arrow.classList.add('active');

                    const sortField = badge.dataset.sort;
                    const direction = arrow.dataset.direction;

                    // Формируем строку сортировки для API
                    currentOrdering = direction === 'desc' ? `-${sortField}` : sortField;

                    // Перезагружаем список зон с учетом новой сортировки
                    loadFarmZones();
                });
            });
        });

        // Обработчики для редактирования зоны
        if (zonesList) {
            // Удаляем старые обработчики, чтобы избежать дублирования
            zonesList.removeEventListener('click', handleZoneEditClick);
             // Создаем отдельную функцию для обработчика
            function handleZoneEditClick(e) {
                // Клик по кнопке редактирования
                const editBtn = e.target.closest('.edit-zone-btn');
                if (editBtn) {
                    e.preventDefault();
                    currentEditingZoneId = editBtn.dataset.zoneId;
                    loadFarmZones(); // Перезагружаем, чтобы показать форму редактирования
                    return;
                }

                 // Клик по кнопке отмены редактирования
                const cancelBtn = e.target.closest('.cancel-edit-zone');
                if (cancelBtn) {
                    e.preventDefault();
                    currentEditingZoneId = null;
                    loadFarmZones(); // Перезагружаем, чтобы вернуться к отображению
                    return;
                }
            }
            // Добавляем новый обработчик
            zonesList.addEventListener('click', handleZoneEditClick);

             // Обработчик отправки формы редактирования (используем делегирование)
             zonesList.removeEventListener('submit', handleZoneEditSubmit);
             function handleZoneEditSubmit(e) {
                const editForm = e.target.closest('.edit-zone-form');
                if (editForm) {
                    e.preventDefault();
                    const zoneId = editForm.closest('.farm-card').dataset.zoneId;
                    const formData = new FormData(editForm);
                    const jsonData = {};
                    formData.forEach((value, key) => { jsonData[key] = value; });

                     // Преобразуем area в число, если оно указано и не пустое
                    if (jsonData.area !== null && jsonData.area !== undefined && jsonData.area !== '') {
                         // Заменяем запятую на точку для корректного парсинга дробных чисел
                        const areaValue = jsonData.area.toString().replace(',', '.');
                        jsonData.area = parseFloat(areaValue);
                         // Если после парсинга получилось NaN, значит ввод некорректный
                        if (isNaN(jsonData.area)) {
                             showGlobalError('Некорректное значение площади');
                             // TODO: Отобразить ошибку рядом с полем площади
                            const areaInput = editForm.querySelector('input[name="area"]');
                            if(areaInput) {
                                areaInput.classList.add('error-input');
                                const errorDiv = areaInput.closest('.form-group').querySelector('.field-error');
                                if(errorDiv) errorDiv.textContent = 'Введите числовое значение';
                            }
                             return;
                        }
                    } else {
                         jsonData.area = null; // Отправляем null, если поле пустое
                    }

                    saveZoneEdit(zoneId, jsonData, editForm);
                }
            }
             zonesList.addEventListener('submit', handleZoneEditSubmit);
        }
    };

    // --- Обработчики для добавления зоны ---
    const closeModal = () => {
        addZoneModal.style.display = 'none';
        addZoneForm.reset();
         // Опционально: удалить модальное окно из DOM после закрытия
        // addZoneModal.remove();
    };

    addZoneBtn.addEventListener('click', () => {
         document.body.appendChild(addZoneModal); // Убедимся, что модальное окно в теле документа
        addZoneModal.style.display = 'flex';
    });

    closeAddZoneModal.addEventListener('click', closeModal);
    cancelAddZone.addEventListener('click', closeModal);

    addZoneForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(addZoneForm);
        const jsonData = {};
        formData.forEach((value, key) => { jsonData[key] = value; });
        // Преобразуем area в число, если оно указано
        if (jsonData.area) {
            jsonData.area = parseFloat(jsonData.area);
        } else {
            delete jsonData.area; // Удаляем, если поле пустое
        }

        fetch(`/api/v1/farm/zone/create/?slug=${FARM_SLUG}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(jsonData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                     // Пробуем извлечь сообщение об ошибке из разных полей
                    const errorMessage = data.name? data.name.join(', ') : 
                                         data.zone_type? data.zone_type.join(', ') : 
                                         data.area? data.area.join(', ') : 
                                         data.description? data.description.join(', ') : 
                                         data.detail || data.error || 'Неизвестная ошибка при создании зоны';
                    throw new Error(errorMessage);
                });
            }
            return response.json();
        })
        .then(() => {
            closeModal();
            loadFarmZones();
            showGlobalError('Зона успешно добавлена');
        })
        .catch(error => {
            console.error('Error adding zone:', error);
            showGlobalError(error.message || 'Ошибка добавления зоны');
        });
    });

    // --- PATCH-запрос к API для сохранения редактирования зоны ---
    const saveZoneEdit = (zoneId, data, formElement) => {
         // Очищаем предыдущие ошибки
        formElement.querySelectorAll('.field-error').forEach(el => el.textContent = '');
        formElement.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));

        fetch(`/api/v1/farm/zone/${zoneId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errors => {
                     // Отображаем ошибки валидации полей
                    if (errors) {
                        Object.keys(errors).forEach(field => {
                            const input = formElement.querySelector(`[name="${field}"]`);
                            if (input) {
                                input.classList.add('error-input');
                                const errorDiv = input.closest('.form-group').querySelector('.field-error');
                                if (errorDiv) {
                                    errorDiv.textContent = Array.isArray(errors[field]) ? errors[field].join(', ') : errors[field];
                                }
                            } else { // Если ошибка не привязана к конкретному полю
                                 showGlobalError(Array.isArray(errors[field]) ? errors[field].join(', ') : errors[field]);
                            }
                        });
                    }
                    throw new Error('Ошибка сохранения зоны'); // Выбрасываем ошибку для catch
                });
            }
            return response.json();
        })
        .then(() => {
            currentEditingZoneId = null; // Сбрасываем режим редактирования
            loadFarmZones(); // Перезагружаем список
            showGlobalError('Зона успешно обновлена');
        })
        .catch(error => {
            console.error('Error saving zone:', error);
             // showGlobalError(error.message || 'Ошибка сохранения зоны'); // Глобальная ошибка уже могла быть показана выше
        });
    };

    // Инициализация
    if (zonesList) {
        loadFarmZones();
        initZoneEventListeners();
    }
});

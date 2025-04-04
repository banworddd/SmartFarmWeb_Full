document.addEventListener('DOMContentLoaded', function() {
    // ==================== PASSWORD TOGGLE ====================
    // Показать/скрыть пароль
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.closest('.password-wrapper').querySelector('input');
            const icon = this.querySelector('i');

            // Переключение типа поля ввода и изменение иконки
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // ==================== PHONE NUMBER FORMATTING ====================
    // Форматирование номера телефона
    const phoneInput = document.querySelector('#id_phone_number');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            // Удаляем все нецифровые символы и ограничиваем длину до 10 символов
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
        });
    }

    // ==================== ERROR HIGHLIGHTING ====================
    // Добавляем классы ошибок при загрузке страницы с ошибками
    document.querySelectorAll('.field-error').forEach(error => {
        const input = error.closest('.form-group').querySelector('input');
        if (input) {
            input.classList.add('error');
        }
    });
});

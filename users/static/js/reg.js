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

    // ==================== PASSWORD VALIDATION ====================
    // Валидация пароля в реальном времени
    const passwordInput = document.querySelector('#id_password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);
            const meter = this.closest('.form-group').querySelector('.password-strength');

            // Удаляем предыдущие классы силы пароля
            meter.classList.remove('password-weak', 'password-medium', 'password-strong');

            // Добавляем соответствующий класс силы пароля
            if (this.value.length > 0) {
                meter.classList.add(`password-${strength}`);
            }

            // Подсветка поля при ошибке
            if (this.value.length > 0 && strength === 'weak') {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        });
    }

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

// ==================== PASSWORD STRENGTH CHECK ====================
// Функция для проверки силы пароля
function checkPasswordStrength(password) {
    if (password.length < 6) return 'weak';

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
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

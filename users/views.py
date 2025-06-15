from typing import Any, Dict

from django.shortcuts import redirect
from django.views.generic import CreateView, FormView, RedirectView, TemplateView
from django.contrib.auth import login, logout
from django.http import HttpRequest, HttpResponse

from main.mixins import LoginRequiredMixin
from .forms import CustomUserRegistrationForm, CustomUserConfirmationForm, CustomUserLoginForm
from .utils import generate_and_send_confirmation_code
from users.models import CustomUser
from main.mixins import LogoutRequiredMixin
import time


class CustomUserRegisterView(LogoutRequiredMixin, CreateView):
    model = CustomUser
    form_class = CustomUserRegistrationForm
    template_name = 'users/reg.html'
    success_url = 'confirm'

    def form_valid(self, form: CustomUserRegistrationForm):
        form.save()
        self.request.session['phone_number'] = form.cleaned_data['phone_number']
        generate_and_send_confirmation_code(self.request)
        return redirect(self.success_url)


class CustomUserLoginView(LogoutRequiredMixin, FormView):
    """
    Представление для обработки входа пользователя.

    Атрибуты:
        model (CustomUser): Модель пользователя, используемая при логине.
        form_class (CustomUserLoginForm): Форма для ввода номера телефона и пароля.
        template_name (str): Шаблон, отображаемый при открытии страницы логина.
        success_url (str): URL для перенаправления после успешного входа.
    """

    model = CustomUser
    form_class = CustomUserLoginForm
    template_name = 'users/login.html'
    success_url = '/'

    def form_valid(self, form: CustomUserLoginForm) -> redirect:
        """
        Обработка валидной формы логина.

        Если пользователь активен, выполняется вход и происходит перенаправление
        на success_url. Если пользователь не активен — происходит перенаправление
        на страницу подтверждения.

        Аргументы:
            form (CustomUserLoginForm): Экземпляр формы с валидными данными.

        Возвращает:
            redirect: Перенаправление в зависимости от статуса пользователя.
        """
        # Получаем пользователя по номеру телефона
        user = CustomUser.objects.get(phone_number=form.cleaned_data.get('phone_number'))
        self.request.session['phone_number'] = form.cleaned_data['phone_number']

        # Если пользователь не активен — отправляем на страницу подтверждения
        if not user.is_active:
            return redirect('confirm')

        # Вход пользователя в систему
        login(self.request, user)

        # Перенаправление на целевую страницу после логина
        return redirect(self.success_url)


class CustomUserConfirmView(FormView):
    """
    Представление для подтверждения регистрации пользователя.

    Атрибуты:
        model (CustomUser): Модель, используемая для подтверждения пользователя.
        form_class (CustomUserConfirmationForm): Форма, используемая для подтверждения пользователя.
        template_name (str): Шаблон, используемый для отображения страницы подтверждения.
        success_url (str): URL для перенаправления после успешного подтверждения.
    """

    model = CustomUser
    form_class = CustomUserConfirmationForm
    template_name = 'users/confirm.html'
    success_url = '/'

    def dispatch(self, request, *args, **kwargs) -> Any:
        """
        Проверяет наличие номера телефона в сессии.
        Если номера нет - перенаправляет на страницу логина.

        Аргументы:
            request (HttpRequest): Объект HTTP-запроса.
            *args: Дополнительные позиционные аргументы.
            **kwargs: Дополнительные именованные аргументы.

        Возвращает:
            Any: Результат выполнения родительского метода dispatch или редирект на страницу логина.

        Исключения:
            None
        """
        if 'phone_number' not in request.session:
            return redirect('login')

        if request.user.is_active:
            return redirect('dashboard')

        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs) -> Dict[str, Any]:
        """
        Добавляет в контекст шаблона информацию о времени валидности кода подтверждения.

        Аргументы:
            **kwargs: Дополнительные именованные аргументы контекста.

        Возвращает:
            Dict[str, Any]: Контекст данных для шаблона, содержащий:
                - remaining_time (int|None): Оставшееся время действия кода в секундах
                  или None, если время не было установлено.

        Исключения:
            None
        """
        context = super().get_context_data(**kwargs)
        code_time = self.request.session.get('confirmation_code_time')

        if code_time is None:
            context['remaining_time'] = None
        else:
            remaining_time = max(0, 300 - (time.time() - code_time))
            context['remaining_time'] = int(remaining_time)


        return context

    def get_form_kwargs(self) -> Dict[str, Any]:
        """
        Добавляет объект запроса в аргументы формы.

        Возвращает:
            Dict[str, Any]: Аргументы для формы, включая:
                - request (HttpRequest): Объект HTTP-запроса.

        Исключения:
            None
        """
        kwargs = super().get_form_kwargs()
        kwargs['request'] = self.request
        return kwargs

    def form_valid(self, form: CustomUserConfirmationForm) -> redirect:
        """
        Обработка валидной формы подтверждения.

        Аргументы:
            form (CustomUserConfirmationForm): Экземпляр формы с валидными данными.

        Возвращает:
            redirect: Перенаправление на URL успеха после обработки формы.

        Исключения:
            None
        """
        phone_number = self.request.session.get('phone_number')
        user = CustomUser.objects.get(phone_number=phone_number)
        user.is_active = True
        user.save()
        login(self.request, user)

        if 'confirmation_code' in self.request.session:
            del self.request.session['confirmation_code']

        return redirect(self.success_url)


class CustomUserLogoutView(RedirectView):
    """
    Представление для выхода пользователя из системы.

    Атрибуты:
        url (str): URL, на который будет выполнено перенаправление после выхода.
    """

    url = '/'

    def get(self, request: HttpRequest, *args, **kwargs) -> HttpResponse:
        """
        Обработка GET-запроса для выхода пользователя.

        Выполняет завершение пользовательской сессии и перенаправляет
        на заданный URL.

        Аргументы:
            request (HttpRequest): Объект запроса.
            *args: Дополнительные позиционные аргументы.
            **kwargs: Дополнительные именованные аргументы.

        Возвращает:
            HttpResponse: Перенаправление на заданный URL.
        """
        logout(request)
        return super().get(request, *args, **kwargs)


class CustomUserConfirmNewCodeView(RedirectView):
    url = 'confirm'

    def dispatch(self, request: HttpRequest, *args, **kwargs) -> HttpResponse:
        """
        Проверяет наличие номера телефона в сессии перед обработкой запроса.
        Если номера нет - перенаправляет на страницу логина.
        """
        if 'phone_number' not in request.session:
            return redirect('login')
        return super().dispatch(request, *args, **kwargs)

    def get(self, request: HttpRequest, *args, **kwargs) -> HttpResponse:
        """
        Обрабатывает GET-запрос: генерирует и отправляет новый код подтверждения.
        """
        generate_and_send_confirmation_code(self.request)
        return super().get(request, *args, **kwargs)


class CustomUserProfileView(LoginRequiredMixin,TemplateView):
    template_name = 'users/profile.html'


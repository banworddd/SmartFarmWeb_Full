from django.views.generic import TemplateView
from main.mixins import LoginRequiredMixin


class UserFarmsView(LoginRequiredMixin, TemplateView):
    """Представление для отображения страницы с фермами пользователя.

    Наследует:
        LoginRequiredMixin - гарантирует, что доступ имеют только аутентифицированные пользователи
        TemplateView - базовый класс для отображения шаблонов Django

    Attributes:
        template_name (str): Путь к HTML-шаблону, используемому для рендеринга страницы.
                            Относительно директории templates/.

    Контекст:
        Передает в шаблон данные о фермах пользователя через API endpoint,
        который обрабатывается UserFarmsAPIView.
    """

    template_name: str = 'dashboard/user_farms.html'


class UserExternalOrganizationsView(LoginRequiredMixin, TemplateView):
    """Представление для отображения страницы с организациями пользователя.

    Наследует:
        LoginRequiredMixin - гарантирует, что доступ имеют только аутентифицированные пользователи
        TemplateView - базовый класс для отображения шаблонов Django
    """

    template_name: str = 'dashboard/user_external_organizations.html'

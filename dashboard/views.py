from django.views.generic import TemplateView
from main.mixins import LoginRequiredMixin
from users.models import FarmMembership, ExternalOrganization, ExternalOrganizationMembership


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


class ExternalOrganizationView(LoginRequiredMixin, TemplateView):
    template_name: str = 'dashboard/external_organization.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['slug'] = self.kwargs.get('slug')

        org = ExternalOrganization.objects.get(slug=context['slug'])
        context['org_name'] = org.name

        membership = ExternalOrganizationMembership.objects.filter(
            organization=org,
            user=self.request.user
        ).first()


        context['status'] = membership.status if membership else None
        context['role'] = membership.role if membership else None

        return context

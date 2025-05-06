from django.db.models import Case, When, Value, IntegerField
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated


from .filters import (
 FarmFilterBackend,
)
from .permissions import IsOrganizationMember, IsOrganizationAdmin
from .serializers import (

    ExternalOrganizationSerializer,
    ExternalOrganizationUsersSerializer,

)
from users.models import (
    ExternalOrganizationMembership,
    ExternalOrganization,
  Farm,
)
from ..UserPages.filters import ExternalOrganizationFilterBackend
from ..UserPages.serializers import UserFarmsSerializer


class ExternalOrganizationAPIView(RetrieveUpdateDestroyAPIView):
    """API для работы с внешними организациями (получение/обновление/удаление)."""
    serializer_class = ExternalOrganizationSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_serializer_context(self):
        """Добавляем request в контекст сериализатора."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_object(self):
        """Получает организацию по slug из query параметров.

        Returns:
            ExternalOrganization: Найденная организация

        Raises:
            NotFound: Если не передан slug или организация не найдена
        """
        slug = self.request.query_params.get('slug')
        if not slug:
            raise NotFound('Необходимо передать параметр slug')

        obj = ExternalOrganization.objects.filter(slug=slug).first()

        if not obj:
            raise NotFound('Нет организации с таким slug')

        return obj


class ExternalOrganizationUsersAPIVIew(ListAPIView):
    """API для получения списка пользователей внешней организации."""
    serializer_class = ExternalOrganizationUsersSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [ExternalOrganizationFilterBackend]

    def get_queryset(self):
        """Возвращает queryset членов организации с приоритетом для текущего пользователя."""
        organization_slug = self.request.query_params.get('organization')
        queryset = ExternalOrganizationMembership.objects.filter(
            organization__slug=organization_slug
        )

        return queryset.annotate(
            is_current_user=Case(
                When(user=self.request.user, then=Value(1)),
                default=Value(0),
                output_field=IntegerField()
            )
        ).order_by('-is_current_user', 'user__username')

class ExternalOrganizationFarmsAPIView(ListAPIView):
    serializer_class = UserFarmsSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [FarmFilterBackend]

    def get_queryset(self):
        organization_slug = self.request.query_params.get('organization')
        queryset = Farm.objects.filter(organization__slug=organization_slug)
        return queryset


class ExternalOrganizationMembershipAPIView(RetrieveUpdateDestroyAPIView):
    """API для работы с членством во внешних организациях."""
    serializer_class = ExternalOrganizationUsersSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_permissions(self):
        """Добавляем IsOrganizationAdmin для изменяющих методов."""
        permissions = super().get_permissions()
        if self.request.method in ('PATCH', 'PUT', 'DELETE'):
            permissions.append(IsOrganizationAdmin())
        return permissions

    def get_object(self):
        """Получает объект членства по ID и slug организации."""
        membership_id = self.request.query_params.get('id')
        organization_slug = self.request.query_params.get('organization')

        if not membership_id or not organization_slug:
            raise NotFound('Требуются параметры id и organization')

        try:
            return ExternalOrganizationMembership.objects.filter(
                id=membership_id,
                organization=ExternalOrganization.objects.get(slug=organization_slug)
            ).first()
        except (ExternalOrganization.DoesNotExist,
               ExternalOrganizationMembership.DoesNotExist):
            raise NotFound('Запись не найдена')





from django.db.models import OuterRef, Subquery
from django.http import Http404
from rest_framework.exceptions import NotFound
from rest_framework.generics import (
    ListAPIView,
    RetrieveUpdateDestroyAPIView,
    RetrieveAPIView,
    CreateAPIView)
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter


from .filters import (
 FarmFilterBackend,
)
from .permissions import IsOrganizationMember, IsOrganizationAdmin
from .serializers import (
    ExtOrgFarmSerializer,
    ExternalOrganizationSerializer,
    ExternalOrganizationUsersSerializer,

)
from users.models import (
    ExternalOrganizationMembership,
    ExternalOrganization,
    Farm, FarmMembership,
)
from ..UserPages.filters import ExternalOrganizationFilterBackend


class ExternalOrganizationAPIView(RetrieveUpdateDestroyAPIView):
    """API для работы с внешними организациями (получение/обновление/удаление)."""

    serializer_class = ExternalOrganizationSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_permissions(self):
        """Добавляем IsOrganizationAdmin для изменяющих методов."""
        permissions = super().get_permissions()
        if self.request.method in ('PATCH', 'PUT', 'DELETE'):
            permissions.append(IsOrganizationAdmin())
        return permissions

    def get_serializer_context(self):
        """Добавляем request и роль пользователя в контекст сериализатора."""
        context = super().get_serializer_context()
        slug = self.request.query_params.get('slug')

        membership = ExternalOrganizationMembership.objects.filter(
            organization__slug=slug,
            user=self.request.user
        ).first()

        context['ext_org_role'] = membership.role if membership else None
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

        organization = ExternalOrganization.objects.filter(slug=slug).first()
        if not organization:
            raise NotFound('Нет организации с таким slug')

        return organization


class ExternalOrganizationRequestUserAPIView(RetrieveAPIView):
    """API для получения данных текущего пользователя во внешней организации."""

    serializer_class = ExternalOrganizationUsersSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_object(self):
        """Возвращает membership текущего пользователя в указанной организации.

        Returns:
            ExternalOrganizationMembership: Объект членства пользователя в организации
            None: Если членство не найдено

        Raises:
            Http404: Если не передан slug организации
        """
        organization_slug = (
                self.kwargs.get('organization_slug')
                or self.request.query_params.get('organization')
        )

        if not organization_slug:
            raise Http404("Не указан slug организации")

        return (
            ExternalOrganizationMembership.objects
            .filter(
                organization__slug=organization_slug,
                user=self.request.user
            )
            .select_related('user', 'organization')
            .first()
        )

    def get_serializer_context(self):
        """Добавляет в контекст сериализатора:
        - phone_number текущего пользователя
        - роль пользователя в организации
        """
        context = super().get_serializer_context()
        context.update({
            'request_user_phone_number': self.request.user.phone_number,
            'request_user_role': self.get_object().role if self.get_object() else None
        })
        return context


class ExternalOrganizationUsersAPIVIew(ListAPIView):
    """API для получения списка пользователей внешней организации."""
    serializer_class = ExternalOrganizationUsersSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [ExternalOrganizationFilterBackend, OrderingFilter]
    ordering_fields = ['role', 'status', 'updated_at']
    ordering = ['role']

    def get_queryset(self):
        """Возвращает queryset членов организации. """
        organization_slug = self.kwargs.get('organization_slug') or self.request.query_params.get('organization')
        return (
            ExternalOrganizationMembership.objects
            .filter(organization__slug=organization_slug)
            .select_related('user', 'organization')
            .exclude(user=self.request.user)
        )

    def get_serializer_context(self):
        """Добавляем в контекст роль текущего пользователя в организации."""
        context = super().get_serializer_context()
        organization_slug = self.kwargs.get('organization_slug') or self.request.query_params.get('organization')

        try:
            context['request_user_role'] = (
                ExternalOrganizationMembership.objects
                .filter(
                    organization__slug=organization_slug,
                    user=self.request.user
                )
                .values_list('role', flat=True)
                .get()
            )
        except ExternalOrganizationMembership.DoesNotExist:
            context['request_user_role'] = None

        return context


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


class ExternalOrganizationFarmsAPIView(ListAPIView):
    serializer_class = ExtOrgFarmSerializer
    permission_classes = [IsAuthenticated,IsOrganizationMember]
    filter_backends = [FarmFilterBackend, OrderingFilter]
    ordering_fields = ['role', 'name', 'updated_at']
    ordering = ['role']

    def get_serializer_context(self):
        """Добавляем в контекст роль текущего пользователя в организации."""
        context = super().get_serializer_context()
        organization_slug = self.request.query_params.get('organization')
        context['user_phone_number'] = self.request.user.phone_number

        try:
            context['request_user_role'] = (
                ExternalOrganizationMembership.objects
                .filter(
                    organization__slug=organization_slug,
                    user=self.request.user
                )
                .values_list('role', flat=True)
                .get()
            )
        except ExternalOrganizationMembership.DoesNotExist:
            context['request_user_role'] = None

        return context

    def get_queryset(self):
        organization_slug = self.request.query_params.get('organization')
        queryset = Farm.objects.filter(organization__slug=organization_slug)
        subquerry = FarmMembership.objects.filter(
            farm_id=OuterRef('pk'), user=self.request.user
        ).values('role')

        queryset = queryset.annotate(role=Subquery(subquerry))

        return queryset


class ExtOrgCreateFarmAPIView(CreateAPIView):
    serializer_class = ExtOrgFarmSerializer
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]













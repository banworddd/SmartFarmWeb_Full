from django.db.models import Case, When, Value, IntegerField
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView, RetrieveUpdateAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .filters import (
    ExternalOrganizationFilterBackend,
    FarmMembershipFilterBackend,
)
from .permissions import IsOrganizationMember, IsOrganizationAdmin
from .serializers import (
    UserFarmMembershipsSerializer,
    UserExternalOrganizationMembershipsSerializer,
    ExternalOrganizationSerializer,
    ExternalOrganizationUsersSerializer,
    CustomUserProfileSerializer, CustomUserChangePasswordSerializer
)
from users.models import (
    FarmMembership,
    ExternalOrganizationMembership,
    ExternalOrganization,
    CustomUser,
)


class UserFarmsAPIView(ListAPIView):
    """API endpoint для получения списка ферм, к которым принадлежит текущий пользователь.

    Предоставляет:
    - Пагинированный список членств пользователя в фермах
    - Данные, отсортированные по важности роли (от owner к viewer)
    - Требует аутентификации пользователя

    Возвращает данные в формате, определенном UserFarmMembershipsSerializer.
    """

    serializer_class = UserFarmMembershipsSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [FarmMembershipFilterBackend]

    def get_queryset(self):
        """Создает и возвращает QuerySet членств пользователя в фермах с сортировкой по ролям.

        Сортировка ролей осуществляется по следующему приоритету:
        1. owner (владелец) - высший приоритет
        2. admin (администратор)
        3. manager (менеджер)
        4. technician (техник)
        5. viewer (наблюдатель) - низший приоритет

        Returns:
            QuerySet: Аннотированный и отсортированный QuerySet объектов FarmMembership
                     для текущего пользователя
        """
        # Определение кастомного порядка сортировки для ролей
        custom_order = Case(
            When(role='owner', then=Value(0)),  # owner -> 0 (высший приоритет)
            When(role='admin', then=Value(1)),  # admin -> 1
            When(role='manager', then=Value(2)),  # manager -> 2
            When(role='technician', then=Value(3)),  # technician -> 3
            When(role='viewer', then=Value(4)),  # viewer -> 4 (низший приоритет)
            output_field=IntegerField(),  # Указываем тип поля для аннотации
        )

        # Формируем QuerySet:
        queryset = (
            FarmMembership.objects
            .filter(user=self.request.user)  # Только членства текущего пользователя
            .annotate(role_order=custom_order)  # Добавляем поле для сортировки
            .order_by('role_order')  # Сортируем по приоритету ролей
        )

        return queryset


class UserExternalOrganizationsAPIView(ListAPIView):
    """API-представление для получения членств пользователя в организациях.

    Позволяет аутентифицированному пользователю получить список своих членств
    во внешних организациях с детализацией ролей и статусов.

    Attributes:
        serializer_class: Сериализатор для членств в организациях.
        permission_classes: Ограничивает доступ аутентифицированным пользователям.
    """
    serializer_class = UserExternalOrganizationMembershipsSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [ExternalOrganizationFilterBackend]

    def get_queryset(self):
        """Возвращает queryset с членствами текущего пользователя.

        Returns:
            QuerySet: Набор объектов ExternalOrganizationMembership,
                     отфильтрованный по текущему пользователю.
        """
        return ExternalOrganizationMembership.objects.filter(user=self.request.user)


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


class CustomUserProfileAPIView(RetrieveUpdateAPIView):
    serializer_class = CustomUserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class CustomUserChangePasswordAPIView(UpdateAPIView):
    serializer_class = CustomUserChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user  # обновляем текущего пользователя

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = self.get_object()
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({"detail": "Пароль успешно изменён."}, status=status.HTTP_200_OK)







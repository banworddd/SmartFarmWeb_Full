from django.db.models import Case, When, Value, IntegerField
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import BaseFilterBackend


from .serializers import UserFarmMembershipsSerializer, UserExternalOrganizationMembershipsSerializer
from users.models import FarmMembership, ExternalOrganizationMembership


class FarmMembershipFilterBackend(BaseFilterBackend):
    """Кастомный фильтр для членств в фермах"""

    def filter_queryset(self, request, queryset, view):
        # Фильтрация по роли
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        # Фильтрация по названию фермы (регистронезависимый поиск)
        farm_name = request.query_params.get('farm_name')
        if farm_name:
            queryset = queryset.filter(farm__name__icontains=farm_name)

        # Фильтрация по организации
        organization_name = request.query_params.get('organization_name')
        if organization_name:
            queryset = queryset.filter(farm__organization__name=organization_name)

        return queryset


class UserFarmsAPIView(ListAPIView):
    """API endpoint для получения списка ферм, к которым принадлежит текущий пользователь.

    Предоставляет:
    - Пагинированный список членств пользователя в фермах
    - Данные, отсортированные по важности роли (от owner к viewer)
    - Требует аутентификации пользователя

    Возвращает данные в формате, определенном UserFarmMembershipsSerializer.
    """

    serializer_class = UserFarmMembershipsSerializer
    permission_classes = [IsAuthenticated]  # Доступ только для аутентифицированных пользователей
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


class ExternalOrganizationFilterBackend(BaseFilterBackend):
    """Кастомный фильтр для членств в фермах"""

    def filter_queryset(self, request, queryset, view):
        # Фильтрация по роли
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        # Фильтрация по названию фермы (регистронезависимый поиск)
        organization_name = request.query_params.get('organization_name')
        if organization_name:
            queryset = queryset.filter(organization__name__icontains=organization_name)

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
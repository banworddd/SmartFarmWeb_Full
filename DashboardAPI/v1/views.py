from django.db.models import Case, When, Value, IntegerField
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListAPIView, RetrieveAPIView, RetrieveUpdateDestroyAPIView, ListCreateAPIView
from rest_framework.permissions import IsAuthenticated


from .filters import ExternalOrganizationFilterBackend, FarmMembershipFilterBackend
from .permissions import IsOrganizationMember
from .serializers import UserFarmMembershipsSerializer, UserExternalOrganizationMembershipsSerializer, \
    ExternalOrganizationSerializer, ExternalOrganizationUsersSerializer
from users.models import FarmMembership, ExternalOrganizationMembership, ExternalOrganization


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
    serializer_class = ExternalOrganizationSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_object(self):
        slug = self.request.query_params.get('slug')
        if not slug:
            raise NotFound('Необходимо передать параметр slug')

        obj = ExternalOrganization.objects.filter(slug=slug).first()

        if not obj:
            raise NotFound('Нет организации с таким slug')

        return obj


class ExternalOrganizationUsersAPIVIew(ListAPIView):
    serializer_class = ExternalOrganizationUsersSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [ExternalOrganizationFilterBackend]

    def get_queryset(self):
        return ExternalOrganizationMembership.objects.filter(organization__slug=self.request.query_params.get('organization'))


class ExternalOrganizationMembershipAPIView(RetrieveUpdateDestroyAPIView):
    serializer_class = ExternalOrganizationUsersSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        membership_id = self.request.query_params.get('id')
        organization_slug = self.request.query_params.get('organization')

        if not membership_id or not organization_slug:
            raise NotFound('Требуются параметры id и organization')

        try:
            # Получаем объект организации, а не строку
            organization = ExternalOrganization.objects.get(slug=organization_slug)
            membership = ExternalOrganizationMembership.objects.filter(
                id=membership_id,
                organization=organization  # Передаем объект, а не строку
            ).first()
            print(type(membership))
            return membership
        except (ExternalOrganization.DoesNotExist, ExternalOrganizationMembership.DoesNotExist):
            raise NotFound('Запись не найдена')






from django.db.models import QuerySet
from rest_framework.filters import OrderingFilter
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from .filters import (
    ExternalOrganizationFilterBackend,
    FarmMembershipFilterBackend,
)
from .serializers import (
    UserExternalOrganizationMembershipsSerializer,
    UserFarmMembershipsSerializer,
)
from users.models import (
    ExternalOrganizationMembership,
    FarmMembership,
)


class UserFarmsAPIView(ListAPIView):
    """
    Представление API для получения списка ферм, участником которых является
    аутентифицированный пользователь. Поддерживает фильтрацию и сортировку.
    """
    serializer_class = UserFarmMembershipsSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [FarmMembershipFilterBackend, OrderingFilter]
    ordering_fields = ['role', 'updated_at', 'farm__name']
    ordering = ['role']

    def get_queryset(self) -> QuerySet:
        """
        Возвращает queryset с членствами пользователя в фермах.
        """
        return FarmMembership.objects.filter(user=self.request.user)


class UserExternalOrganizationsAPIView(ListAPIView):
    """
    API-представление для получения членств пользователя во внешних организациях.

    Позволяет аутентифицированному пользователю получить список своих членств
    во внешних организациях с детализацией ролей и статусов. Поддерживает фильтрацию и сортировку.
    """
    serializer_class = UserExternalOrganizationMembershipsSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [ExternalOrganizationFilterBackend, OrderingFilter]
    ordering_fields = ['role', 'updated_at', 'organization__name']
    ordering = ['role']

    def get_queryset(self) -> QuerySet:
        """
        Возвращает queryset с членствами пользователя во внешних организациях.
        """
        return ExternalOrganizationMembership.objects.filter(user=self.request.user)







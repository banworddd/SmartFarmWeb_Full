from django.db.models import Case, When, Value, IntegerField
from rest_framework.filters import OrderingFilter
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from .filters import (
    ExternalOrganizationFilterBackend,
    FarmMembershipFilterBackend
)
from .serializers import (
    UserFarmMembershipsSerializer,
    UserExternalOrganizationMembershipsSerializer,
)
from users.models import (
    FarmMembership,
    ExternalOrganizationMembership,
)


class UserFarmsAPIView(ListAPIView):

    serializer_class = UserFarmMembershipsSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [FarmMembershipFilterBackend, OrderingFilter]
    ordering_fields = ['role', 'created_at', 'updated_at']
    ordering = ['role']

    def get_queryset(self):
        return FarmMembership.objects.filter(user=self.request.user)


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
        return ExternalOrganizationMembership.objects.filter(user=self.request.user)







from django.db.models import Case, When, Value, IntegerField
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from .serializers import UserFarmMembershipsSerializer
from users.models import FarmMembership


class UserFarmsAPIView(ListAPIView):
    serializer_class = UserFarmMembershipsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        custom_order = Case(
            When(role='owner', then=Value(0)),
            When(role='admin', then=Value(1)),
            When(role='manager', then=Value(2)),
            When(role='technician', then=Value(3)),
            When(role='viewer', then=Value(4)),
            output_field=IntegerField(),
        )

        queryset = (
            FarmMembership.objects
            .filter(user=self.request.user)
            .annotate(role_order=custom_order)
            .order_by('role_order')
        )

        return queryset


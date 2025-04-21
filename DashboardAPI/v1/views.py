from django.db.models import Q
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from .serializers import UserFarmsSerializer, FarmMembershipSerializer
from users.models import Farm, FarmMembership


class UserFarmsAPIView(ListAPIView):
    serializer_class = FarmMembershipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = FarmMembership.objects.filter(user=self.request.user)
        return queryset.order_by('role')


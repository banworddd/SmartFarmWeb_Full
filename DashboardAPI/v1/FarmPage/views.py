
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated


from .serializers import (
FarmSerializer, FarmMembershipsSerializer
)
from users.models import (
    FarmMembership,
    ExternalOrganization,
  Farm,
)
from ..UserPages.serializers import UserExternalOrganizationSerializer


class FarmAPIView(RetrieveUpdateAPIView):
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated]


    def get_object(self):
        slug = self.request.query_params.get('slug')
        return Farm.objects.filter(slug=slug).first()

class FarmOrganizationAPIView(RetrieveAPIView):
    serializer_class = UserExternalOrganizationSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        slug = self.request.query_params.get('slug')
        return ExternalOrganization.objects.filter(farms__slug=slug).first()


class FarmMembershipsAPIView(ListAPIView):
    serializer_class = FarmMembershipsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        slug = self.request.query_params.get('slug')
        return FarmMembership.objects.filter(farm__slug=slug)





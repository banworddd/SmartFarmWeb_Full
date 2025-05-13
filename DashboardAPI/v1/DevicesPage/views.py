from rest_framework import status

from rest_framework.generics import RetrieveUpdateAPIView, UpdateAPIView, RetrieveAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from dashboard.models import DeviceModel, Device, Zone, DeviceLocation
from users.models import Farm, ExternalOrganization, ExternalOrganizationMembership, FarmMembership
from .serializers import OrgFarmsSerializer, OrgFarmZonesSerializer, ZoneDevicesSerializer


class OrgFarmsListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrgFarmsSerializer

    def get_queryset(self):
        org = ExternalOrganization.objects.filter(slug=self.request.query_params.get('organization')).first()
        org_membership = ExternalOrganizationMembership.objects.filter(organization=org, user=self.request.user).first()
        if org_membership.role =='admin':
            return Farm.objects.filter(organization__slug=self.request.query_params.get('organization'))
        else:
            return Farm.objects.filter(organization__slug=self.request.query_params.get('organization'), farmmembership__user = self.request.user)


class OrgFarmZonesListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrgFarmZonesSerializer

    def get_queryset(self):
        return Zone.objects.filter(farm__slug=self.request.query_params.get('farm'))

class FarmZonesDevicesAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ZoneDevicesSerializer

    def get_queryset(self):
        print(Zone.objects.filter(name=self.request.query_params.get('zone')).first())
        return Device.objects.filter(location__zone = Zone.objects.filter(name=self.request.query_params.get('zone')).first())















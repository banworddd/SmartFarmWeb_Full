from rest_framework import status

from rest_framework.generics import RetrieveUpdateAPIView, UpdateAPIView, RetrieveAPIView, ListAPIView, CreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from dashboard.models import DeviceModel, Device, Zone, DeviceLocation
from users.models import Farm, ExternalOrganization, ExternalOrganizationMembership, FarmMembership
from .serializers import OrgFarmsSerializer, OrgFarmZonesSerializer, ZoneDevicesSerializer, DeviceModelSerializer, \
    AddDeviceSerializer, DeviceLocationSerializer


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
        return Device.objects.filter(location__zone = Zone.objects.filter(name=self.request.query_params.get('zone')).first())

class DeviceInfoAPIView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ZoneDevicesSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'pk'
    queryset = Device.objects.all()


class DeviceModelsAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DeviceModelSerializer
    queryset = DeviceModel.objects.all()

class AddDeviceAPIView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AddDeviceSerializer

class AddDeviceLocationAPIView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DeviceLocationSerializer

class UpdateDeviceAPIView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ZoneDevicesSerializer
    lookup_url_kwarg = 'pk'
    lookup_field = 'id'
    queryset = Device.objects.all()

class UpdateDeviceLocationAPIView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DeviceLocationSerializer
    lookup_url_kwarg = 'pk'
    lookup_field = 'id'
    queryset = DeviceLocation.objects.all()
















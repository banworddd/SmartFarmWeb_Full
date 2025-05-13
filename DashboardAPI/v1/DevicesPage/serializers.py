from rest_framework import serializers
from users.models import (
    CustomUser,
    ExternalOrganizationMembership,
    ExternalOrganization,
    Farm,
    FarmMembership,
)

from dashboard.models import (
    Zone, Device, DeviceModel
)

class OrgFarmsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = ['id', 'slug', 'name']

class OrgFarmZonesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = '__all__'

class DeviceModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceModel
        fields = '__all__'

class ZoneDevicesSerializer(serializers.ModelSerializer):
    model = DeviceModelSerializer()

    class Meta:
        model = Device
        fields = '__all__'













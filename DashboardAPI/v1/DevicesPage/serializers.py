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
    updated_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    class Meta:
        model = DeviceModel
        fields = ["id", "updated_at", "name", "manufacturer", "device_type", "description", "specifications"]

class ZoneDevicesSerializer(serializers.ModelSerializer):
    model = DeviceModelSerializer()
    created_at =serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    updated_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    class Meta:
        model = Device
        fields = '__all__'













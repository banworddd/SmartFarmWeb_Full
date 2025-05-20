from rest_framework import serializers
from rest_framework.fields import SerializerMethodField

from users.models import (
    CustomUser,
    ExternalOrganizationMembership,
    ExternalOrganization,
    Farm,
    FarmMembership,
)

from dashboard.models import (
    Zone, Device, DeviceModel, DeviceLocation
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


class AddDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = '__all__'

class DeviceLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceLocation
        fields = ['device', 'zone']


class ZoneDevicesSerializer(serializers.ModelSerializer):
    model = DeviceModelSerializer()
    created_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    updated_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    gateway_name = serializers.SerializerMethodField()
    added_by_name = serializers.SerializerMethodField()
    farm_name = serializers.SerializerMethodField()
    device_zone = serializers.SerializerMethodField()
    device_location_id = serializers.SerializerMethodField()
    farm_slug = serializers.SerializerMethodField()
    class Meta:
        model = Device
        fields = '__all__'

    @staticmethod
    def get_gateway_name(obj):
        if obj.gateway_device:
          return obj.gateway_device.name
        else:
            return None

    @staticmethod
    def get_added_by_name(obj):
        if obj.added_by:
            return obj.added_by.first_name + " " + obj.added_by.last_name
        else:
            return None

    @staticmethod
    def get_farm_name(obj):
        if obj.farm:
            return obj.farm.name
        else:
            return None

    @staticmethod
    def get_farm_slug(obj):
        if obj.farm:
            return obj.farm.slug
        else:
            return None

    @staticmethod
    def get_device_zone(obj):
        if DeviceLocation.objects.filter(device__id=obj.id).exists():
            return DeviceLocation.objects.filter(device__id=obj.id).first().zone.name
        else:
            return None

    @staticmethod
    def get_device_location_id(obj):
        if DeviceLocation.objects.filter(device__id=obj.id).exists():
            return DeviceLocation.objects.filter(device__id=obj.id).first().id
        else:
            return None




















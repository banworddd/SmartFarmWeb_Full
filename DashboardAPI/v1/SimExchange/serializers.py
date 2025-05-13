from rest_framework import serializers
from dashboard.models import (
    DeviceModel,
    Device,
    DeviceEvent,
    DeviceCommand,
    DeviceStatus)


class DeviceModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceModel
        fields = '__all__'
        read_only_fields = ('id',)

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = '__all__'
        read_only_fields = ('id',)









from rest_framework import serializers

from DashboardAPI.v1.ExtOrgPage.serializers import ExternalOrganizationUserSerializer
from users.models import Farm, FarmMembership
from dashboard.models import Zone


class FarmSerializer(serializers.ModelSerializer):
    updated_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    created_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    class Meta:
        model = Farm
        fields = '__all__'

class FarmMembershipsSerializer(serializers.ModelSerializer):
    updated_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    user = ExternalOrganizationUserSerializer()
    class Meta:
        model = FarmMembership
        fields = '__all__'

class ZoneSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M", read_only=True)
    updated_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M", read_only=True)

    class Meta:
        model = Zone
        fields = ['id', 'name', 'farm', 'zone_type', 'description', 'area', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']







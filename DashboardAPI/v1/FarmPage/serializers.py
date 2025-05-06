from rest_framework import serializers

from DashboardAPI.v1.ExtOrgPage.serializers import ExternalOrganizationUserSerializer
from users.models import Farm, FarmMembership


class FarmSerializer(serializers.ModelSerializer):
    owner = ExternalOrganizationUserSerializer(read_only=True)
    class Meta:
        model = Farm
        fields = '__all__'

class FarmMembershipsSerializer(serializers.ModelSerializer):
    updated_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    user = ExternalOrganizationUserSerializer()
    class Meta:
        model = FarmMembership
        fields = '__all__'






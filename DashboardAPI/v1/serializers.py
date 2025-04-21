from rest_framework import serializers
from users.models import CustomUser, Farm, FarmMembership, FarmGroup

class UserFarmsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = '__all__'


class FarmMembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmMembership
        fields = '__all__'

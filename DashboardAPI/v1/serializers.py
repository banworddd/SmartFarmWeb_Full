from rest_framework import serializers
from users.models import CustomUser, Farm, FarmMembership, FarmGroup


class UserFarmsSerializer(serializers.ModelSerializer):
    owner_full_name = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = ['id', 'name', 'description', 'owner_full_name']

    @staticmethod
    def get_owner_full_name(obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}"


class UserFarmMembershipsSerializer(serializers.ModelSerializer):
    farm = UserFarmsSerializer()

    class Meta:
        model = FarmMembership
        fields = '__all__'

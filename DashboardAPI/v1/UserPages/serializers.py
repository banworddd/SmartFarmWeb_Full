from rest_framework import serializers

from users.models import (
    ExternalOrganization,
    ExternalOrganizationMembership,
    Farm,
    FarmMembership,
)


class UserFarmsSerializer(serializers.ModelSerializer):
    """
    Сериализатор для представления информации о ферме, включая
    имя владельца и название организации.
    """
    owner_full_name = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = ['id', 'name', 'description', 'owner_full_name', 'organization_name']

    @staticmethod
    def get_owner_full_name(obj: Farm) -> str:
        """
        Возвращает полное имя владельца фермы.
        """
        return f"{obj.owner.first_name} {obj.owner.last_name}"

    @staticmethod
    def get_organization_name(obj: Farm) -> str:
        """
        Возвращает название организации, к которой принадлежит ферма.
        """
        return obj.organization.name


class UserFarmMembershipsSerializer(serializers.ModelSerializer):
    """
    Сериализатор для отображения членства пользователя в ферме,
    включая информацию о ферме, дате вступления, последнем обновлении
    и сгенерированном слаге фермы.
    """
    farm = UserFarmsSerializer()
    joined_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    updated_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    farm_slug = serializers.SerializerMethodField()

    class Meta:
        model = FarmMembership
        fields = ['farm', 'joined_at', 'updated_at', 'farm_slug', 'role']

    @staticmethod
    def get_farm_slug(obj: FarmMembership) -> str:
        """
        Возвращает слаг (slug) фермы, связанной с данным членством.
        """
        return obj.farm.slug


class UserExternalOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalOrganization
        fields = ['id', 'name', 'address', 'description', 'type', 'slug']


class UserExternalOrganizationMembershipsSerializer(serializers.ModelSerializer):
    organization = UserExternalOrganizationSerializer()
    updated_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")

    class Meta:
        model = ExternalOrganizationMembership
        fields = ['id', 'organization', 'role', 'status', 'updated_at']








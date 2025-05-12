from rest_framework import serializers
from users.models import (
    CustomUser,
    ExternalOrganizationMembership,
    ExternalOrganization,
    Farm,
    FarmMembership,
)


class ExternalOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalOrganization
        fields = [
            'name',
            'type',
            'address',
            'email',
            'phone',
            'website',
            'description',
            'created_at',
            'updated_at',
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request_user_role = self.context.get('ext_org_role')

        if request_user_role not in ['admin', 'manager']:
            representation.pop('created_at', None)
            representation.pop('updated_at', None)

        return representation


class ExternalOrganizationUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'first_name',
            'last_name',
            'phone_number',
            'email',
            'profile_pic',
        ]


class ExternalOrganizationUsersSerializer(serializers.ModelSerializer):
    updated_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    user = ExternalOrganizationUserSerializer()

    class Meta:
        model = ExternalOrganizationMembership
        fields = [
            'id',
            'user',
            'role',
            'status',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'updated_at',
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request_user_role = self.context.get('request_user_role')
        request_user_phone_number = self.context.get('request_user_phone_number')
        user_data = representation.get('user', {})

        if (
            request_user_phone_number
            and user_data.get('phone_number') == request_user_phone_number
        ):
            return representation

        if request_user_role not in ['admin', 'manager']:
            sensitive_fields = ['phone_number', 'email']
            for field in sensitive_fields:
                if field in user_data:
                    user_data.pop(field)

        return representation


class ExtOrgFarmSerializer(serializers.ModelSerializer):
    updated_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M", read_only=True)
    owner_full_name = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = [
            'name',
            'slug',
            'updated_at',
            'description',
            'owner_full_name',
            'owner',
            'organization',
        ]

    @staticmethod
    def get_owner_full_name(obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}"

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        representation['role'] = instance.role if hasattr(instance, 'role') else None

        request_user_role = self.context.get('request_user_role')
        user_phone_number = self.context.get('user_phone_number')

        user_farm_role = FarmMembership.objects.filter(
            farm=instance,
            user__phone_number=user_phone_number
        ).first()

        if request_user_role in ['admin', 'manager']:
            return representation

        if not user_farm_role:
            fields_to_remove = [
                'created_at',
                'updated_at',
                'slug',
                'owner_full_name',
                'owner',
            ]
            for field in fields_to_remove:
                representation.pop(field, None)

        return representation












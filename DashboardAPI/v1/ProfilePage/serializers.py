from rest_framework import serializers
from users.models import CustomUser


class CustomUserProfileSerializer(serializers.ModelSerializer):
    date_joined = serializers.DateTimeField(format="%d.%m.%Y %H:%M")

    class Meta:
        model = CustomUser
        fields = ['date_joined', 'last_name', 'first_name', 'email', 'phone_number', 'profile_pic','is_active', 'is_deleted']
        read_only_fields = ['date_joined']


class CustomUserChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    new_password_confirmation = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError('Неверный текущий пароль')

        if attrs["new_password"] != attrs["new_password_confirmation"]:
            raise serializers.ValidationError('Введенные пароли не совпадают')

        return attrs







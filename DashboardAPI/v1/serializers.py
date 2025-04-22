from rest_framework import serializers
from users.models import CustomUser, Farm, FarmMembership, FarmGroup


class UserFarmsSerializer(serializers.ModelSerializer):
    """Сериализатор для отображения информации о ферме пользователя.

    Включает базовую информацию о ферме и полное имя владельца.
    """
    owner_full_name = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = ['id', 'name', 'description', 'owner_full_name']
        """
        Поля:
            id (int): Уникальный идентификатор фермы
            name (str): Название фермы
            description (str): Описание фермы
            owner_full_name (str): Полное имя владельца фермы (first_name + last_name)
        """

    @staticmethod
    def get_owner_full_name(obj):
        """Генерирует полное имя владельца фермы.

        Args:
            obj (Farm): Объект фермы

        Returns:
            str: Строка в формате "{first_name} {last_name}"
        """
        return f"{obj.owner.first_name} {obj.owner.last_name}"


class UserFarmMembershipsSerializer(serializers.ModelSerializer):
    """Сериализатор для членства пользователя в ферме.

    Включает:
    - полную информацию о ферме через UserFarmsSerializer
    - даты в формате "дд.мм.гггг чч:мм"
    - все поля модели FarmMembership
    """
    farm = UserFarmsSerializer()
    joined_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")
    updated_at = serializers.DateTimeField(format="%d.%m.%Y %H:%M")

    class Meta:
        model = FarmMembership
        fields = '__all__'
        """
        Поля модели FarmMembership:
            id (int): Уникальный идентификатор членства
            user (int): ID пользователя (ForeignKey)
            farm (dict): Информация о ферме (сериализованная через UserFarmsSerializer)
            role (str): Роль пользователя в ферме (owner/admin/manager/technician/viewer)
            joined_at (str): Дата присоединения в формате "дд.мм.гггг чч:мм"
            updated_at (str): Дата обновления в формате "дд.мм.гггг чч:мм"
        """
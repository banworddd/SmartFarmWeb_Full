from rest_framework.filters import BaseFilterBackend


class FarmMembershipFilterBackend(BaseFilterBackend):
    """Кастомный фильтр для членств в фермах"""

    def filter_queryset(self, request, queryset, view):
        # Фильтрация по роли
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        # Фильтрация по названию фермы (регистронезависимый поиск)
        farm_name = request.query_params.get('farm_name')
        if farm_name:
            queryset = queryset.filter(farm__name__icontains=farm_name)

        # Фильтрация по организации
        organization_name = request.query_params.get('organization_name')
        if organization_name:
            queryset = queryset.filter(farm__organization__name=organization_name)

        return queryset


class ExternalOrganizationFilterBackend(BaseFilterBackend):
    """Кастомный фильтр для членств в фермах"""

    def filter_queryset(self, request, queryset, view):
        # Фильтрация по роли
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        status = request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        # Фильтрация по типу организации
        organization_type = request.query_params.get('organization_type')
        if organization_type:
            queryset = queryset.filter(organization__type=organization_type)

        # Фильтрация по названию организации
        organization_name = request.query_params.get('organization_name')
        if organization_name:
            queryset = queryset.filter(organization__name__icontains=organization_name)

        return queryset
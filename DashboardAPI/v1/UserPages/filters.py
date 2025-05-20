from django.db.models import Q
from rest_framework.filters import BaseFilterBackend


class FarmMembershipFilterBackend(BaseFilterBackend):
    """Кастомный фильтр для членств в фермах"""

    def filter_queryset(self, request, queryset, view):
        # Фильтрация по роли
        roles = request.query_params.getlist('role', [])
        if not roles:
            role_param = request.query_params.get('role', '')
            roles = [r.strip() for r in role_param.split(',') if r.strip()]

        if roles:
            queryset = queryset.filter(role__in=roles)

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

        username = request.query_params.get('user_name')
        if username:
            queryset = queryset.filter(Q(user__first_name__icontains=username)|Q(user__last_name__icontains=username))

        # Фильтрация по типу организации
        organization_type = request.query_params.get('organization_type')
        if organization_type:
            queryset = queryset.filter(organization__type=organization_type)

        # Фильтрация по названию организации
        organization_name = request.query_params.get('organization_name')
        if organization_name:
            queryset = queryset.filter(organization__name__icontains=organization_name)

        return queryset


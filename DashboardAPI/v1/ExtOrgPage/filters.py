from django.db.models import Q
from rest_framework.filters import BaseFilterBackend


class FarmFilterBackend(BaseFilterBackend):
    """Кастомный фильтр для членств в фермах"""

    def filter_queryset(self, request, queryset, view):

        # Фильтрация по организации
        search_query = request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(Q(owner__first_name__icontains=search_query) | Q(owner__last_name__icontains=search_query)| Q(name__icontains=search_query))

        return queryset


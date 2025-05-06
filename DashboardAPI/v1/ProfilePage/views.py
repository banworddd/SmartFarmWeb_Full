
from rest_framework import status

from rest_framework.generics import  RetrieveUpdateAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import (

    CustomUserProfileSerializer, CustomUserChangePasswordSerializer,

)


class CustomUserProfileAPIView(RetrieveUpdateAPIView):
    serializer_class = CustomUserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class CustomUserChangePasswordAPIView(UpdateAPIView):
    serializer_class = CustomUserChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = self.get_object()
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({"detail": "Пароль успешно изменён."}, status=status.HTTP_200_OK)







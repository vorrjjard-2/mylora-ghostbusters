from django.shortcuts import render
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from django.views.decorators.csrf import ensure_csrf_cookie

from django.contrib.auth import logout
from rest_framework.response import Response

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_400_BAD_REQUEST
        )

    login(request, user)
    return Response({'message': 'Logged in'})

@ensure_csrf_cookie
@api_view(["GET"])
def me_view(request):
    if not request.user.is_authenticated:
        return Response({"authenticated": False})

    roles = list(
        request.user.groups.values_list("name", flat=True)
    )

    return Response({
        "authenticated": True,
        "username": request.user.username,
        "roles": roles,
    })


@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"success": True})
from django.shortcuts import render
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

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


@api_view(['GET'])
def me_view(request):
    if not request.user.is_authenticated:
        return Response({'authenticated': False})

    return Response({
        'authenticated': True,
        'username': request.user.username,
    })
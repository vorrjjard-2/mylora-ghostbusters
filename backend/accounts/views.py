from django.shortcuts import render
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from django.views.decorators.csrf import ensure_csrf_cookie

from django.contrib.auth import logout
from rest_framework.response import Response

from django.contrib.auth.models import User
from .models import Customer, CreditAccount
from orders.models import Order

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


@api_view(["POST"])
def signup_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        password=password,
    )

    return Response({"success": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_dashboard(request):
    """Get customer dashboard data including credit info and recent orders"""
    try:
        # Get customer profile
        customer = Customer.objects.get(user=request.user)
        
        # Get credit account
        credit_account = customer.credit_account
        
        # Get 3 most recent orders
        recent_orders = Order.objects.filter(account=credit_account).order_by('-date_ordered')[:3]
        
        orders_data = []
        for order in recent_orders:
            orders_data.append({
                'order_id': f"XX{order.order_id}",
                'raw_id': order.order_id,
                'amount': str(order.total_amount),
                'date_ordered': order.date_ordered.strftime('%B %d, %Y'),
                'status': order.order_status
            })
        
        return Response({
            'user': {
                'name': request.user.get_full_name() or request.user.username,
            },
            'credit': {
                'available_credit': str(credit_account.available_credit),
                'credit_limit': str(credit_account.credit_limit),
                'outstanding_balance': str(credit_account.outstanding_bal)
            },
            'recent_orders': orders_data
        })
        
    except Customer.DoesNotExist:
        return Response(
            {
                'error': 'Customer profile not found',
                'message': 'Your account setup is not complete. Please contact support.'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    except CreditAccount.DoesNotExist:
        return Response(
            {
                'error': 'Credit account not found',
                'message': 'Your credit account is not set up yet. Please contact support.'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
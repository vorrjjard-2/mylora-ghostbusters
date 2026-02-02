from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from decimal import Decimal

from .models import Order, OrderItem
from accounts.models import Customer, CreditAccount
from products.models import Product


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    """Create a new purchase order"""
    try:
        # Get customer and credit account
        customer = Customer.objects.get(user=request.user)
        credit_account = customer.credit_account
        
        # Extract data
        delivery_mode = request.data.get("delivery_mode", "DELIVERY")
        shipping_address = request.data.get("shipping_address", "")
        items = request.data.get("items", [])
        
        if not items:
            return Response(
                {"error": "Order must contain at least one item"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate total
        total_amount = Decimal("0.00")
        for item in items:
            quantity = Decimal(str(item["quantity"]))
            unit_price = Decimal(str(item["unit_price"]))
            total_amount += quantity * unit_price
        
        # Check if customer has enough available credit
        if total_amount > credit_account.available_credit:
            return Response(
                {
                    "error": "Insufficient credit",
                    "message": f"Order total (₱{total_amount}) exceeds available credit (₱{credit_account.available_credit})",
                    "required": str(total_amount),
                    "available": str(credit_account.available_credit)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create order and items in transaction
        with transaction.atomic():
            # Create order
            order = Order.objects.create(
                account=credit_account,
                branch=credit_account.branch,
                delivery_mode=delivery_mode,
                shipping_address=shipping_address,
                total_amount=total_amount,
                order_status="PENDING"
            )
            
            # Create order items
            for item_data in items:
                product = Product.objects.get(product_id=item_data["product_id"])
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=Decimal(str(item_data["quantity"])),
                    unit_price=Decimal(str(item_data["unit_price"]))
                )
            
            # Reduce available credit (reserve it)
            credit_account.available_credit -= total_amount
            credit_account.save()
        
        return Response({
            "success": True,
            "order_id": order.order_id,
            "total_amount": str(total_amount),
            "message": "Order created successfully"
        }, status=status.HTTP_201_CREATED)
        
    except Customer.DoesNotExist:
        return Response(
            {"error": "Customer profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except CreditAccount.DoesNotExist:
        return Response(
            {"error": "Credit account not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_orders(request):
    """Get all orders for the logged-in customer"""
    try:
        customer = Customer.objects.get(user=request.user)
        credit_account = customer.credit_account
        
        orders = Order.objects.filter(account=credit_account).order_by('-date_ordered')
        
        data = []
        for order in orders:
            data.append({
                'order_id': order.order_id,
                'total_amount': str(order.total_amount),
                'order_status': order.order_status,
                'delivery_mode': order.delivery_mode,
                'date_ordered': order.date_ordered.strftime('%B %d, %Y'),
                'shipping_address': order.shipping_address
            })
        
        return Response(data)
        
    except Customer.DoesNotExist:
        return Response(
            {"error": "Customer profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

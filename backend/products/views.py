from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal, InvalidOperation

from .models import Product
from accounts.models import Branch, log_audit


def _require_role(request, role_name):
    return request.user.groups.filter(name=role_name).exists()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def product_list(request):
    """Get all available products"""
    products = Product.objects.select_related('branch').all().order_by('name')

    data = []
    for product in products:
        data.append({
            'product_id': product.product_id,
            'name': product.name,
            'unit_price': str(product.unit_price),
            'unit': product.unit,
            'branch_id': product.branch_id,
            'branch_name': product.branch.name if product.branch else None,
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_products_list(request):
    """Get all products for upper management"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    products = Product.objects.select_related('branch').all().order_by('name')

    data = []
    for product in products:
        data.append({
            'product_id': product.product_id,
            'name': product.name,
            'unit_price': str(product.unit_price),
            'unit': product.unit,
            'branch_id': product.branch_id,
            'branch_name': product.branch.name if product.branch else None,
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_branches_list(request):
    """Get all branches for dropdown"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    branches = Branch.objects.all().order_by('name')
    data = [{'branch_id': b.branch_id, 'name': b.name} for b in branches]
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def um_product_create(request):
    """Create a new product"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    name = request.data.get("name", "").strip()
    unit = request.data.get("unit", "").strip()
    unit_price = request.data.get("unit_price")
    branch_id = request.data.get("branch_id")

    if not name or not unit or unit_price is None:
        return Response({"error": "Name, unit, and unit price are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        unit_price = Decimal(str(unit_price))
        if unit_price < 0:
            return Response({"error": "Unit price must be non-negative."}, status=status.HTTP_400_BAD_REQUEST)
    except (InvalidOperation, ValueError):
        return Response({"error": "Invalid unit price."}, status=status.HTTP_400_BAD_REQUEST)

    branch = None
    if branch_id:
        try:
            branch = Branch.objects.get(branch_id=branch_id)
        except Branch.DoesNotExist:
            return Response({"error": "Branch not found."}, status=status.HTTP_404_NOT_FOUND)

    product = Product.objects.create(
        name=name,
        unit=unit,
        unit_price=unit_price,
        branch=branch,
    )

    log_audit(request.user, "PRODUCT_CREATED", {
        "product_id": product.product_id,
        "name": name,
        "unit_price": str(unit_price),
        "branch": branch.name if branch else None,
    }, request)

    return Response({
        "product_id": product.product_id,
        "name": product.name,
        "unit_price": str(product.unit_price),
        "unit": product.unit,
        "branch_id": product.branch_id,
        "branch_name": product.branch.name if product.branch else None,
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_product_detail(request, product_id):
    """Get a single product"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    try:
        product = Product.objects.select_related('branch').get(product_id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        "product_id": product.product_id,
        "name": product.name,
        "unit_price": str(product.unit_price),
        "unit": product.unit,
        "branch_id": product.branch_id,
        "branch_name": product.branch.name if product.branch else None,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def um_product_update(request, product_id):
    """Update a product"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    try:
        product = Product.objects.select_related('branch').get(product_id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    name = request.data.get("name", "").strip()
    unit = request.data.get("unit", "").strip()
    unit_price = request.data.get("unit_price")
    branch_id = request.data.get("branch_id")

    if not name or not unit or unit_price is None:
        return Response({"error": "Name, unit, and unit price are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        unit_price = Decimal(str(unit_price))
        if unit_price < 0:
            return Response({"error": "Unit price must be non-negative."}, status=status.HTTP_400_BAD_REQUEST)
    except (InvalidOperation, ValueError):
        return Response({"error": "Invalid unit price."}, status=status.HTTP_400_BAD_REQUEST)

    branch = None
    if branch_id:
        try:
            branch = Branch.objects.get(branch_id=branch_id)
        except Branch.DoesNotExist:
            return Response({"error": "Branch not found."}, status=status.HTTP_404_NOT_FOUND)

    old_name = product.name
    old_price = str(product.unit_price)
    old_branch = product.branch.name if product.branch else None

    product.name = name
    product.unit = unit
    product.unit_price = unit_price
    product.branch = branch
    product.save()

    log_audit(request.user, "PRODUCT_UPDATED", {
        "product_id": product.product_id,
        "old_name": old_name,
        "new_name": name,
        "old_price": old_price,
        "new_price": str(unit_price),
        "old_branch": old_branch,
        "new_branch": branch.name if branch else None,
    }, request)

    return Response({
        "product_id": product.product_id,
        "name": product.name,
        "unit_price": str(product.unit_price),
        "unit": product.unit,
        "branch_id": product.branch_id,
        "branch_name": product.branch.name if product.branch else None,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def um_product_delete(request, product_id):
    """Delete a product"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    try:
        product = Product.objects.select_related('branch').get(product_id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    log_audit(request.user, "PRODUCT_DELETED", {
        "product_id": product.product_id,
        "name": product.name,
        "unit_price": str(product.unit_price),
        "branch": product.branch.name if product.branch else None,
    }, request)

    product.delete()

    return Response({"message": "Product deleted successfully."})

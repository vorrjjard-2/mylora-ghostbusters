from django.shortcuts import render
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.middleware.csrf import get_token

from django.contrib.auth import logout
from rest_framework.response import Response

from django.contrib.auth.models import User
from .models import Customer, CreditAccount, AuditLog, log_audit
from orders.models import Order

@ensure_csrf_cookie
@api_view(['POST'])
@authentication_classes([])
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
    log_audit(user=user, action="LOGIN", details={"username": username}, request=request)
    return Response({'message': 'Logged in', 'csrfToken': get_token(request)})

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
        "csrfToken": get_token(request),
    })


@api_view(["POST"])
def logout_view(request):
    user = request.user
    log_audit(user=user if user.is_authenticated else None, action="LOGOUT", details={"username": user.username if user.is_authenticated else "anonymous"}, request=request)
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
                'order_id': order.order_id,
                'raw_id': order.order_id,
                'amount': str(order.total_amount),
                'date_ordered': order.date_ordered.strftime('%B %d, %Y'),
                'status': order.order_status
            })
        
        available_credit = credit_account.credit_limit - credit_account.outstanding_bal

        return Response({
            'user': {
                'name': request.user.get_full_name() or request.user.username,
            },
            'credit': {
                'available_credit': str(available_credit),
                'credit_limit': str(credit_account.credit_limit),
                'outstanding_balance': str(credit_account.outstanding_bal),
                'credit_term': credit_account.credit_term,
                'branch': {
                    'name': credit_account.branch.name,
                    'address': credit_account.branch.address,
                },
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_profile(request):
    """Get customer profile information"""
    try:
        customer = Customer.objects.get(user=request.user)
        app = customer.application
        
        return Response({
            'name': request.user.get_full_name() or request.user.username,
            'phone': app.phone_number if app else "",
            'email': app.email if app else request.user.email,
            'address1': app.address1 if app else "",
            'address2': app.address2 if app else "",
            'province': app.province if app else "",
            'barangay': app.barangay if app else "",
            'city': app.city if app else "",
            'zipcode': app.zipcode if app else "",
            'billing_address1': app.billing_address1 if app else "",
            'billing_address2': app.billing_address2 if app else "",
            'billing_province': app.billing_province if app else "",
            'billing_barangay': app.billing_barangay if app else "",
            'billing_city': app.billing_city if app else "",
            'billing_zipcode': app.billing_zipcode if app else "",
        })
        
    except Customer.DoesNotExist:
        return Response(
            {'error': 'Customer profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change customer password"""
    current_password = request.data.get("current_password")
    new_password = request.data.get("new_password")
    
    if not current_password or not new_password:
        return Response(
            {"error": "Both current and new password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify current password
    if not request.user.check_password(current_password):
        return Response(
            {"error": "Current password is incorrect"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Set new password
    request.user.set_password(new_password)
    request.user.save()
    
    return Response({"success": True, "message": "Password changed successfully"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_address(request):
    """Update customer address details"""
    try:
        customer = Customer.objects.get(user=request.user)
        app = customer.application
        
        if not app:
            return Response(
                {"error": "Application not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update delivery address fields
        app.address1 = request.data.get("address1", app.address1)
        app.address2 = request.data.get("address2", app.address2)
        app.barangay = request.data.get("barangay", app.barangay)
        app.city = request.data.get("city", app.city)
        app.zipcode = request.data.get("zipcode", app.zipcode)

        # Update billing address fields
        app.billing_address1 = request.data.get("billing_address1", app.billing_address1)
        app.billing_address2 = request.data.get("billing_address2", app.billing_address2)
        app.billing_barangay = request.data.get("billing_barangay", app.billing_barangay)
        app.billing_city = request.data.get("billing_city", app.billing_city)
        app.billing_province = request.data.get("billing_province", app.billing_province)
        app.billing_zipcode = request.data.get("billing_zipcode", app.billing_zipcode)
        app.save()
        
        return Response({"success": True, "message": "Address updated successfully"})
        
    except Customer.DoesNotExist:
        return Response(
            {'error': 'Customer profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Employee Management endpoints

def _require_role(request, role_name):
    """Return True if the user has the given group."""
    return request.user.groups.filter(name=role_name).exists()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_employees_list(request):
    """Get all employees (users with groups) for upper management"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from django.contrib.auth.models import Group
    
    # Get only credit managers and order processors
    allowed_groups = Group.objects.filter(name__in=['credit_manager', 'order_processor'])
    employees = User.objects.filter(groups__in=allowed_groups).distinct().order_by('username')
    
    data = []
    for emp in employees:
        groups = list(emp.groups.values_list('name', flat=True))
        # Get the primary role (first group)
        role = groups[0] if groups else "No Role"
        
        data.append({
            "user_id": emp.id,
            "name": emp.get_full_name() or emp.username,
            "username": emp.username,
            "email": emp.email,
            "role": role,
            "date_joined": emp.date_joined.strftime("%B %d, %Y") if emp.date_joined else "Unknown"
        })
    
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_employee_detail(request, user_id):
    """Get employee details"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    try:
        emp = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

    groups = list(emp.groups.values_list('name', flat=True))
    role = groups[0] if groups else "No Role"
    
    return Response({
        "user_id": emp.id,
        "name": emp.get_full_name() or emp.username,
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "username": emp.username,
        "email": emp.email,
        "phone": "",  # Django user model doesn't have phone by default
        "role": role,
        "all_roles": groups,
        "date_joined": emp.date_joined.strftime("%B %d, %Y") if emp.date_joined else "Unknown"
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def um_create_employee(request):
    """Create a new employee"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from django.contrib.auth.models import Group
    
    username = request.data.get("username")
    password = request.data.get("password")
    email = request.data.get("email", "")
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")
    role = request.data.get("role")
    
    if not username or not password or not role:
        return Response(
            {"error": "Username, password, and role are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    employee_users = User.objects.filter(groups__name__in=["credit_manager", "order_processor"])

    if employee_users.filter(username=username).exists():
        return Response(
            {"error": "Username already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if email and employee_users.filter(email=email).exists():
        return Response(
            {"error": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        
        # Add to group
        group, _ = Group.objects.get_or_create(name=role)
        user.groups.add(group)
        
        log_audit(user=request.user, action="CREATE_EMPLOYEE", details={"employee_id": user.id, "username": username, "role": role}, request=request)
        return Response({
            "success": True,
            "message": "Employee created successfully",
            "user_id": user.id
        })
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def um_update_employee(request, user_id):
    """Update employee details"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from django.contrib.auth.models import Group
    
    try:
        emp = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Validate uniqueness before updating
    employee_users = User.objects.filter(groups__name__in=["credit_manager", "order_processor"]).exclude(id=user_id)

    if "username" in request.data and request.data["username"] != emp.username:
        if employee_users.filter(username=request.data["username"]).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)
        emp.username = request.data["username"]

    if "email" in request.data and request.data["email"]:
        if employee_users.filter(email=request.data["email"]).exists():
            return Response({"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)
        emp.email = request.data["email"]

    if "first_name" in request.data:
        emp.first_name = request.data["first_name"]
    if "last_name" in request.data:
        emp.last_name = request.data["last_name"]

    # Update password if provided
    if "password" in request.data and request.data["password"]:
        emp.set_password(request.data["password"])
    
    # Update role if provided
    if "role" in request.data:
        emp.groups.clear()
        group, _ = Group.objects.get_or_create(name=request.data["role"])
        emp.groups.add(group)
    
    emp.save()

    log_audit(user=request.user, action="UPDATE_EMPLOYEE", details={"employee_id": user_id, "username": emp.username}, request=request)
    return Response({
        "success": True,
        "message": "Employee updated successfully"
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def um_delete_employee(request, user_id):
    """Delete an employee"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    # Verify password
    password = request.data.get("password")
    if not password:
        return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    if not request.user.check_password(password):
        return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        emp = User.objects.get(id=user_id)
        
        # Prevent deleting yourself
        if emp.id == request.user.id:
            return Response(
                {"error": "Cannot delete your own account"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        username = emp.username
        emp.delete()
        log_audit(user=request.user, action="DELETE_EMPLOYEE", details={"employee_id": user_id, "username": username}, request=request)
        return Response({"success": True, "message": "Employee deleted successfully"})
    except User.DoesNotExist:
        return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
def branches_list(request):
    from .models import Branch
    branches = Branch.objects.all().order_by("name")
    data = [{"branch_id": b.branch_id, "name": b.name} for b in branches]
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_audit_logs(request):
    """Get all audit logs for upper management"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    logs = AuditLog.objects.select_related('user').order_by('-timestamp')

    data = []
    for log in logs:
        data.append({
            "log_id": log.log_id,
            "actor": log.user.get_full_name() or log.user.username if log.user else "System",
            "action": log.action,
            "timestamp": log.timestamp.isoformat(),
            "details": log.details,
            "ip_address": log.ip_address,
        })

    return Response(data)


# ─── Notification endpoints ───────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_reminder(request, customer_id):
    """UM or CM sends a reminder notification to a customer"""
    if not _require_role(request, "upper_management") and not _require_role(request, "credit_manager"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    message = request.data.get("message", "").strip()
    if not message:
        return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        customer = Customer.objects.get(id=customer_id)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

    from .models import Notification
    notification = Notification.objects.create(
        customer=customer,
        sent_by=request.user,
        message=message,
        requires_acknowledgment=True,
    )

    log_audit(request.user, "REMINDER_SENT", {
        "customer_id": customer_id,
        "customer_name": customer.user.get_full_name(),
        "message": message,
    }, request)

    return Response({
        "notification_id": notification.notification_id,
        "message": "Reminder sent successfully.",
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_unread_notifications(request):
    """Get unread notifications for the logged-in customer"""
    try:
        customer = Customer.objects.get(user=request.user)
    except Customer.DoesNotExist:
        return Response([])

    from .models import Notification
    unread = Notification.objects.filter(
        customer=customer, is_read=False, requires_acknowledgment=True
    ).order_by('-created_at')

    data = []
    for n in unread:
        data.append({
            "notification_id": n.notification_id,
            "message": n.message,
            "created_at": n.created_at.strftime("%B %d, %Y %I:%M %p"),
            "sent_by": n.sent_by.get_full_name() if n.sent_by else "System",
        })

    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def acknowledge_notification(request, notification_id):
    """Customer acknowledges a notification"""
    try:
        customer = Customer.objects.get(user=request.user)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

    from .models import Notification
    from django.utils import timezone
    try:
        notification = Notification.objects.get(notification_id=notification_id, customer=customer)
    except Notification.DoesNotExist:
        return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

    notification.is_read = True
    notification.read_at = timezone.now()
    notification.save()

    return Response({"message": "Notification acknowledged."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_notification_history(request):
    """Get all notifications (read and unread) for notification history"""
    try:
        customer = Customer.objects.get(user=request.user)
    except Customer.DoesNotExist:
        return Response([])

    from .models import Notification
    notifications = Notification.objects.filter(customer=customer).order_by('-created_at')

    data = []
    for n in notifications:
        data.append({
            "notification_id": n.notification_id,
            "message": n.message,
            "created_at": n.created_at.strftime("%B %d, %Y %I:%M %p"),
            "sent_by": n.sent_by.get_full_name() if n.sent_by else "System",
            "is_read": n.is_read,
            "read_at": n.read_at.strftime("%B %d, %Y %I:%M %p") if n.read_at else None,
        })

    return Response(data)


# ─── Reminder Messages endpoints ──────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_reminder_messages(request):
    """Get all 4 default reminder messages (any authenticated internal user)"""
    from .models import ReminderMessage
    messages = ReminderMessage.objects.all()
    existing = {m.slot: m.message for m in messages}
    defaults = {
        1: "This is a reminder that your credit balance is overdue. Please settle your outstanding balance at your earliest convenience.",
        2: "Your credit term is approaching its due date. Please make a payment to avoid service interruption.",
        3: "Your account has an outstanding balance that requires immediate attention. Please contact us or make a payment.",
        4: "Friendly reminder: Your payment is past due. Please update your credit balance to continue using our services.",
    }
    data = []
    for slot in range(1, 5):
        data.append({
            "slot": slot,
            "message": existing.get(slot, defaults[slot]),
        })
    return Response(data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_reminder_messages(request):
    """UM updates the 4 default reminder messages"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from .models import ReminderMessage
    messages_data = request.data.get("messages", [])
    if len(messages_data) != 4:
        return Response({"error": "Exactly 4 messages required."}, status=status.HTTP_400_BAD_REQUEST)

    for item in messages_data:
        slot = item.get("slot")
        message = item.get("message", "").strip()
        if not slot or slot not in [1, 2, 3, 4]:
            return Response({"error": f"Invalid slot: {slot}"}, status=status.HTTP_400_BAD_REQUEST)
        if not message:
            return Response({"error": f"Message for slot {slot} cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

    for item in messages_data:
        ReminderMessage.objects.update_or_create(
            slot=item["slot"],
            defaults={
                "message": item["message"].strip(),
                "updated_by": request.user,
            }
        )

    log_audit(request.user, "REMINDER_MESSAGES_UPDATED", {}, request)
    return Response({"message": "Reminder messages updated successfully."})


# ─── Credit Increase Request endpoints ────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def customer_submit_credit_increase(request):
    """Customer submits a credit limit increase request"""
    try:
        customer = Customer.objects.get(user=request.user)
        credit_account = customer.credit_account
    except Customer.DoesNotExist:
        return Response({"error": "Customer profile not found."}, status=status.HTTP_404_NOT_FOUND)
    except CreditAccount.DoesNotExist:
        return Response({"error": "Credit account not found."}, status=status.HTTP_404_NOT_FOUND)

    from .models import CreditIncreaseRequest
    # Block if pending request exists
    if CreditIncreaseRequest.objects.filter(account=credit_account, status='PENDING').exists():
        return Response({"error": "You already have a pending credit increase request."}, status=status.HTTP_400_BAD_REQUEST)

    requested_limit = request.data.get("requested_limit")
    justification = request.data.get("justification", "").strip()

    if not requested_limit:
        return Response({"error": "Requested limit is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        requested_limit = float(requested_limit)
    except (ValueError, TypeError):
        return Response({"error": "Invalid requested limit."}, status=status.HTTP_400_BAD_REQUEST)

    if requested_limit <= float(credit_account.credit_limit):
        return Response({"error": "Requested limit must be greater than your current credit limit."}, status=status.HTTP_400_BAD_REQUEST)

    if not justification:
        return Response({"error": "Justification is required."}, status=status.HTTP_400_BAD_REQUEST)

    req = CreditIncreaseRequest.objects.create(
        account=credit_account,
        requested_limit=requested_limit,
        justification=justification,
    )

    return Response({"success": True, "request_id": req.request_id}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_credit_increase_detail(request, request_id):
    """UM views a single credit increase request"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from .models import CreditIncreaseRequest
    try:
        r = CreditIncreaseRequest.objects.select_related(
            'account__customer__user', 'reviewed_by'
        ).get(request_id=request_id)
    except CreditIncreaseRequest.DoesNotExist:
        return Response({"error": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

    customer_user = r.account.customer.user
    return Response({
        "request_id": r.request_id,
        "customer_name": customer_user.get_full_name() or customer_user.username,
        "current_limit": str(r.account.credit_limit),
        "requested_limit": str(r.requested_limit),
        "justification": r.justification,
        "status": r.status,
        "created_at": r.created_at.strftime("%B %d, %Y %I:%M %p"),
        "reviewed_by": r.reviewed_by.get_full_name() if r.reviewed_by else None,
        "reviewed_at": r.reviewed_at.strftime("%B %d, %Y %I:%M %p") if r.reviewed_at else None,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def um_credit_increase_list(request):
    """UM views all credit increase requests"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    from .models import CreditIncreaseRequest
    requests_qs = CreditIncreaseRequest.objects.select_related(
        'account__customer__user', 'reviewed_by'
    ).order_by('-created_at')

    data = []
    for r in requests_qs:
        customer_user = r.account.customer.user
        data.append({
            "request_id": r.request_id,
            "customer_name": customer_user.get_full_name() or customer_user.username,
            "current_limit": str(r.account.credit_limit),
            "requested_limit": str(r.requested_limit),
            "justification": r.justification,
            "status": r.status,
            "created_at": r.created_at.strftime("%B %d, %Y %I:%M %p"),
            "reviewed_by": r.reviewed_by.get_full_name() if r.reviewed_by else None,
            "reviewed_at": r.reviewed_at.strftime("%B %d, %Y %I:%M %p") if r.reviewed_at else None,
        })

    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def um_approve_credit_increase(request, request_id):
    """UM approves a credit increase request"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    password = request.data.get("password")
    if not password or not request.user.check_password(password):
        return Response({"error": "Invalid password."}, status=status.HTTP_401_UNAUTHORIZED)

    from .models import CreditIncreaseRequest, Notification
    from django.utils import timezone
    try:
        credit_request = CreditIncreaseRequest.objects.select_related('account__customer__user').get(request_id=request_id)
    except CreditIncreaseRequest.DoesNotExist:
        return Response({"error": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

    if credit_request.status != 'PENDING':
        return Response({"error": "Request is not pending."}, status=status.HTTP_400_BAD_REQUEST)

    old_limit = credit_request.account.credit_limit
    new_limit = credit_request.requested_limit

    # Update status
    credit_request.status = 'APPROVED'
    credit_request.reviewed_by = request.user
    credit_request.reviewed_at = timezone.now()
    credit_request.save()

    # Update credit account
    account = credit_request.account
    limit_increase = new_limit - old_limit
    account.credit_limit = new_limit
    account.available_credit = min(account.available_credit + limit_increase, new_limit)
    account.save()

    # Notify customer
    customer = account.customer
    Notification.objects.create(
        customer=customer,
        sent_by=request.user,
        message=f"Your credit limit increase request has been approved. Your new credit limit is ₱{float(new_limit):,.2f}.",
        requires_acknowledgment=True,
    )

    log_audit(request.user, "CREDIT_INCREASE_APPROVED", {
        "request_id": request_id,
        "customer_name": customer.user.get_full_name(),
        "old_limit": str(old_limit),
        "new_limit": str(new_limit),
    }, request)

    return Response({"success": True})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def um_reject_credit_increase(request, request_id):
    """UM rejects a credit increase request"""
    if not _require_role(request, "upper_management"):
        return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    password = request.data.get("password")
    if not password or not request.user.check_password(password):
        return Response({"error": "Invalid password."}, status=status.HTTP_401_UNAUTHORIZED)

    from .models import CreditIncreaseRequest, Notification
    from django.utils import timezone
    try:
        credit_request = CreditIncreaseRequest.objects.select_related('account__customer__user').get(request_id=request_id)
    except CreditIncreaseRequest.DoesNotExist:
        return Response({"error": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

    if credit_request.status != 'PENDING':
        return Response({"error": "Request is not pending."}, status=status.HTTP_400_BAD_REQUEST)

    credit_request.status = 'REJECTED'
    credit_request.reviewed_by = request.user
    credit_request.reviewed_at = timezone.now()
    credit_request.save()

    customer = credit_request.account.customer
    Notification.objects.create(
        customer=customer,
        sent_by=request.user,
        message="Your credit limit increase request has been reviewed and was not approved at this time.",
        requires_acknowledgment=True,
    )

    log_audit(request.user, "CREDIT_INCREASE_REJECTED", {
        "request_id": request_id,
        "customer_name": customer.user.get_full_name(),
        "requested_limit": str(credit_request.requested_limit),
    }, request)

    return Response({"success": True})
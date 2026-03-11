import json
import os
from rest_framework.decorators import api_view, parser_classes, permission_classes, authentication_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import CreditEnrollment
from accounts.models import log_audit


@api_view(["POST"])
@authentication_classes([])
@parser_classes([MultiPartParser, FormParser])
def create_application(request):
    try:
        step1 = json.loads(request.data.get("step1"))
        step2 = json.loads(request.data.get("step2"))
    except Exception:
        return Response({"error": "Invalid payload"}, status=400)
    
    email = step1["email"]
    phone_number = step2["phone"]
    
    # Check if email already has an enrollment
    existing_enrollment = CreditEnrollment.objects.filter(email=email).first()
    if existing_enrollment:
        if existing_enrollment.enrollment_status == "PENDING":
            return Response(
                {
                    "error": "Application already exists",
                    "message": "An application with this email is pending review.",
                    "application_id": str(existing_enrollment.application_id)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        elif existing_enrollment.enrollment_status == "APPROVED":
            if existing_enrollment.account_activated:
                return Response(
                    {
                        "error": "Account already exists",
                        "message": "An active account with this email already exists. Please log in."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {
                        "error": "Application approved",
                        "message": "Your application has been approved. Please check your email for the activation link."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif existing_enrollment.enrollment_status == "REJECTED":
            return Response(
                {
                    "error": "Previous application rejected",
                    "message": "A previous application with this email was rejected. Please contact support."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Check if phone number already exists in enrollments
    existing_phone = CreditEnrollment.objects.filter(phone_number=phone_number).first()
    if existing_phone:
        return Response(
            {
                "error": "Phone number already registered",
                "message": "This phone number is already associated with another application."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create application
    try:
        application = CreditEnrollment.objects.create(
            email=email,

            first_name=step2["firstName"],
            last_name=step2["lastName"],
            phone_number=phone_number,

            address1=step2["address1"],
            address2=step2.get("address2", ""),
            province=step2.get("province", ""),
            barangay=step2["barangay"],
            city=step2["city"],
            zipcode=step2["zipCode"],
            branch_id=step2["branch"],

            billing_address1=step2.get("billingAddress1", ""),
            billing_address2=step2.get("billingAddress2", ""),
            billing_province=step2.get("billingProvince", ""),
            billing_barangay=step2.get("billingBarangay", ""),
            billing_city=step2.get("billingCity", ""),
            billing_zipcode=step2.get("billingZipCode", ""),

            credit_amt_request=step2["creditAmount"],
            credit_term_request=step2["creditTerm"],

            doc1_file=request.FILES.get("doc1"),
            doc2_file=request.FILES.get("doc2"),
            gov_id=request.FILES.get("gov_id"),
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {"application_id": str(application.application_id)},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@authentication_classes([])
def check_duplicate(request):
    """Check if email or phone number already exists"""
    email = request.data.get("email")
    phone = request.data.get("phone")
    
    response_data = {
        "email_exists": False,
        "phone_exists": False,
        "message": None
    }
    
    if email:
        enrollment = CreditEnrollment.objects.filter(email=email).first()
        if enrollment:
            response_data["email_exists"] = True
            if enrollment.enrollment_status == "PENDING":
                response_data["message"] = "This email has a pending application."
            elif enrollment.enrollment_status == "APPROVED" and enrollment.account_activated:
                response_data["message"] = "An account with this email already exists."
            elif enrollment.enrollment_status == "APPROVED" and not enrollment.account_activated:
                response_data["message"] = "This email has an approved application. Check your email for activation link."
            elif enrollment.enrollment_status == "REJECTED":
                response_data["message"] = "A previous application with this email was rejected."
    
    if phone:
        if CreditEnrollment.objects.filter(phone_number=phone).exists():
            response_data["phone_exists"] = True
            if not response_data["message"]:
                response_data["message"] = "This phone number is already registered."
    
    return Response(response_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_enrollments(request):
    qs = CreditEnrollment.objects.filter(enrollment_status="PENDING").order_by("-submission_date")
    data = []
    for app in qs:
        data.append({
        "application_id": str(app.application_id),
        "name": f"{app.first_name} {app.last_name}",
        "email": app.email,
        "date": app.submission_date.strftime("%B %d, %Y"),
        })


    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def enrollment_detail(request, application_id):
    app = CreditEnrollment.objects.get(application_id=application_id)

    return Response({
        "first_name": app.first_name,
        "last_name": app.last_name,
        "email": app.email,
        "phone_number": app.phone_number,
        "address1": app.address1,
        "address2": app.address2,
        "province": app.province,
        "barangay": app.barangay,
        "city": app.city,
        "zipcode": app.zipcode,
        "billing_address1": app.billing_address1,
        "billing_address2": app.billing_address2,
        "billing_province": app.billing_province,
        "billing_barangay": app.billing_barangay,
        "billing_city": app.billing_city,
        "billing_zipcode": app.billing_zipcode,
        "credit_amt_request": app.credit_amt_request,
        "credit_term_request": app.credit_term_request,
        "doc1_file": app.doc1_file.url if app.doc1_file else None,
        "doc2_file": app.doc2_file.url if app.doc2_file else None,
        "gov_id": app.gov_id.url if app.gov_id else None,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_enrollment(request, application_id):
    from django.contrib.auth import authenticate
    from django.utils import timezone
    import secrets

    # Verify password
    password = request.data.get("password")
    if not password:
        return Response(
            {"error": "Password is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(
        username=request.user.username,
        password=password
    )
    if user is None:
        return Response(
            {"error": "Invalid password"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Proceed with approval
    app = CreditEnrollment.objects.get(application_id=application_id)
    app.enrollment_status = "APPROVED"
    app.approved_by = request.user
    
    # Generate secure activation token
    app.activation_token = secrets.token_urlsafe(15)
    app.activation_token_created = timezone.now()
    app.save()
    
    # Send activation email
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    activation_link = f"{frontend_url}/activate/{app.activation_token}"
    
    try:
        from utils.email import send_email
        send_email(
            to=app.email,
            subject="Your Mylora Credit Account Has Been Approved!",
            message=f"Hello {app.first_name},\n\n"
                    f"Congratulations! Your credit account application has been approved.\n\n"
                    f"To complete your account setup, please click the link below to create your password:\n\n"
                    f"{activation_link}\n\n"
                    f"This link will expire in 24 hours.\n\n"
                    f"If you did not apply for a credit account, please ignore this email.\n\n"
                    f"Best regards,\nMylora Web Credit System",
        )
        email_sent = True
        email_error = None
    except Exception as e:
        email_sent = False
        email_error = str(e)
        print(f"Email sending failed: {e}")

    log_audit(user=request.user, action="APPROVE_ENROLLMENT", details={"application_id": str(application_id), "applicant_email": app.email}, request=request)
    response_data = {"status": "approved", "email_sent": email_sent, "activation_link": activation_link}
    if email_error:
        response_data["email_error"] = email_error
    return Response(response_data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_enrollment(request, application_id):
    from django.contrib.auth import authenticate
    
    # Verify password
    password = request.data.get("password")
    if not password:
        return Response(
            {"error": "Password is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(
        username=request.user.username,
        password=password
    )
    if user is None:
        return Response(
            {"error": "Invalid password"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Validate rejection reason
    rejection_reason = request.data.get("rejection_reason", "").strip()
    if len(rejection_reason.split()) < 5:
        return Response(
            {"error": "Please provide at least 5 words for the rejection reason."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Proceed with rejection
    app = CreditEnrollment.objects.get(application_id=application_id)
    app.enrollment_status = "REJECTED"
    app.approved_by = request.user
    app.rejection_reason = rejection_reason
    app.save()

    # Send rejection email
    from utils.email import send_email
    applicant_name = f"{app.first_name} {app.last_name}".strip() or "Applicant"
    try:
        send_email(
            to=app.email,
            subject="Your Credit Account Application Has Been Rejected",
            message=(
                f"Dear {applicant_name},\n\n"
                f"We regret to inform you that your credit account application has been rejected.\n\n"
                f"Reason for rejection:\n{rejection_reason}\n\n"
                f"If you have any questions, please contact our support team.\n\n"
                f"Regards,\nMylora Web Credit System"
            ),
        )
        email_sent = True
        email_error = None
    except Exception as e:
        email_sent = False
        email_error = str(e)
        print(f"Rejection email sending failed: {e}")

    log_audit(user=request.user, action="REJECT_ENROLLMENT", details={"application_id": str(application_id), "applicant_email": app.email, "rejection_reason": rejection_reason}, request=request)
    response_data = {"status": "rejected", "email_sent": email_sent}
    if email_error:
        response_data["email_error"] = email_error
    return Response(response_data)


@api_view(["GET"])
def verify_activation_token(request, token):
    """Verify if activation token is valid"""
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        app = CreditEnrollment.objects.get(
            activation_token=token,
            enrollment_status="APPROVED",
            account_activated=False
        )

        # Check if token is expired (24 hours)
        if app.activation_token_created:
            expiry = app.activation_token_created + timedelta(hours=24)
            now = timezone.now()
            print(f"[DEBUG] Token created: {app.activation_token_created}, Expiry: {expiry}, Now: {now}")
            if now > expiry:
                return Response(
                    {"error": "Activation link has expired"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response({
            "valid": True,
            "email": app.email,
            "name": f"{app.first_name} {app.last_name}"
        })

    except CreditEnrollment.DoesNotExist:
        # Debug: check what exists
        all_approved = CreditEnrollment.objects.filter(enrollment_status="APPROVED", account_activated=False)
        print(f"[DEBUG] Token lookup failed for: {token[:20]}...")
        for a in all_approved:
            print(f"[DEBUG] Approved app: {a.application_id}, token={a.activation_token[:20] if a.activation_token else 'None'}...")
        return Response(
            {"error": "Invalid or expired activation link"},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@authentication_classes([])
def activate_account(request, token):
    """Create user account with password and set up customer profile"""
    from django.contrib.auth.models import User, Group
    from django.utils import timezone
    from datetime import timedelta
    from accounts.models import Customer, CreditAccount
    from django.db import transaction
    
    password = request.data.get("password")
    if not password:
        return Response(
            {"error": "Password is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        app = CreditEnrollment.objects.get(
            activation_token=token,
            enrollment_status="APPROVED",
            account_activated=False
        )
        
        # Check if token is expired (24 hours)
        if app.activation_token_created:
            expiry = app.activation_token_created + timedelta(hours=24)
            if timezone.now() > expiry:
                return Response(
                    {"error": "Activation link has expired"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Use transaction to ensure all-or-nothing creation
        with transaction.atomic():
            # 1. Create user account
            user = User.objects.create_user(
                username=app.email,
                email=app.email,
                password=password,
                first_name=app.first_name,
                last_name=app.last_name
            )
            
            # 2. Assign customer role/group
            customer_group, created = Group.objects.get_or_create(name='customer')
            user.groups.add(customer_group)
            
            # 3. Create Customer profile
            customer = Customer.objects.create(
                user=user,
                application=app
            )
            
            # 4. Get Branch from FK
            branch = app.branch
            
            # 5. Create CreditAccount with approved credit info
            credit_account = CreditAccount.objects.create(
                customer=customer,
                branch=branch,
                credit_limit=app.credit_amt_request,
                available_credit=app.credit_amt_request,  # Start with full credit available
                outstanding_bal=0.00,  # No balance initially
                credit_term=int(app.credit_term_request),  # Convert to int days
                status='ACTIVE'
            )
            
            # 6. Mark enrollment as activated
            app.account_activated = True
            app.activation_token = None  # Invalidate token
            app.save()
        
        return Response({
            "success": True,
            "message": "Account created successfully",
            "credit_limit": str(app.credit_amt_request)
        })
        
    except CreditEnrollment.DoesNotExist:
        return Response(
            {"error": "Invalid or expired activation link"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
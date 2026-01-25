import json
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .models import CreditEnrollment


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def create_application(request):
    try:
        step1 = json.loads(request.data.get("step1"))
        step2 = json.loads(request.data.get("step2"))
    except Exception:
        return Response({"error": "Invalid payload"}, status=400)

    application = CreditEnrollment.objects.create(
        email=step1["email"],

        first_name=step2["firstName"],
        last_name=step2["lastName"],
        phone_number=step2["phone"],

        address1=step2["address1"],
        address2=step2.get("address2", ""),
        barangay=step2["barangay"],
        city=step2["city"],
        zipcode=step2["zipCode"],
        default_branch=step2["branch"],

        credit_amt_request=step2["creditAmount"],
        credit_term_request=step2["creditTerm"],

        doc1_file=request.FILES.get("doc1"),
        doc2_file=request.FILES.get("doc2"),
        gov_id=request.FILES.get("gov_id"),
    )

    return Response(
        {"application_id": str(application.application_id)},
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
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
def enrollment_detail(request, application_id):
    app = CreditEnrollment.objects.get(application_id=application_id)

    return Response({
        "first_name": app.first_name,
        "last_name": app.last_name,
        "email": app.email,
        "phone_number": app.phone_number,
        "address1": app.address1,
        "address2": app.address2,
        "barangay": app.barangay,
        "city": app.city,
        "zipcode": app.zipcode,
        "credit_amt_request": app.credit_amt_request,
        "credit_term_request": app.credit_term_request,
        "doc1_file": app.doc1_file.url if app.doc1_file else None,
        "doc2_file": app.doc2_file.url if app.doc2_file else None,
        "gov_id": app.gov_id.url if app.gov_id else None,
    })


@api_view(["POST"])
def approve_enrollment(request, application_id):
    app = CreditEnrollment.objects.get(application_id=application_id)
    app.enrollment_status = "APPROVED"
    app.approved_by = request.user
    app.save()
    return Response({"status": "approved"})


@api_view(["POST"])
def reject_enrollment(request, application_id):
    app = CreditEnrollment.objects.get(application_id=application_id)
    app.enrollment_status = "REJECTED"
    app.approved_by = request.user
    app.save()
    return Response({"status": "rejected"})
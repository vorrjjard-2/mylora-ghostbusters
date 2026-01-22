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

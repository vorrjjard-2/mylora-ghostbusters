import uuid
from django.db import models
from django.conf import settings


class CreditEnrollment(models.Model):
    ENROLLMENT_STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    # PK
    application_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    # Personal info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=50)
    email = models.EmailField()

    # Address
    address1 = models.CharField(max_length=255)
    address2 = models.CharField(max_length=255, blank=True)
    barangay = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    zipcode = models.CharField(max_length=20)
    default_branch = models.CharField(max_length=100)

    # Credit request
    credit_amt_request = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    credit_term_request = models.CharField(max_length=50)

    # Documents
    doc1_file = models.FileField(upload_to="applications/docs/")
    doc2_file = models.FileField(upload_to="applications/docs/")
    gov_id = models.FileField(upload_to="applications/gov_ids/")

    # Status + audit
    enrollment_status = models.CharField(
        max_length=20,
        choices=ENROLLMENT_STATUS_CHOICES,
        default="PENDING",
    )

    submission_date = models.DateTimeField(auto_now_add=True)

    # FK → internal approver
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_enrollments",
    )

    def __str__(self):
        return str(self.application_id)


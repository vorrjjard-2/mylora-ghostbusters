from django.contrib import admin
from .models import CreditEnrollment

from django.contrib.auth.models import User, Group


# admin.site.register(CreditEnrollment)

@admin.register(CreditEnrollment)
class CreditEnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        "application_id",
        "email",
        "credit_amt_request",
        "enrollment_status",
        "submission_date",
    )

    list_filter = ("enrollment_status", "submission_date")
    search_fields = ("email", "application_id")

    readonly_fields = ("application_id", "submission_date")

    fieldsets = (
        ("Applicant Information", {
            "fields": (
                "email",
                "first_name",
                "last_name",
                "phone_number",
            )
        }),
        ("Address", {
            "fields": (
                "address1",
                "address2",
                "barangay",
                "city",
                "zipcode",
                "default_branch",
            )
        }),
        ("Credit Request", {
            "fields": (
                "credit_amt_request",
                "credit_term_request",
            )
        }),
        ("Documents", {
            "fields": (
                "doc1_file",
                "doc2_file",
                "doc3_file",
                "gov_id",
            )
        }),
        ("Approval", {
            "fields": (
                "enrollment_status",
                "approved_by",
            )
        }),
    )


def approve_application(application, approver):
    user = User.objects.create_user(
    username=application.email,
    email=application.email,
    )


    customer_group = Group.objects.get(name="customer")
    user.groups.add(customer_group)


    application.enrollment_status = "APPROVED"
    application.approved_by = approver
    application.save()
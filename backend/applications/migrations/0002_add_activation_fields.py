# Generated migration for activation token fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0001_initial'),  # Adjust this to your latest migration
    ]

    operations = [
        migrations.AddField(
            model_name='creditenrollment',
            name='activation_token',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name='creditenrollment',
            name='activation_token_created',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='creditenrollment',
            name='account_activated',
            field=models.BooleanField(default=False),
        ),
    ]
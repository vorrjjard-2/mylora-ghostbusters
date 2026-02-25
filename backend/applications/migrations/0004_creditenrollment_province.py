from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0003_alter_creditenrollment_email_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='creditenrollment',
            name='province',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]

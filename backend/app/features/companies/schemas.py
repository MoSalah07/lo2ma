from app.core.api_model import ApiModel, LocalizedText
from app.features.companies.models import CompanyRecord


class Company(ApiModel):
    """A company, by its id and its name in both languages (companySchema)."""

    id: str
    name: LocalizedText


def to_company(record: CompanyRecord) -> Company:
    return Company(id=record.id, name=LocalizedText(ar=record.name_ar, en=record.name_en))

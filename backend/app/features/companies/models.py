from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class CompanyRecord(Base):
    """A company whose people order lunch together; coupons and the admin's filters name it.

    The demo's companies come from the seed, under the mock's ids (c1…).
    """

    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(primary_key=True)
    name_ar: Mapped[str]
    name_en: Mapped[str]

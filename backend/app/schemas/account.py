from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

AddressType = Literal["shipping", "billing", "both"]


class AddressBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(pattern=r"^[0-9+\- ]{7,20}$")
    line1: str = Field(min_length=3, max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    postal_code: str = Field(pattern=r"^[0-9A-Za-z\- ]{3,20}$")
    country: str = Field(default="India", max_length=100)
    address_type: AddressType = "both"


class AddressCreate(AddressBase):
    is_default: bool = False


class AddressUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, pattern=r"^[0-9+\- ]{7,20}$")
    line1: str | None = Field(default=None, min_length=3, max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, min_length=2, max_length=100)
    state: str | None = Field(default=None, min_length=2, max_length=100)
    postal_code: str | None = Field(default=None, pattern=r"^[0-9A-Za-z\- ]{3,20}$")
    country: str | None = Field(default=None, max_length=100)
    address_type: AddressType | None = None


class AddressOut(AddressBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    is_default: bool



# ---------- profile ----------
class ProfileUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=100)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=72)
    new_password: str = Field(min_length=8, max_length=72)

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if not any(c.isdigit() for c in v) or not any(c.isalpha() for c in v):
            raise ValueError("Password must contain letters and numbers")
        return v
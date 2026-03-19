from fastapi import APIRouter, Depends, HTTPException, status
import uuid

from app.core.supabase import get_supabase, get_current_user
from app.schemas.schemas import OrganizationCreate

router = APIRouter(prefix="/organizations", tags=["Organizações"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    user: dict = Depends(get_current_user),
    db=Depends(get_supabase),
):
    record = {
        "id":            str(uuid.uuid4()),
        "name":          payload.name,
        "nif":           payload.nif,
        "contact_email": payload.contact_email,
        "owner_id":      user["id"],
    }
    result = db.table("organizations").insert(record).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Erro ao criar organização")
    return result.data[0]


@router.get("/")
def list_organizations(
    user: dict = Depends(get_current_user),
    db=Depends(get_supabase),
):
    result = (
        db.table("organizations")
        .select("*")
        .eq("owner_id", user["id"])
        .execute()
    )
    return result.data or []


@router.get("/{org_id}")
def get_organization(
    org_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    db=Depends(get_supabase),
):
    result = (
        db.table("organizations")
        .select("*")
        .eq("id", str(org_id))
        .eq("owner_id", user["id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    return result.data
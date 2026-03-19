from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
import uuid

from app.core.supabase import get_supabase
from app.schemas.schemas import LoginRequest, LoginResponse, RegisterRequest

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Client = Depends(get_supabase)):
    """Regista um novo utilizador e cria a sua organização."""
    try:
        auth_resp = db.auth.sign_up({
            "email":    payload.email,
            "password": payload.password,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = auth_resp.user
    if not user:
        raise HTTPException(status_code=400, detail="Erro ao criar utilizador")

    org = {
        "id":            str(uuid.uuid4()),
        "name":          payload.organization_name,
        "nif":           payload.nif,
        "contact_email": payload.email,
        "owner_id":      user.id,
    }
    db.table("organizations").insert(org).execute()

    return {
        "message": "Utilizador criado. Verifique o email para ativar a conta.",
        "user_id": user.id,
    }


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Client = Depends(get_supabase)):
    try:
        auth_resp = db.auth.sign_in_with_password({
            "email":    payload.email,
            "password": payload.password,
        })
        
        if not auth_resp or not auth_resp.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou password incorretos",
            )

        return LoginResponse(
            access_token=auth_resp.session.access_token,
            user={"id": auth_resp.user.id, "email": auth_resp.user.email},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Erro de autenticação: {str(e)}",
        )


@router.post("/logout")
def logout(db: Client = Depends(get_supabase)):
    db.auth.sign_out()
    return {"message": "Sessão terminada"}
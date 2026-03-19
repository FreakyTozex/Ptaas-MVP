from supabase import create_client, Client
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Optional

from app.core.config import settings

_supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

security = HTTPBearer()


def get_supabase() -> Client:
    return _supabase


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        # Supabse will use the Supabase client to validate the token directly
        user_resp = _supabase.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        
        user = user_resp.user
        return {
            "id":    user.id,
            "email": user.email,
            "role":  user.role or "authenticated",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito")
    return user


def verify_internal_token(x_internal_token: Optional[str] = Header(None)) -> None:
    """Valida o token secreto partilhado entre n8n e FastAPI."""
    if x_internal_token != settings.INTERNAL_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token interno inválido",
        )
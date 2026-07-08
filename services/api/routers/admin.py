from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import auth as firebase_auth, firestore
from pydantic import BaseModel, Field, model_validator

from core.firebase import get_auth, get_firestore
from core.security import verify_firebase_token


router = APIRouter(prefix="/admin", tags=["admin"])

PlanId = Literal["free_trial", "economico", "familiar", "premium"]
SubscriptionStatus = Literal["trial", "trial_expired", "active", "past_due", "cancelled"]

GB = 1024 * 1024 * 1024

PLAN_LIMITS: dict[str, dict[str, int]] = {
    "free_trial": {
        "maxDocuments": 30,
        "maxStorageBytes": 1 * GB,
        "maxAiTokensMonth": 20_000,
        "maxAiRequestsMonth": 30,
    },
    "economico": {
        "maxDocuments": 100,
        "maxStorageBytes": 1 * GB,
        "maxAiTokensMonth": 100_000,
        "maxAiRequestsMonth": 120,
    },
    "familiar": {
        "maxDocuments": 300,
        "maxStorageBytes": 5 * GB,
        "maxAiTokensMonth": 350_000,
        "maxAiRequestsMonth": 400,
    },
    "premium": {
        "maxDocuments": 1000,
        "maxStorageBytes": 10 * GB,
        "maxAiTokensMonth": 1_000_000,
        "maxAiRequestsMonth": 1200,
    },
}


class SubscriptionUpdateRequest(BaseModel):
    target_uid: str | None = Field(default=None, min_length=1)
    target_email: str | None = Field(default=None, min_length=3)
    plan: PlanId
    subscription_status: SubscriptionStatus = "active"
    reason: str | None = Field(default=None, max_length=240)

    @model_validator(mode="after")
    def require_target(self):
        if not self.target_uid and not self.target_email:
            raise ValueError("Debes enviar target_uid o target_email")
        return self


class SubscriptionUpdateResponse(BaseModel):
    ok: bool
    target_uid: str
    target_email: str | None = None
    plan: PlanId
    subscription_status: SubscriptionStatus
    limits: dict[str, int]


async def require_admin(decoded_token: dict = Depends(verify_firebase_token)) -> dict:
    role = decoded_token.get("role")
    if role in {"admin", "owner"} or decoded_token.get("admin") is True or decoded_token.get("owner") is True:
        return decoded_token

    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(status_code=403, detail="Acceso administrativo requerido")

    db = get_firestore()
    snap = db.collection("users").document(uid).get()
    data = snap.to_dict() if snap.exists else {}
    if data.get("role") in {"admin", "owner"}:
        return decoded_token

    raise HTTPException(status_code=403, detail="Acceso administrativo requerido")


def resolve_target_user(payload: SubscriptionUpdateRequest) -> firebase_auth.UserRecord:
    admin_auth = get_auth()
    try:
        if payload.target_uid:
            return admin_auth.get_user(payload.target_uid)
        return admin_auth.get_user_by_email(payload.target_email or "")
    except Exception:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")


@router.post("/subscriptions/update", response_model=SubscriptionUpdateResponse)
async def update_subscription(
    payload: SubscriptionUpdateRequest,
    admin_token: dict = Depends(require_admin),
):
    target = resolve_target_user(payload)
    limits = PLAN_LIMITS[payload.plan]
    db = get_firestore()
    target_ref = db.collection("users").document(target.uid)
    now = firestore.SERVER_TIMESTAMP

    update_payload = {
        "uid": target.uid,
        "email": target.email,
        "plan": payload.plan,
        "subscriptionStatus": payload.subscription_status,
        "limits": limits,
        "updatedAt": now,
        "billing": {
            "plan": payload.plan,
            "status": payload.subscription_status,
            "updatedAt": now,
            "updatedBy": admin_token.get("uid"),
            "reason": payload.reason or "admin_update",
        },
    }

    target_ref.set(update_payload, merge=True)
    target_ref.collection("auditLogs").add({
        "type": "subscription_update",
        "plan": payload.plan,
        "subscriptionStatus": payload.subscription_status,
        "reason": payload.reason or "admin_update",
        "actorUid": admin_token.get("uid"),
        "actorEmail": admin_token.get("email"),
        "createdAt": now,
    })

    return SubscriptionUpdateResponse(
        ok=True,
        target_uid=target.uid,
        target_email=target.email,
        plan=payload.plan,
        subscription_status=payload.subscription_status,
        limits=limits,
    )

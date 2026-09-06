"""Password hashing and JWT access tokens.

Passwords are hashed with PBKDF2-HMAC-SHA256 from the standard library (a salted,
many-rounds hash) so there's no native dependency to build. Access tokens are
signed JWTs. The signing secret comes from ``OVERPASS_SECRET``; the default is
only for local development and must be overridden in any real deployment.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt

_ALGORITHM = "sha256"
_ROUNDS = 200_000

_JWT_ALGORITHM = "HS256"
# At least 32 bytes so the HMAC key is a sane length. This default is for local
# development only — set OVERPASS_SECRET to your own value in any deployment.
_JWT_SECRET = os.environ.get("OVERPASS_SECRET", "overpass-local-development-secret-change-me")
_TOKEN_TTL = timedelta(hours=8)


def _b64(raw: bytes) -> str:
    return base64.b64encode(raw).decode("ascii")


def hash_password(password: str) -> str:
    """Hash a password into a self-describing string (algorithm, rounds, salt)."""
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac(_ALGORITHM, password.encode(), salt, _ROUNDS)
    return f"pbkdf2_{_ALGORITHM}${_ROUNDS}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: str) -> bool:
    """Check a password against a stored hash, in constant time."""
    try:
        _label, rounds, salt_b64, digest_b64 = stored.split("$")
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)
    except (ValueError, TypeError):
        return False
    candidate = hashlib.pbkdf2_hmac(_ALGORITHM, password.encode(), salt, int(rounds))
    return hmac.compare_digest(candidate, expected)


def create_access_token(subject: str) -> str:
    """Issue a signed token identifying ``subject`` (the username)."""
    payload = {
        "sub": subject,
        "exp": datetime.now(timezone.utc) + _TOKEN_TTL,
    }
    return jwt.encode(payload, _JWT_SECRET, algorithm=_JWT_ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Return the subject a token is for, or None if it's invalid or expired."""
    try:
        payload = jwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    return payload.get("sub")

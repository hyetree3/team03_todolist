"""연동 토큰(구글 refresh token 등) 암복호화. kakao 파트 코드를 backend로 이식함."""
import os

from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

_ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")


def _get_fernet() -> Fernet:
    if not _ENCRYPTION_KEY:
        raise RuntimeError(
            "ENCRYPTION_KEY가 .env에 설정되어 있지 않습니다. "
            "python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\" "
            "로 생성해서 넣어주세요."
        )
    return Fernet(_ENCRYPTION_KEY.encode())


def encrypt(plain_text: str) -> str:
    return _get_fernet().encrypt(plain_text.encode()).decode()


def decrypt(cipher_text: str) -> str:
    return _get_fernet().decrypt(cipher_text.encode()).decode()

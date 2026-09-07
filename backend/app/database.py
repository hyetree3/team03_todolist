"""SQLite DB 연결 설정 (SQLModel)."""
from sqlmodel import Session, SQLModel, create_engine

from app.config import DATABASE_URL

# SQLite는 기본적으로 스레드 하나만 허용하는데, FastAPI는 요청마다 다른 스레드를
# 쓸 수 있어서 check_same_thread=False로 풀어준다.
connect_args = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def init_db() -> None:
    """앱 시작 시 테이블이 없으면 생성한다."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """요청마다 새 세션을 열고 끝나면 닫아주는 FastAPI 의존성."""
    with Session(engine) as session:
        yield session

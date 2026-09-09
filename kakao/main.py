"""kakao 모듈 진입점.

2026-09-08 통합 이후: 할일이 backend API를 통해서만 생성/삭제되므로, 생성 알림(DM+캘린더)과
마감 1시간 전 알림은 이제 backend가 직접 처리한다(backend/app/notification_scheduler.py,
Discord REST API로 게이트웨이 접속 없이 DM 발송). 그래서 이 폴더의 scheduler.py는 더 이상
여기서 켜지 않는다 — 이 프로세스는 이제 Discord 게이트웨이 연결이 필요한 /start
슬래시커맨드(앱 최초 설치 시 보조 접점 확보용, README 참고)만 위해 띄워두는 선택 사항이다.
알림을 받는 데 이 프로세스가 실행 중일 필요는 없다.
"""
import asyncio

from db import create_db_and_tables
from discord_bot import start_bot


async def main() -> None:
    create_db_and_tables()
    print("[main] /start 커맨드 보조용 Discord 봇 시작 (알림 발송은 backend가 전담)")
    await start_bot()


if __name__ == "__main__":
    asyncio.run(main())

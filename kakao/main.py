import asyncio
import os

from dotenv import load_dotenv

from db import create_db_and_tables
from discord_bot import start_bot
from scheduler import start_scheduler

load_dotenv()

INTERVAL_MINUTES = int(os.getenv("NOTIFICATION_CHECK_INTERVAL_MINUTES", "5"))


async def main() -> None:
    create_db_and_tables()
    start_scheduler(INTERVAL_MINUTES)
    print(f"[main] 알림 스케줄러 시작 (주기: {INTERVAL_MINUTES}분)")
    await start_bot()


if __name__ == "__main__":
    asyncio.run(main())

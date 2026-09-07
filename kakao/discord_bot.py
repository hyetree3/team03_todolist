import os

import discord
from discord import app_commands
from dotenv import load_dotenv

load_dotenv()

DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")


class NotifierBot(discord.Client):
    def __init__(self) -> None:
        intents = discord.Intents.default()
        super().__init__(intents=intents)
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self) -> None:
        # 전역 동기화. User-Install 앱 커맨드는 길드 동기화가 아니라 전역 동기화로 전파됨.
        await self.tree.sync()


bot = NotifierBot()


@bot.tree.command(
    name="start",
    description="TODO 알림 봇 활성화 (최초 1회 실행 필요합니다)",
)
@app_commands.allowed_installs(guilds=False, users=True)
@app_commands.allowed_contexts(guilds=False, dms=True, private_channels=True)
async def start_command(interaction: discord.Interaction) -> None:
    # 이 커맨드 자체의 목적은 두 가지:
    # 1) 사용자에게 활성화됐다고 안내
    # 2) 이 상호작용을 통해 봇-유저 사이의 "관계"를 만들어, 이후 예약 발송(DM)이 막히지 않게 함
    #    (서버 없이 개인 계정에 앱을 설치한 것만으로 사전 상호작용 없는 DM이 항상 허용되는지는
    #    Discord 쪽에서 100% 문서화되어 있지 않아, 실제 테스트로 확인이 필요함 - README 참고)
    await interaction.response.send_message(
        "✅ 알림이 활성화되었습니다! 회원가입 시 등록하신 Discord 계정으로 "
        "할일 마감 1시간 전에 이 채팅을 통해 알려드릴게요.",
        ephemeral=True,
    )


@bot.event
async def on_ready() -> None:
    print(f"[discord_bot] 로그인 완료: {bot.user} (id={bot.user.id if bot.user else '?'})")


async def send_dm(discord_id: str, content: str) -> bool:
    """discord_id로 유저에게 DM 발송을 시도한다. 성공하면 True, 실패하면 False."""
    try:
        user = await bot.fetch_user(int(discord_id))
        await user.send(content)
        return True
    except (discord.Forbidden, discord.NotFound, discord.HTTPException, ValueError) as exc:
        print(f"[discord_bot] DM 발송 실패 (discord_id={discord_id}): {exc}")
        return False


async def start_bot() -> None:
    if not DISCORD_BOT_TOKEN:
        raise RuntimeError("DISCORD_BOT_TOKEN이 .env에 설정되어 있지 않습니다.")
    await bot.start(DISCORD_BOT_TOKEN)

from datetime import datetime, timezone
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.modules.core_trade.models import Item, ItemStatus, User

logger = logging.getLogger("uvicorn.error")
scheduler = AsyncIOScheduler()


async def check_unmatched_expired_items():
    """만료 시간이 지난 AVAILABLE 물품을 조회하여 EXPIRED_UNMATCHED로 전환하고 푸시 트리거"""
    now = datetime.now(timezone.utc)
    logger.info(f"[Scheduler] 미매칭 만료 물품 스캔 시작 (기준 시각: {now.isoformat()})")

    async with AsyncSessionLocal() as db:
        # 1. 만료 조건: 거래중(AVAILABLE) + 만료 시각 경과 + 아직 알림 미발송
        stmt = (
            select(Item, User.fcm_token)
            .join(User, Item.seller_id == User.id)
            .where(
                Item.status == ItemStatus.AVAILABLE,
                Item.expires_at <= now,
                Item.disposal_notified == False,
            )
        )
        result = await db.execute(stmt)
        expired_records = result.all()

        if not expired_records:
            logger.info("[Scheduler] 만료 대상 물품이 없습니다.")
            return

        logger.info(f"[Scheduler] 만료 대상 {len(expired_records)}건 감지")

        for item, fcm_token in expired_records:
            # 2. 물품 상태를 미매칭 만료로 전환 및 알림 플래그 업데이트
            item.status = ItemStatus.EXPIRED_UNMATCHED
            item.disposal_notified = True

            # 3. 푸시 알림 발송 (FCM 연동 시뮬레이션 로그)
            # 추후 개발자 2의 기기 토큰과 개발자 4의 폐기 수수료 화면 라우팅 연계
            if fcm_token:
                logger.info(
                    f"[Push 발송 성공] 대상 유저 ID: {item.seller_id} | 기기 토큰: {fcm_token} | "
                    f"메시지: '등록하신 [{item.title}]의 나눔 기한이 만료되었습니다. 대형 폐기물 간편 배출로 전환하시겠습니까?'"
                )
            else:
                logger.info(
                    f"[Push 건너뜀] 대상 유저 ID: {item.seller_id} (FCM 토큰 미등록) | 물품: {item.title}"
                )

        await db.commit()
        logger.info("[Scheduler] 만료 물품 상태 갱신 및 커밋 완료")


def start_scheduler():
    """스케줄러 등록 및 구동 (1분마다 실행)"""
    scheduler.add_job(
        check_unmatched_expired_items,
        trigger="interval",
        minutes=1,
        id="check_expired_items_job",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("[Scheduler] 백그라운드 스케줄러가 시작되었습니다. (주기: 1분)")


def shutdown_scheduler():
    """스케줄러 안전 종료"""
    scheduler.shutdown(wait=False)
    logger.info("[Scheduler] 스케줄러가 종료되었습니다.")
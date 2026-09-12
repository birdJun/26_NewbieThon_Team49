# 전국 대형폐기물 수수료 모듈

## 구축 결과

- API 전체 22,831건, 142개 지역 조합 수집 및 원본 일치 검증 완료(2026-09-12).
- API가 제공하는 전체 범위이며 모든 지자체의 완전한 수록을 보장하지 않습니다.
- 버전 2: API 22,831건, 규격 누락 10,949건은 그대로 보존.
- 버전 1: 기존 XLS 22,831건, 규격 누락 0건. import_id=1로 선택.
- DB: waste_fee.db. 두 버전 합계 45,662행. 기본 조회는 최신 버전 2만 반환.
- 원본 JSON: waste_fee_api_source. 검색 데이터: waste_standard_data. 출처·해시: waste_file_imports.
- 기준일을 요금 시행일로 해석하지 않습니다. 배출 규정은 제공되지 않습니다.
- 정리 전 백업: waste_fee_before_cleanup.db.

## 시스템에 통합

```python
from app.waste_fee_api import waste_fee_router
host_app.include_router(waste_fee_router)
```

호스트의 세션을 쓰려면 get_waste_fee_session 의존성을 교체하세요. CORS·인증은 호스트 앱에서 관리합니다. API 키는 원천 데이터 수집용이며 로컬 DB 조회에는 필요하지 않습니다. 현재 조회 API는 공개 읽기 전용입니다. 현재 DB/시드는 SQLite용이며 PostgreSQL 이전은 별도 검증이 필요합니다.

## 로컬 실행

backend 폴더에서:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.waste_fee_module:create_waste_fee_app --factory --host 127.0.0.1 --port 8000
```

검색 예제: http://127.0.0.1:8000/waste-fees/demo
API 문서: http://127.0.0.1:8000/docs

이전 서버가 실행 중이면 해당 터미널에서 종료하고 새 명령으로 실행하세요. 기존 app.main:app, /api/v1/public-fees, /api/v1/waste/*, /demo는 제거했습니다.

## 환경 설정 및 복원

.env에는 DATA_GO_KR_SERVICE_KEY와 DATABASE_URL만 보관합니다. 키는 DB 조회에 필요하지 않고 원천 API 재수집용으로만 보존했습니다. 환경변수가 파일보다 우선합니다. DATABASE_URL 생략/빈 값이면 backend/waste_fee.db이며 현재 .env에는 절대 경로가 설정되어 있습니다. 다른 PC에서 경로를 변경하세요. .env는 Git 제외 대상입니다.

새 환경에 DB가 없을 때만 다음 명령을 실행합니다:

```powershell
.\.venv\Scripts\python.exe -c "from app.waste_fee_db import restore_waste_fee_db; restore_waste_fee_db()"
```

필수 마이그레이션 migrations/001_waste_fee.sql과 데이터 migrations/waste_fee_seed.sql을 이용합니다. 기존 DB는 덮어쓰지 않습니다. 일회성 수집/파싱 스크립트는 삭제했으며 복원에 필요한 스키마·시드·함수는 보존했습니다. 스키마/시드 복원 후 기존 DB와 모든 값이 일치하는 것을 확인했습니다.

## 테스트

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

조회, 필터, 페이지, 버전 선택, 오류, CORS를 검증합니다. 파일별 삭제 내역은 CLEANUP.md, 웹 연동은 WEB_API.md를 참고하세요.

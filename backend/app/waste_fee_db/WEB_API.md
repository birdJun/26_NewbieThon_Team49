# 웹 수수료 API

| GET 경로 | 기능 |
|---|---|
| /api/v1/waste-fees/regions | 지역 목록과 자료 버전 |
| /api/v1/waste-fees | 품목 검색 |
| /api/v1/waste-fees/{item_id} | 상세 조회 |

파라미터: province, district, q(품목명 부분 검색), limit(기본20, 최대100), offset(기본0), import_id(생략 시 최신 버전). district 사용 시 province도 필요합니다. 페이지 이동에는 최초 응답 dataset.id를 import_id로 전달하세요.

기본 버전 2는 API 원본이며 규격 누락이 있습니다. 기존 XLS 규격 자료를 쓰려면 import_id=1을 명시하세요. 서로 다른 출처의 누락값을 임의 병합하지 않습니다.

```javascript
async function searchWasteFees() {
  const params = new URLSearchParams({province:'서울특별시', district:'성북구', q:'의자', limit:'20'});
  const response = await fetch(`/api/v1/waste-fees?${params}`);
  if (!response.ok) throw new Error(`조회 실패: ${response.status}`);
  return response.json();
}
```

응답: dataset(id, source_name, imported_at, row_count), total, limit, offset, items.
품목: id, import_id, province, district, item_name, category, size_label, paid_free, fee_raw, amount_krw, managing_organization, reference_date, provider_code, provider_name.

금액이 확정 정수가 아니면 amount_krw=null이고 fee_raw에 원문이 남습니다. null은 무료가 아닙니다. reference_date는 데이터기준일이며 시행일이 아닙니다. 검색 결과 없음은 200/빈 배열, 품목·자료 없음은 404, 입력 오류는 422입니다. detail은 검증 오류 배열 또는 code/message 객체입니다. 화면에는 textContent로 표시하세요.

검증용 create_waste_fee_app의 기본 CORS: http://localhost:5500, http://127.0.0.1:5500, http://localhost:3000, http://localhost:5173. 다른 출처는 함수의 allowed_origins 인수나 호스트 앱에서 설정하세요. .env에는 웹 설정을 넣지 않습니다. 예제는 동일 출처 API를 호출하며 다른 웹 서버에서 사용하면 web/index.html의 API_BASE를 서버 주소로 바꾸세요.

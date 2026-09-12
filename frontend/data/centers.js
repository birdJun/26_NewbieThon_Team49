// 재활용센터 / 중고매입처
// 지자체 공식 안내 또는 전국재활용센터표준데이터에서 확인한 정보다.
window.BIUM_CENTERS = [
  { sido: "서울특별시", sigungu: "관악구", name: "관악구 재활용센터 봉천점", addr: "서울특별시 관악구 남부순환로 1663",
    tel: "02-883-0858", buys: ["가구", "가전", "기타"], verified: true },
  { sido: "서울특별시", sigungu: "관악구", name: "관악구 재활용센터 신림점", addr: "서울특별시 관악구 남부순환로 1494",
    tel: "02-842-8425", buys: ["가구", "가전", "기타"], verified: true },
  { sido: "서울특별시", sigungu: "성북구", name: "성북구 재활용센터", addr: "서울특별시 성북구 화랑로 146",
    tel: "02-943-8272", buys: ["가구", "가전"], verified: true },
  { sido: "경기도", sigungu: "수원시", name: "수원시 자원순환센터", addr: "경기도 수원시 영통구 광교호수로 278-1",
    tel: "031-888-7911", buys: ["기타"], verified: true },
  { sido: "부산광역시", sigungu: "부산진구", name: "부산진구 재활용센터", addr: "부산광역시 부산진구 신천대로 155",
    tel: "051-805-8272", buys: ["가구", "생활용품"], verified: true }
];

// 전국 공통 창구 — 아래 두 건은 공개된 공식 제도라 지역과 무관하게 항상 노출된다.
window.BIUM_NATIONAL = [
  { name: "폐가전제품 무상 방문수거",
    desc: "냉장고·세탁기·에어컨·TV 등 대형 가전은 환경부·가전사 공동 사업으로 무상 방문수거 된다. 수수료 0원.",
    link: "https://15990903.or.kr", linkLabel: "e순환거버넌스", appliesTo: ["appliance"] }
];

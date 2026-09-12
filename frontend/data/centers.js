// 재활용센터 / 중고매입처
// 담당: C  ·  verified:false 인 항목은 앱에서 '번호 확인 중'으로 표시되고 전화 버튼이 잠긴다.
//   → 실제 상호·주소·전화번호를 확인해서 채우고 verified:true 로 바꿀 것 (마감 16:30)
//   찾는 법: 지자체 홈페이지 '재활용센터' 검색, 또는 네이버지도에서 '<동네이름> 재활용센터'
window.BIUM_CENTERS = [
  { sido: "서울특별시", sigungu: "관악구", name: "관악구 재활용센터", addr: "관악구 (주소 확인 필요)",
    tel: "", buys: ["가구", "가전"], verified: false },
  { sido: "서울특별시", sigungu: "관악구", name: "중고가구 매입점", addr: "관악구 (주소 확인 필요)",
    tel: "", buys: ["가구"], verified: false },
  { sido: "서울특별시", sigungu: "성북구", name: "성북구 재활용센터", addr: "성북구 (주소 확인 필요)",
    tel: "", buys: ["가구", "가전"], verified: false },
  { sido: "경기도", sigungu: "수원시", name: "수원시 재활용센터", addr: "수원시 (주소 확인 필요)",
    tel: "", buys: ["가구", "가전"], verified: false },
  { sido: "부산광역시", sigungu: "부산진구", name: "부산진구 재활용센터", addr: "부산진구 (주소 확인 필요)",
    tel: "", buys: ["가구", "가전"], verified: false }
];

// 전국 공통 창구 — 아래 두 건은 공개된 공식 제도라 지역과 무관하게 항상 노출된다.
window.BIUM_NATIONAL = [
  { name: "폐가전제품 무상 방문수거",
    desc: "냉장고·세탁기·에어컨·TV 등 대형 가전은 환경부·가전사 공동 사업으로 무상 방문수거 된다. 수수료 0원.",
    link: "https://15990903.or.kr", linkLabel: "e순환거버넌스", appliesTo: ["appliance"] }
];

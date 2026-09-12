// 대형폐기물 품목 카탈로그
// 담당: C  ·  수수료 데이터(data/fees.js)의 품목명과 match 키워드로 연결된다.
//   reuse: 3 = 나눔 수요 높음 / 2 = 보통 / 1 = 낮음 / 0 = 나눔 부적합(위생·안전)
window.BIUM_ITEMS = [
  // ── 가구 ──────────────────────────────────────────────
  { id: "bed",       cat: "furniture", name: "침대",       reuse: 2, match: ["침대"],
    specs: ["싱글", "슈퍼싱글", "퀸", "킹", "프레임만"] },
  { id: "mattress",  cat: "furniture", name: "매트리스",   reuse: 1, match: ["매트리스", "침대"],
    specs: ["싱글", "퀸 이상", "토퍼·얇은 것"] },
  { id: "wardrobe",  cat: "furniture", name: "장롱",       reuse: 1, match: ["장롱", "옷장"],
    specs: ["1자(30cm)당", "3문", "5문 이상"] },
  { id: "dresser",   cat: "furniture", name: "서랍장",     reuse: 3, match: ["서랍장", "수납장", "장롱"],
    specs: ["3단 이하", "4단 이상"] },
  { id: "desk",      cat: "furniture", name: "책상",       reuse: 3, match: ["책상"],
    specs: ["폭 1m 미만", "폭 1m 이상", "책상+책장 일체형"] },
  { id: "chair",     cat: "furniture", name: "의자",       reuse: 3, match: ["의자"],
    specs: ["일반", "사무용(바퀴)", "1인 소파형"] },
  { id: "sofa",      cat: "furniture", name: "소파",       reuse: 2, match: ["소파"],
    specs: ["1인용", "2~3인용", "4인용 이상"] },
  { id: "table",     cat: "furniture", name: "식탁",       reuse: 3, match: ["식탁", "테이블"],
    specs: ["2인용", "4인용", "6인용 이상"] },
  { id: "bookshelf", cat: "furniture", name: "책장",       reuse: 3, match: ["책장", "책꽂이"],
    specs: ["3단 이하", "4단 이상"] },
  { id: "vanity",    cat: "furniture", name: "화장대",     reuse: 3, match: ["화장대"], specs: ["일반"] },
  { id: "shoerack",  cat: "furniture", name: "신발장",     reuse: 2, match: ["신발장"], specs: ["일반"] },
  { id: "tvstand",   cat: "furniture", name: "TV장",       reuse: 3, match: ["티비장", "tv장", "거실장"], specs: ["일반"] },

  // ── 가전 ──────────────────────────────────────────────
  { id: "fridge",    cat: "appliance", name: "냉장고",     reuse: 2, match: ["냉장고"],
    specs: ["300L 미만", "300L 이상", "양문형"] },
  { id: "kimchi",    cat: "appliance", name: "김치냉장고", reuse: 2, match: ["김치냉장고", "냉장고"],
    specs: ["뚜껑형", "스탠드형"] },
  { id: "washer",    cat: "appliance", name: "세탁기",     reuse: 2, match: ["세탁기"],
    specs: ["일반", "드럼"] },
  { id: "dryer",     cat: "appliance", name: "건조기",     reuse: 2, match: ["건조기"], specs: ["일반"] },
  { id: "tv",        cat: "appliance", name: "TV",         reuse: 2, match: ["티비", "tv", "텔레비전"],
    specs: ["40인치 미만", "40인치 이상"] },
  { id: "aircon",    cat: "appliance", name: "에어컨",     reuse: 1, match: ["에어컨"],
    specs: ["벽걸이", "스탠드", "실외기"] },
  { id: "micro",     cat: "appliance", name: "전자레인지", reuse: 3, match: ["전자레인지"], specs: ["일반"] },
  { id: "cleaner",   cat: "appliance", name: "청소기",     reuse: 3, match: ["청소기"], specs: ["일반"] },
  { id: "purifier",  cat: "appliance", name: "정수기",     reuse: 1, match: ["정수기"], specs: ["일반"] },
  { id: "pc",        cat: "appliance", name: "컴퓨터 본체", reuse: 3, match: ["컴퓨터", "pc", "본체"], specs: ["일반"] },
  { id: "monitor",   cat: "appliance", name: "모니터",     reuse: 3, match: ["모니터"], specs: ["일반"] },

  // ── 생활용품 ──────────────────────────────────────────
  { id: "bike",      cat: "living",    name: "자전거",     reuse: 3, match: ["자전거"],
    specs: ["일반", "전기자전거"] },
  { id: "stroller",  cat: "living",    name: "유모차",     reuse: 3, match: ["유모차"], specs: ["일반"] },
  { id: "treadmill", cat: "living",    name: "러닝머신",   reuse: 2, match: ["러닝머신", "운동기구"], specs: ["일반"] },
  { id: "carpet",    cat: "living",    name: "카펫·장판",  reuse: 1, match: ["카펫", "장판", "매트"],
    specs: ["1평 미만", "1평 이상"] },
  { id: "bedding",   cat: "living",    name: "이불·요",    reuse: 0, match: ["이불", "요", "침구"], specs: ["일반"] },
  { id: "luggage",   cat: "living",    name: "여행용 캐리어", reuse: 3, match: ["캐리어", "가방"], specs: ["일반"] },
  { id: "hanger",    cat: "living",    name: "행거",       reuse: 3, match: ["행거", "옷걸이"], specs: ["일반"] },
  { id: "drylack",   cat: "living",    name: "빨래건조대", reuse: 3, match: ["건조대"], specs: ["일반"] },
  { id: "mirror",    cat: "living",    name: "거울",       reuse: 2, match: ["거울"],
    specs: ["전신", "탁상·소형"] },
  { id: "aquarium",  cat: "living",    name: "어항",       reuse: 2, match: ["어항", "수족관"], specs: ["일반"] },

  // ── 기타 ──────────────────────────────────────────────
  { id: "piano",     cat: "etc",       name: "피아노",     reuse: 2, match: ["피아노"],
    specs: ["디지털", "업라이트"] },
  { id: "sink",      cat: "etc",       name: "싱크대",     reuse: 0, match: ["싱크대"], specs: ["1m당"] },
  { id: "door",      cat: "etc",       name: "문짝",       reuse: 0, match: ["문짝", "방문"], specs: ["일반"] },
  { id: "toilet",    cat: "etc",       name: "변기",       reuse: 0, match: ["변기", "양변기"], specs: ["일반"] },
  { id: "bathtub",   cat: "etc",       name: "욕조",       reuse: 0, match: ["욕조"], specs: ["일반"] },
  { id: "pot",       cat: "etc",       name: "항아리",     reuse: 1, match: ["항아리", "독"], specs: ["일반"] }
];

window.BIUM_CATEGORIES = [
  { id: "furniture", name: "가구" },
  { id: "appliance", name: "가전" },
  { id: "living",    name: "생활용품" },
  { id: "etc",       name: "기타" }
];

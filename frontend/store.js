/* 저장소 — 지금은 브라우저 localStorage 를 쓴다.
   TODO(다같이): 서버가 생기면 이 파일 안의 함수 본문만 fetch 로 바꾸면 된다.
                 화면 코드는 이 함수들만 부르므로 app.js 는 손댈 필요 없음. */
window.BiumStore = (function () {
  const K = { posts: "bium.posts.v1", records: "bium.records.v1", region: "bium.region.v1",
              infoRegion: "bium.info-region.v1", profile: "bium.profile.v1", auth: "bium.auth.v1", token: "bium.token.v1", intro: "bium.intro.v1" };

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn("[Bium] 저장 실패(용량 초과일 수 있음):", e); return false; }
  }

  /* 처음 열었을 때 목록이 비어 보이지 않도록 넣어두는 예시 글.
     TODO(D): 시연용으로 더 그럴듯한 글이 필요하면 여기를 고칠 것 */
  const SEED = [
    { id: "seed1", itemId: "desk",    itemName: "책상",   spec: "폭 1m 이상",
      title: "이사 가면서 책상 나눔합니다", desc: "폭 1.2m, 상판에 흠집 조금 있어요.",
      cond: "사용감 적음", dong: "신림동", photo: null, status: "open",  at: Date.now() - 1000 * 60 * 12, seed: true },
    { id: "seed2", itemId: "dresser", itemName: "서랍장", spec: "4단 이상",
      title: "4단 서랍장 가져가실 분", desc: "상태 좋습니다. 직접 들고 가셔야 해요.",
      cond: "새것 같음", dong: "봉천동", photo: null, status: "open",  at: Date.now() - 1000 * 60 * 64, seed: true },
    { id: "seed3", itemId: "bike",    itemName: "자전거", spec: "일반",
      title: "자전거 드립니다 (체인 교체 필요)", desc: "타는 데 지장은 없습니다.",
      cond: "사용감 있음", dong: "신림동", photo: null, status: "held",  at: Date.now() - 1000 * 60 * 200, seed: true },
    { id: "seed4", itemId: "fridge",  itemName: "냉장고", spec: "300L 미만",
      title: "미니 냉장고 나눔", desc: "자취방에서 1년 썼어요.",
      cond: "사용감 적음", dong: "청룡동", photo: null, status: "done", at: Date.now() - 1000 * 60 * 60 * 26, seed: true }
  ];

  function posts() {
    const saved = read(K.posts, null);
    if (saved === null) { write(K.posts, SEED); return SEED.slice(); }
    return saved;
  }

  function addPost(post) {
    const all = posts();
    post.id = "p" + Date.now();
    post.at = Date.now();
    post.status = "open";
    all.unshift(post);
    write(K.posts, all);
    return post;
  }

  function setPostStatus(id, status) {
    const all = posts().map(p => (p.id === id ? Object.assign({}, p, { status }) : p));
    write(K.posts, all);
  }

  function records() { return read(K.records, []); }

  function addRecord(rec) {
    const all = records();
    rec.id = "r" + Date.now();
    rec.at = Date.now();
    all.unshift(rec);
    write(K.records, all);
    return rec;
  }

  /* 기본 지역. 데이터에 관악구가 있으면 관악구, 없으면 첫 번째 지역.
     TODO(팀원 누구든): 나중에는 브라우저 위치정보로 자동 선택하면 좋다. */
  const DEFAULT_SIGUNGU = "관악구";
  function region() {
    const saved = read(K.region, null);
    if (saved) return saved;
    const all = window.BiumLookup.regions();
    return all.find(r => r.sigungu === DEFAULT_SIGUNGU) || all[0]
        || { sido: "서울특별시", sigungu: "관악구" };
  }
  function setRegion(r) { write(K.region, r); }
  function infoRegion() { return read(K.infoRegion, null); }
  function setInfoRegion(r) { write(K.infoRegion, r); }

  /* 배출번호: 월일 + 네자리. 실제 구청 번호 체계와는 무관한 우리 앱의 접수번호다.
     TODO(B): 발표 때 "실제 구청 시스템 연동 시 구청 발급번호로 대체" 라고 언급할 것 */
  function issueNumber() {
    const d = new Date();
    const mmdd = String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return mmdd + "-" + rand;
  }

  function reset() { Object.values(K).forEach(k => localStorage.removeItem(k)); }

  /* 로그인/프로필 — 지금은 서버 인증이 없다.
     닉네임만 이 브라우저(기기)에 저장해두고, 있으면 "로그인된" 것으로 취급한다.
     TODO(나중에 백엔드 생기면): 여기 세 함수 본문만 서버 호출로 바꾸면 화면 코드는 안 건드려도 된다. */
  function profile() { return read(K.profile, null); }
  function saveProfile(p) { write(K.profile, p); return p; }
  function clearProfile() { localStorage.removeItem(K.profile); }
  function auth() { return read(K.auth, null); }
  function token() { return read(K.token, null); }
  function setToken(value) { write(K.token, value); }
  function login(provider, account) {
    const user = Object.assign({ provider: provider, id: provider + "-demo", at: Date.now() }, account || {});
    write(K.auth, user); return user;
  }
  function hasSeenIntro() { return read(K.intro, false) === true; }
  function setSeenIntro() { write(K.intro, true); }
  function logout() { localStorage.removeItem(K.profile); localStorage.removeItem(K.auth); localStorage.removeItem(K.token); }

  return { posts, addPost, setPostStatus, records, addRecord, region, setRegion, infoRegion, setInfoRegion, issueNumber, reset,
           profile, saveProfile, clearProfile, auth, token, setToken, login, hasSeenIntro, setSeenIntro, logout };
})();

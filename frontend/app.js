/* 비움 — 화면 렌더링과 이동
   ─────────────────────────────────────────────────────────────
   구조:  state(지금 어느 화면인가) → render() → screens[이름]() 이 HTML 문자열을 돌려줌
          버튼은 전부 data-act 속성으로 처리한다 (맨 아래 이벤트 처리 부분 참고)
   화면을 하나 추가하려면: screens 객체에 함수 하나 추가 + go("이름") 으로 이동
   ───────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  const app = document.getElementById("app");
  const L = window.BiumLookup, S = window.BiumStore;
  const kakaoConfig = window.BIUM_KAKAO || {};
  const API_BASE = window.BIUM_API_BASE || "/api/v1";

  const state = {
    screen: "login",
    stack: [],
    region: null,
    profile: null,       // 로그인한(닉네임 저장된) 사용자. 없으면 온보딩부터.
    draftProfile: {},    // 온보딩 입력 중인 값 { nickname, sido, sigungu, addr }
    draft: {},          // 지금 고르는 중인 품목 { itemId, spec, photo, ai }
    cat: "furniture",   // 품목 고르기 화면에서 선택된 카테고리
    filter: "all",      // 나눔 목록 필터
    aiBusy: false,
    aiError: "",
    authError: "",
    authMode: "login",
    authBusy: false,
    sheet: null         // 열려 있는 바텀시트 이름
  };

  /* ── 작은 도구들 ──────────────────────────────────────── */
  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const won = n => (n == null ? "—" : Number(n).toLocaleString("ko-KR") + "원");
  const CAT_NAME = { furniture: "가구", appliance: "가전", living: "생활용품", etc: "기타" };

  function ago(ts) {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return "방금";
    if (m < 60) return m + "분 전";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "시간 전";
    const d = Math.floor(h / 24);
    return d === 1 ? "어제" : d + "일 전";
  }

  /* ── 아이콘 ───────────────────────────────────────────── */
  const svg = (d, n) => '<svg width="' + (n || 20) + '" height="' + (n || 20) + '" viewBox="0 0 24 24" '
    + 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const I = {
    pin:   d => svg('<path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>', d),
    chevD: d => svg('<path d="m6 9 6 6 6-6"/>', d),
    chevR: d => svg('<path d="m9 6 6 6-6 6"/>', d),
    back:  d => svg('<path d="m15 6-6 6 6 6"/>', d),
    cam:   d => svg('<path d="M4 8.5h3l1.5-2h7L17 8.5h3v10H4z"/><circle cx="12" cy="13" r="3.4"/>', d),
    grid:  d => svg('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>', d),
    gift:  d => svg('<path d="M4 11h16v9H4z"/><path d="M3 7.5h18V11H3z"/><path d="M12 7.5V20"/><path d="M12 7.5S10.8 4 8.8 4a2 2 0 0 0 0 4H12Zm0 0s1.2-3.5 3.2-3.5a2 2 0 0 1 0 4H12Z"/>', d),
    truck: d => svg('<path d="M3 6.5h11v9H3z"/><path d="M14 9.5h3.6l2.4 3v3H14z"/><circle cx="7" cy="18" r="1.9"/><circle cx="17" cy="18" r="1.9"/>', d),
    recyc: d => svg('<path d="M7.4 8.6 9.8 4.5a2.4 2.4 0 0 1 4.2 0l1.3 2.3"/><path d="m16.9 9.6 2.4 4.2a2.4 2.4 0 0 1-2.1 3.6h-2.7"/><path d="M9.3 17.4H5.1A2.4 2.4 0 0 1 3 13.8l1.4-2.4"/><path d="m5.6 11.4-1.2 2.4 2.7.3"/><path d="m17.1 9.9-2.6.6.8 2.6"/><path d="m11.9 17.4 2-1.9-2-1.9"/>', d),
    info:  d => svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>', d),
    check: d => svg('<path d="M20 6 9 17l-5-5"/>', d),
    home:  d => svg('<path d="M4 10.5 12 4l8 6.5V20H4z"/><path d="M9.5 20v-6h5v6"/>', d),
    user:  d => svg('<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/>', d),
    phone: d => svg('<path d="M6.5 3.5h3l1.6 4-2 1.4a12 12 0 0 0 6 6l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"/>', d),
    search: d => svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>', d),
    spark: d => svg('<path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z"/>', d),
    box:   d => svg('<path d="M4 8.5 12 4l8 4.5V17L12 21l-8-4V8.5Z"/><path d="m4 8.5 8 4.5 8-4.5M12 13v8"/>', d)
  };

  /* ── 공통 조각 ────────────────────────────────────────── */
  const topbarBrand = () =>
    '<header class="topbar"><div class="brand"><span class="name">비움</span>'
    + '<span class="tag">대형폐기물 배출 도우미</span></div></header>';

  const topbar = title =>
    '<header class="topbar"><button class="back" data-act="back" aria-label="뒤로">'
    + I.back(22) + '</button><h1>' + esc(title) + '</h1></header>';

  function tabs(active) {
    const t = (key, label, icon) =>
      '<button class="tab" role="tab" aria-selected="' + (key === active) + '" data-act="tab" data-tab="'
      + key + '">' + icon(21) + '<span>' + label + '</span></button>';
    return '<nav class="tabs" role="tablist">' + t("home", "홈", I.home)
      + t("share", "나눔", I.gift) + t("me", "내 기록", I.user) + '</nav>';
  }

  const regionBar = () =>
    '<button class="region" data-act="sheet" data-sheet="region">' + I.pin(17)
    + '<span>' + esc(state.region.sido) + " " + esc(state.region.sigungu) + '</span>'
    + '<span class="chev">' + I.chevD(17) + '</span></button>';

  const sampleNotice = () => window.BIUM_FEES_SAMPLE
    ? '<div class="notice sample">' + I.info(15)
      + '<span><strong>지금은 샘플 수수료 데이터입니다.</strong> 공공데이터포털 실데이터로 교체 예정입니다.</span></div>'
    : "";

  /* ═══════════════════════════════════════════════════════
     화면들
     ═══════════════════════════════════════════════════════ */
  const screens = {};

  screens.login = function () {
    const signup = state.authMode === "signup";
    return '<main class="screen" style="justify-content:center;padding:30px 24px;gap:24px">'
      + '<div style="display:grid;gap:8px;text-align:center"><div class="login-symbol">♻</div>'
      + '<h2 class="title">비움</h2><p class="lede">버리기 전에, 더 나은 방법을 찾아드려요.</p></div>'
      + '<div class="auth-form"><div class="field"><label for="auth-username">아이디</label><input id="auth-username" autocomplete="username" minlength="4" maxlength="20" placeholder="4~20자 영문·숫자"' + (state.authBusy ? " disabled" : "") + '></div>'
      + '<div class="field"><label for="auth-password">비밀번호</label><input id="auth-password" type="password" autocomplete="' + (signup ? "new-password" : "current-password") + '" minlength="4" placeholder="4자 이상"' + (state.authBusy ? " disabled" : "") + '></div>'
      + '<button class="btn" data-act="password-auth"' + (state.authBusy ? " disabled" : "") + '>' + (state.authBusy ? '<span class="spinner"></span>처리 중...' : (signup ? "회원가입하고 시작하기" : "로그인")) + '</button>'
      + '<button class="auth-switch" data-act="auth-toggle"' + (state.authBusy ? " disabled" : "") + '>' + (signup ? "이미 계정이 있어요 · 로그인" : "처음이신가요? 회원가입") + '</button></div>'
      + (state.authError ? '<div class="notice error">' + I.info(15) + '<span>' + esc(state.authError) + '</span></div>' : '')
      + '<div class="auth-divider"><span></span>또는<span></span></div>'
      + '<button class="social-btn muted" disabled><span class="kakao-mark">●</span>카카오 로그인은 연동 준비 중이에요</button>'
      + '<p class="lede" style="font-size:11.5px;text-align:center">로그인하면 주소와 배출 기록을 관리할 수 있어요.</p></main>';
  };

  screens.authLoading = function () {
    return '<main class="screen" style="justify-content:center;align-items:center;text-align:center;gap:12px">'
      + '<span class="spinner" style="width:28px;height:28px;color:var(--pine)"></span><h2 class="title">카카오 로그인 중</h2>'
      + '<p class="lede">잠시만 기다려주세요.</p></main>';
  };

  screens.intro = function () {
    const page = state.introPage || 0;
    const slides = [['집에 쌓인 큰 물건,\n어떻게 처리할까요?', '사진 한 장으로 품목을 찾고 우리 동네 기준 처리 방법을 비교해요.', '📦'],
      ['나눔부터 배출까지\n한 곳에서 해결해요', '무료나눔 · 구청 배출 · 재활용센터 중 맞는 방법을 선택하세요.', '🌱']];
    const s = slides[page];
    return '<main class="screen" style="justify-content:space-between;padding:42px 24px 28px"><div></div>'
      + '<div style="display:grid;gap:18px;text-align:center;justify-items:center"><div style="font-size:76px;background:var(--pine-wash);border-radius:32px;padding:22px">' + s[2] + '</div>'
      + '<h2 class="title" style="white-space:pre-line">' + s[0] + '</h2><p class="lede">' + s[1] + '</p>'
      + '<div style="display:flex;gap:7px"><i class="intro-dot ' + (!page ? 'on' : '') + '"></i><i class="intro-dot ' + (page ? 'on' : '') + '"></i></div></div>'
      + '<button class="btn" data-act="intro-next">' + (!page ? '다음' : '비움 시작하기') + '</button></main>';
  };

  screens.address = function () {
    const d = state.draftProfile;
    return '<main class="screen" style="padding-top:42px;gap:22px"><div style="display:grid;gap:7px"><span class="eyebrow" style="color:var(--pine)">내 동네 설정</span>'
      + '<h2 class="title">집 주소를 등록해주세요</h2><p class="lede">입력한 주소는 내 배출 기록과 동네 기준을 설정할 때만 사용해요.</p></div>'
      + '<div class="field"><label for="home-address">집 주소</label><input id="home-address" autocomplete="street-address" enterkeyhint="done" placeholder="예) 서울 관악구 신림로 12길 34" value="' + esc(d.addr || '') + '">'
      + '<p class="help">도로명 또는 지번 주소를 입력할 수 있어요.</p></div>'
      + '<div class="notice"><span>' + I.pin(15) + '</span><span>주소에서 구·군을 확인해 해당 지역 수수료 기준을 자동으로 적용합니다.</span></div>'
      + (state.addressError ? '<div class="notice error">' + I.info(15) + '<span>' + esc(state.addressError) + '</span></div>' : '')
      + '<div style="flex:1"></div><button class="btn" data-act="save-address">내 주소로 계속하기</button></main>';
  };

  /* 0 · 온보딩 — 처음 켰을 때 딱 한 번. 닉네임 + 동네를 받는다.
     TODO(나중에): 지금은 이름만 있으면 통과되는 로컬 로그인이다.
                  실제 서비스로 갈 땐 문자인증/소셜로그인으로 바꿔야 한다. */
  screens.onboarding = function () {
    const d = state.draftProfile;
    const regions = L.regions();
    const ready = d.nickname && d.nickname.trim() && d.sigungu;
    const regionField = d.sigungu
      ? '<div class="notice"><span>' + I.pin(15) + '</span><span><strong>' + esc(d.sido + ' ' + d.sigungu) + '</strong><br>이 주소를 기본 동네로 저장합니다.</span></div>'
      : '<div class="field"><label>동네 (구·군)</label><div class="list">'
        + regions.map(r => '<button class="card" data-act="ob-region" data-sido="' + esc(r.sido) + '" data-sigungu="' + esc(r.sigungu) + '" style="align-items:center;' + (d.sigungu === r.sigungu ? 'border-color:var(--pine);background:var(--pine-wash)' : '') + '"><span class="glyph" style="width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:' + (d.sigungu === r.sigungu ? 'var(--pine)' : 'var(--surface-2)') + ';color:' + (d.sigungu === r.sigungu ? '#fff' : 'var(--ink-3)') + '">' + I.pin(16) + '</span><span class="body"><h4>' + esc(r.sido) + ' ' + esc(r.sigungu) + '</h4></span></button>').join('')
        + '</div></div>';

    return '<main class="screen" style="padding-top:52px;gap:26px">'
      + '<div style="display:grid;gap:6px">'
      +   '<span class="eyebrow" style="color:var(--pine)">시작하기</span>'
      +   '<h2 class="title">거의 다 됐어요</h2>'
      +   '<p class="lede">서비스에서 사용할 닉네임을 정해주세요.</p>'
      + '</div>'
      + '<div class="field"><label for="ob-name">닉네임</label>'
      +   '<input id="ob-name" data-act="ob-name" placeholder="예) 관악동자" value="' + esc(d.nickname || "") + '"></div>'
      + regionField
      + (d.addr ? '<div class="notice"><span>' + I.check(15) + '</span><span><strong>등록한 집 주소</strong><br>' + esc(d.addr) + '</span></div>'
        : '<div class="field"><label for="ob-addr">상세 주소 (선택)</label><input id="ob-addr" data-act="ob-addr" placeholder="예) 신림로 12길, 3층" value=""></div>')
      + '<div style="flex:1"></div>'
      + '<button class="btn" data-act="ob-submit"' + (ready ? "" : " disabled") + '>시작하기</button>'
      + '<p class="lede" style="font-size:11.5px;text-align:center;color:var(--ink-3)">'
      +   '한 번 입력하면 이 기기에서는 다시 묻지 않습니다.</p>'
      + '</main>';
  };

  /* 1 · 홈 */
  screens.home = function () {
    const recent = S.posts().filter(p => p.status === "open").slice(0, 2);
    return topbarBrand() + '<main class="screen">'
      + regionBar()
      + '<div style="display:grid;gap:6px">'
      +   '<h2 class="title">무엇을 정리하시나요?</h2>'
      +   '<p class="lede">품목을 알려주시면 우리 동네 기준으로 방법과 비용을 계산해 드립니다.</p>'
      + '</div>'
      + '<div class="actions">'
      +   '<button class="action primary" data-act="go" data-to="camera">'
      +     '<span class="glyph">' + I.cam(23) + '</span>'
      +     '<span><strong>사진으로 찾기</strong><span>찍으면 품목과 규격을 자동으로 알아냅니다</span></span></button>'
      +   '<button class="action" data-act="go" data-to="pick">'
      +     '<span class="glyph">' + I.grid(21) + '</span>'
      +     '<span><strong>품목 직접 고르기</strong><span>가구·가전·생활용품 '
      +     (window.BIUM_ITEMS || []).length + '개 품목</span></span></button>'
      + '</div>'
      + '<div class="divider"></div>'
      + '<div class="row-between"><h3 class="sub">우리 동네 나눔</h3>'
      +   '<button class="chip" data-act="tab" data-tab="share" style="border:none;background:none;color:var(--ink-3);padding:0">'
      +   '전체보기' + I.chevR(14) + '</button></div>'
      + '<div class="list">' + (recent.length ? recent.map(postCard).join("")
          : '<p class="empty">아직 올라온 나눔이 없습니다.</p>') + '</div>'
      + '</main>' + tabs("home");
  };

  /* 2 · 사진으로 찾기 */
  screens.camera = function () {
    const d = state.draft;
    let body = "";

    if (!d.photo) {
      body = '<div class="photo-preview" style="display:grid;place-items:center;color:var(--ink-3);gap:10px">'
        +   I.cam(40) + '<span style="font-size:13px">사진을 찍거나 앨범에서 고르세요</span></div>'
        + '<div style="flex:1"></div>'
        + '<label class="btn">' + I.cam(19) + '사진 찍기'
        +   '<input type="file" accept="image/*" capture="environment" data-act="photo" hidden></label>'
        + '<label class="btn ghost">앨범에서 고르기'
        +   '<input type="file" accept="image/*" data-act="photo" hidden></label>';
    } else {
      body = '<img class="photo-preview" src="' + d.photo + '" alt="촬영한 물건 사진">';

      if (state.aiBusy) {
        body += '<div class="notice">' + '<span class="spinner"></span>'
          + '<span>사진을 보고 품목을 찾는 중입니다…</span></div>';
      } else if (d.ai && d.ai.itemId) {
        const it = L.findItem(d.ai.itemId);
        const pct = Math.round((d.ai.confidence || 0) * 100);
        body += '<div style="display:grid;gap:11px;padding:15px;border-radius:14px;'
          +   'background:var(--surface);border:1px solid var(--line)">'
          +   '<div style="display:flex;align-items:center;gap:7px;color:var(--pine)">' + I.spark(17)
          +     '<span class="eyebrow" style="color:var(--pine)">사진 인식 결과</span></div>'
          +   '<div style="display:flex;align-items:baseline;gap:9px">'
          +     '<strong style="font-size:22px;font-weight:600;letter-spacing:-.03em">' + esc(it.name) + '</strong>'
          +     '<span style="font-size:14px;color:var(--ink-2)">' + esc(d.ai.spec || it.specs[0]) + '</span>'
          +     '<span class="mono" style="margin-left:auto;font-size:13px;color:var(--ink-2)">' + pct + '%</span></div>'
          +   (d.ai.note ? '<p class="lede" style="font-size:12.5px">' + esc(d.ai.note) + '</p>' : "")
          + '</div>';
        if (d.ai.alts && d.ai.alts.length) {
          body += '<div style="display:grid;gap:8px"><span class="eyebrow">이게 아니라면</span><div class="chips">'
            + d.ai.alts.map(a => { const t = L.findItem(a);
                return '<button class="chip" data-act="pick-item" data-item="' + a + '">' + esc(t.name) + '</button>'; }).join("")
            + '<button class="chip" data-act="go" data-to="pick">직접 고르기</button></div></div>';
        }
        body += '<div style="flex:1"></div>'
          + '<button class="btn" data-act="confirm-ai">' + I.check(19) + '맞습니다 · 방법 보기</button>'
          + '<button class="btn ghost" data-act="retake">다시 찍기</button>';
      } else {
        body += '<div class="notice">' + I.info(15) + '<span>'
          + esc(state.aiError || "사진에서 품목을 찾지 못했습니다. 직접 골라주세요.") + '</span></div>'
          + '<div style="flex:1"></div>'
          + '<button class="btn" data-act="go" data-to="pick">품목 직접 고르기</button>'
          + '<button class="btn ghost" data-act="retake">다시 찍기</button>';
      }
    }
    return topbar("사진으로 찾기") + '<main class="screen">' + body + '</main>';
  };

  /* 3 · 품목 직접 고르기 */
  screens.pick = function () {
    const d = state.draft;
    const sel = d.itemId ? L.findItem(d.itemId) : null;
    const items = L.itemsOf(state.cat);

    return topbar("품목 고르기") + '<main class="screen">'
      + '<div class="field"><input type="search" placeholder="품목 이름으로 검색" data-act="search" '
      +   'value="' + esc(state.q || "") + '"></div>'
      + (state.q
          ? '<div class="item-grid">' + (L.search(state.q).map(itemBtn).join("")
              || '<p class="empty" style="grid-column:1/-1">검색 결과가 없습니다.</p>') + '</div>'
          : '<div class="chips">' + (window.BIUM_CATEGORIES || []).map(c =>
              '<button class="chip" data-act="cat" data-cat="' + c.id + '" aria-pressed="'
              + (c.id === state.cat) + '">' + esc(c.name) + '</button>').join("") + '</div>'
            + '<div class="item-grid">' + items.map(itemBtn).join("") + '</div>')
      + (sel ? '<div class="divider"></div>'
          + '<div style="display:grid;gap:9px"><h3 class="sub">' + esc(sel.name) + ' — 규격을 골라주세요</h3>'
          + '<div class="chips">' + sel.specs.map(sp =>
              '<button class="chip" data-act="spec" data-spec="' + esc(sp) + '" aria-pressed="'
              + (sp === d.spec) + '">' + esc(sp) + '</button>').join("") + '</div></div>'
        : "")
      + '<div style="flex:1"></div>'
      + '<button class="btn" data-act="to-result"' + (sel && d.spec ? "" : " disabled") + '>'
      +   (sel && d.spec ? esc(sel.name) + " · " + esc(d.spec) + "으로 계속" : "품목과 규격을 골라주세요") + '</button>'
      + '</main>';
  };

  function itemBtn(i) {
    return '<button class="item-btn" data-act="pick-item" data-item="' + i.id + '">' + esc(i.name) + '</button>';
  }

  /* 4 · 세 가지 방법 ★ 핵심 화면 */
  screens.result = function () {
    const item = L.findItem(state.draft.itemId);
    const spec = state.draft.spec;
    const p = L.paths(state.region, item, spec);

    const card = (cls, icon, title, desc, amt, unit, note, opts) => {
      opts = opts || {};
      return '<button class="path ' + cls + '" data-act="' + opts.act + '">'
        + '<div class="path-head"><span class="glyph">' + icon(19) + '</span>'
        +   '<span><h3>' + title + (opts.badge ? ' <span class="badge rec">' + opts.badge + '</span>' : "")
        +   '</h3><p>' + desc + '</p></span>'
        +   '<span class="amount' + (opts.amtClass ? " " + opts.amtClass : "") + '"><b>' + amt + '</b><i>' + unit + '</i></span>'
        + '</div>'
        + '<div class="path-note">' + I.info(14) + '<span>' + note + '</span></div></button>';
    };

    let paths = "";
    // ① 나눔
    paths += card("share", I.gift, "이웃에게 나눔", "무료로 내놓고 가져갈 사람을 기다립니다",
      "0원", p.share.available ? "수수료 없음" : "권장하지 않음",
      esc(p.share.reason) + (p.share.saves ? " 성사되면 " + won(p.share.saves) + "을 아낍니다." : ""),
      { act: "go-share", badge: p.share.recommended ? "추천" : null, amtClass: "free" });
    // ② 배출
    paths += card("dispose", I.truck, "구청에 배출 신청", "신청하고 집 앞에 내놓으면 수거해 갑니다",
      p.dispose.unknown ? "확인 필요" : won(p.dispose.fee),
      p.dispose.unknown ? "데이터 없음" : esc(state.region.sigungu) + " 수수료",
      p.dispose.unknown
        ? "이 지역 수수료 데이터에 이 품목이 없습니다. 구청에 직접 확인해 주세요."
        : "신청하면 배출번호가 나옵니다. 종이에 적어 물건에 붙여 내놓으세요."
          + (p.dispose.exact ? "" : " (규격 <strong>" + esc(p.dispose.spec) + "</strong> 기준으로 계산)"),
      { act: "go-dispose" });
    // ③ 재활용
    const n = p.recycle.national[0];
    paths += card("recycle", I.recyc, n ? "무상 방문수거" : "재활용센터에 넘기기",
      n ? esc(n.desc.split(".")[0]) : "쓸 만한 물건은 매입해 가기도 합니다",
      n ? "0원" : "문의", n ? "전국 공통" : p.recycle.centers.length + "곳",
      n ? esc(n.desc) : "직접 가져가거나 방문 수거를 요청할 수 있습니다.",
      { act: "go-centers", amtClass: n ? "free" : "" });

    return topbar(item.name + " · " + spec) + '<main class="screen">'
      + '<div style="display:grid;gap:5px"><span class="eyebrow">'
      +   esc(state.region.sido) + " " + esc(state.region.sigungu) + ' 기준</span>'
      +   '<h2 class="title">세 가지 방법이 있습니다</h2></div>'
      + '<div class="paths">' + paths + '</div>'
      + '<div style="flex:1"></div>'
      + sampleNotice()
      + '<div class="notice">' + I.info(15) + '<span>수수료는 <strong>공공데이터포털 '
      +   '전국대형폐기물수거수수료정보표준데이터</strong>를 따릅니다. 실제 금액은 구청 고시 기준으로 달라질 수 있습니다.</span></div>'
      + '</main>';
  };

  /* 5 · 나눔 등록 */
  screens.shareForm = function () {
    const d = state.draft, item = L.findItem(d.itemId);
    return topbar("나눔 등록") + '<main class="screen">'
      + '<div class="card"><span class="thumb">'
      +   (d.photo ? '<img src="' + d.photo + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9px">'
                   : I.box(26)) + '</span>'
      +   '<span class="body"><h4>' + esc(item.name) + ' · ' + esc(d.spec) + '</h4>'
      +   '<p style="color:var(--ink-3)">' + (d.photo ? "사진에서 자동으로 입력되었습니다" : "직접 고른 품목입니다") + '</p></span></div>'
      + '<div class="field"><label for="f-title">제목</label>'
      +   '<input id="f-title" placeholder="예) 거의 안 쓴 3인용 패브릭 소파" value="' + esc(d.title || "") + '"></div>'
      + '<div class="field"><label>상태</label><div class="chips">'
      +   ["새것 같음", "사용감 적음", "사용감 있음"].map(c =>
            '<button class="chip" data-act="cond" data-cond="' + c + '" aria-pressed="'
            + (c === (d.cond || "사용감 적음")) + '">' + c + '</button>').join("") + '</div></div>'
      + '<div class="field"><label for="f-desc">설명</label>'
      +   '<textarea id="f-desc" placeholder="상태, 크기, 가져가는 방법을 적어주세요">' + esc(d.desc || "") + '</textarea></div>'
      + '<div class="field"><label for="f-dong">받아 가실 곳</label>'
      +   '<input id="f-dong" placeholder="예) 신림동 공동현관 앞" value="' + esc(d.dong || "") + '"></div>'
      + '<div style="flex:1"></div>'
      + '<button class="btn" data-act="submit-share">나눔 올리기</button>'
      + '</main>';
  };

  /* 6 · 배출 신고필증 */
  screens.sticker = function () {
    const r = state.record;
    return topbar("신청 완료") + '<main class="screen">'
      + '<div style="display:grid;justify-items:center;gap:9px;padding-top:6px">'
      +   '<span style="width:52px;height:52px;border-radius:50%;background:var(--pine-wash);color:var(--pine);'
      +   'display:grid;place-items:center">' + I.check(27) + '</span>'
      +   '<h2 class="title" style="text-align:center">배출 신청이 접수되었습니다</h2></div>'
      + '<div class="sticker">'
      +   '<div class="stamp"><b>대형폐기물 배출신고필증</b><span>' + esc(r.org || state.region.sigungu + "청") + '</span></div>'
      +   '<div class="no">' + esc(r.no) + '</div><div class="no-label">배 출 번 호</div>'
      +   '<dl><dt>품목</dt><dd>' + esc(r.itemName) + '</dd>'
      +   '<dt>규격</dt><dd>' + esc(r.spec) + '</dd>'
      +   '<dt>수수료</dt><dd class="mono">' + won(r.fee) + '</dd>'
      +   '<dt>배출일</dt><dd class="mono">' + esc(r.date) + '</dd>'
      +   '<dt>배출장소</dt><dd>집 앞 또는 지정 배출장소</dd></dl></div>'
      + '<div class="notice sample">' + I.info(15)
      +   '<span><strong>배출번호를 종이에 적어 물건에 붙여주세요.</strong> 번호가 없으면 수거되지 않습니다.</span></div>'
      + '<div style="flex:1"></div>'
      // TODO(팀원 누구든): 신고필증을 이미지로 저장하는 기능. canvas 로 그려서 내려받게 하면 된다.
      + '<button class="btn ghost" data-act="tab" data-tab="me">내 기록에서 다시 보기</button>'
      + '</main>';
  };

  /* 7 · 재활용센터 */
  screens.centers = function () {
    const item = L.findItem(state.draft.itemId);
    const p = L.paths(state.region, item, state.draft.spec);
    const n = p.recycle.national[0];

    const cards = p.recycle.centers.map(c =>
      '<div class="center-card"><div class="row"><h4>' + esc(c.name) + '</h4>'
      + (c.verified ? '<span class="badge" style="background:var(--pine-wash);color:var(--pine)">확인됨</span>'
                    : '<span class="badge warn">번호 확인 중</span>') + '</div>'
      + '<p class="addr">' + esc(c.addr) + '</p>'
      + '<div class="chips">' + (c.buys || []).map(b => '<span class="chip" style="min-height:auto;padding:3px 9px;font-size:11px">'
          + esc(b) + '</span>').join("") + '</div>'
      + (c.verified && c.tel
          ? '<a class="btn ghost small" href="tel:' + esc(c.tel) + '" style="width:100%;justify-content:center">'
            + I.phone(16) + '전화 걸기</a>'
          : '<button class="btn ghost small" style="width:100%;justify-content:center" disabled>'
            + I.phone(16) + '전화번호 확인 중</button>')
      + '</div>').join("");

    return topbar("재활용센터") + '<main class="screen">'
      + '<div style="display:grid;gap:5px"><span class="eyebrow">' + esc(state.region.sigungu)
      +   ' · ' + esc(CAT_NAME[item.cat]) + ' 매입</span>'
      +   '<p class="lede">가져가면 상태에 따라 값을 쳐주는 곳입니다. 방문 전에 전화로 품목을 먼저 확인하세요.</p></div>'
      + (n ? '<div class="notice sample">' + I.info(15) + '<span><strong>' + esc(n.name) + '</strong> — '
             + esc(n.desc) + ' <a href="' + esc(n.link) + '" target="_blank" rel="noopener">'
             + esc(n.linkLabel) + '</a></span></div>' : "")
      + '<div class="list">' + (cards || '<p class="empty">이 지역에 등록된 재활용센터가 아직 없습니다.<br>담당자가 수집 중입니다.</p>') + '</div>'
      + '</main>' + tabs("home");
  };

  /* 8 · 나눔 목록 */
  screens.shareList = function () {
    let list = S.posts();
    if (state.filter !== "all") list = list.filter(p => {
      const it = L.findItem(p.itemId);
      return it && it.cat === state.filter;
    });
    return '<header class="topbar"><h1>우리 동네 나눔</h1>'
      + '<span style="font-size:12px;color:var(--ink-3);display:flex;align-items:center;gap:3px">'
      + I.pin(14) + esc(state.region.sigungu) + '</span></header>'
      + '<main class="screen">'
      + '<div class="chips">'
      +   '<button class="chip" data-act="filter" data-filter="all" aria-pressed="' + (state.filter === "all") + '">전체</button>'
      +   (window.BIUM_CATEGORIES || []).map(c => '<button class="chip" data-act="filter" data-filter="' + c.id
          + '" aria-pressed="' + (state.filter === c.id) + '">' + esc(c.name) + '</button>').join("")
      + '</div>'
      + '<div class="list">' + (list.length ? list.map(postCard).join("")
          : '<p class="empty">아직 올라온 나눔이 없습니다.</p>') + '</div>'
      + '</main>' + tabs("share");
  };

  const STATUS = { open: ["나눔중", "var(--pine)", "var(--pine-wash)"],
                   held: ["예약됨", "var(--share)", "var(--share-wash)"],
                   done: ["나눔 완료", "var(--ink-3)", "var(--surface-2)"] };

  function postCard(p) {
    const s = STATUS[p.status] || STATUS.open;
    return '<div class="card"><span class="thumb">'
      + (p.photo ? '<img src="' + p.photo + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9px">'
                 : I.box(24)) + '</span>'
      + '<span class="body"><h4>' + esc(p.title) + '</h4><p>' + esc(p.desc) + '</p>'
      + '<span class="meta"><span>' + esc(p.dong || "") + '</span><span>·</span><span>' + ago(p.at) + '</span>'
      + '<span class="badge" style="margin-left:auto;background:' + s[2] + ';color:' + s[1] + '">' + s[0] + '</span>'
      + '</span></span></div>';
  }

  /* 9 · 내 기록 */
  screens.me = function () {
    const recs = S.records();
    const mine = S.posts().filter(p => !p.seed);
    const pr = state.profile || {};
    return '<header class="topbar"><h1>내 기록</h1></header><main class="screen">'
      + '<div class="card" style="align-items:center;padding:14px">'
      +   '<span class="thumb" style="border-radius:50%;background:var(--pine-wash);color:var(--pine)">'
      +   I.user(24) + '</span>'
      +   '<span class="body"><h4>' + esc(pr.nickname || "게스트") + '</h4>'
      +   '<p>' + esc(pr.sido || "") + ' ' + esc(pr.sigungu || "") + (pr.addr ? " · " + esc(pr.addr) : "") + '</p></span>'
      +   '<button class="btn ghost small" data-act="logout">로그아웃</button>'
      + '</div>'
      + '<div style="display:grid;gap:9px"><h3 class="sub">배출 신청</h3>'
      + (recs.length ? '<div class="list">' + recs.map(r =>
          '<div class="card"><span class="thumb mono" style="font-size:11px;flex-direction:column">'
          + esc(r.no.split("-")[1]) + '</span><span class="body"><h4>' + esc(r.itemName) + ' · ' + esc(r.spec) + '</h4>'
          + '<p>' + esc(r.date) + ' 배출 · ' + won(r.fee) + '</p>'
          + '<span class="meta"><span>배출번호 ' + esc(r.no) + '</span></span></span></div>').join("") + '</div>'
        : '<p class="empty">아직 신청한 배출이 없습니다.</p>') + '</div>'
      + '<div class="divider"></div>'
      + '<div style="display:grid;gap:9px"><h3 class="sub">내가 올린 나눔</h3>'
      + (mine.length ? '<div class="list">' + mine.map(postCard).join("") + '</div>'
        : '<p class="empty">아직 올린 나눔이 없습니다.</p>') + '</div>'
      + '<div class="notice"><span>' + I.info(15) + '</span><span><strong>데이터 저장 안내</strong><br>주소·나눔글·배출 기록은 현재 이 기기의 브라우저에 저장됩니다. 기기를 바꾸거나 브라우저 데이터를 지우면 복원되지 않습니다.</span></div>'
      + '</main>' + tabs("me");
  };

  /* ── 바텀시트: 지역 선택 ──────────────────────────────── */
  function sheetHTML() {
    if (state.sheet !== "region") return "";
    const rs = L.regions();
    return '<div class="sheet-backdrop" data-act="close-sheet"><div class="sheet" role="dialog" aria-label="지역 선택">'
      + '<h3 class="sub">지역을 고르세요</h3>'
      + '<p class="lede" style="font-size:12.5px">수수료 데이터가 있는 지역만 보입니다.</p>'
      + '<div class="list">' + rs.map(r =>
          '<button class="card" data-act="set-region" data-sido="' + esc(r.sido) + '" data-sigungu="' + esc(r.sigungu) + '">'
          + '<span class="body"><h4>' + esc(r.sido) + ' ' + esc(r.sigungu) + '</h4>'
          + '<p>' + esc(r.org || "") + '</p></span></button>').join("") + '</div>'
      + '<button class="btn ghost" data-act="close-sheet">닫기</button></div></div>';
  }

  /* ── 렌더 & 이동 ──────────────────────────────────────── */
  function render() {
    app.innerHTML = (screens[state.screen] || screens.home)() + sheetHTML();
    app.scrollTop = 0;
  }

  function go(name, opts) {
    opts = opts || {};
    if (!opts.replace) state.stack.push(state.screen);
    state.screen = name;
    render();
  }

  function back() {
    state.screen = state.stack.pop() || "home";
    render();
  }

  async function api(path, options) {
    const res = await fetch(API_BASE + path, Object.assign({ headers: { "Content-Type": "application/json" } }, options || {}));
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.detail || body.error || "서버 요청에 실패했습니다. (" + res.status + ")");
    return body;
  }

  async function passwordAuth() {
    const username = (document.getElementById("auth-username") || {}).value || "";
    const password = (document.getElementById("auth-password") || {}).value || "";
    if (username.trim().length < 4 || password.length < 4) {
      state.authError = "아이디와 비밀번호는 각각 4자 이상 입력해주세요."; render(); return;
    }
    state.authBusy = true; state.authError = ""; render();
    try {
      if (state.authMode === "signup") {
        await api("/auth/signup", { method: "POST", body: JSON.stringify({ username: username.trim(), password: password }) });
      }
      const tokenResult = await api("/auth/login", { method: "POST", body: JSON.stringify({ username: username.trim(), password: password }) });
      const me = await api("/auth/me", { headers: { "Authorization": "Bearer " + tokenResult.access_token } });
      const old = S.auth();
      if (!old || String(old.id) !== String(me.id)) S.clearProfile();
      S.setToken(tokenResult.access_token);
      S.login("password", { id: String(me.id), username: me.username, nickname: me.username });
      state.draftProfile.nickname = me.username;
      state.introPage = 0;
      routeAfterAuth();
    } catch (err) {
      state.authBusy = false;
      state.authError = err.message || "로그인에 실패했습니다.";
      state.screen = "login"; render();
    }
  }

  function startKakaoLogin() {
    const key = kakaoConfig.javascriptKey;
    const redirectUri = kakaoConfig.redirectUri || window.location.origin + window.location.pathname;
    if (!key) {
      state.authError = "카카오 JavaScript 키가 아직 설정되지 않았습니다. config.js에 키와 Redirect URI를 입력해주세요.";
      render(); return;
    }
    if (!window.Kakao) {
      state.authError = "카카오 로그인 모듈을 불러오지 못했습니다. 인터넷 연결을 확인해주세요.";
      render(); return;
    }
    if (!window.Kakao.isInitialized()) window.Kakao.init(key);
    window.Kakao.Auth.authorize({ redirectUri: redirectUri });
  }

  async function finishKakaoLogin(code) {
    const endpoint = kakaoConfig.authEndpoint;
    const redirectUri = kakaoConfig.redirectUri || window.location.origin + window.location.pathname;
    if (!endpoint) {
      state.authError = "카카오 인증 코드는 받았지만, 토큰을 교환할 서버 주소가 설정되지 않았습니다.";
      state.screen = "login"; history.replaceState({}, "", window.location.pathname); render(); return;
    }
    try {
      const res = await fetch(endpoint, { method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code, redirectUri: redirectUri }) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || result.detail || "로그인 서버 응답 오류 (" + res.status + ")");
      const user = result.user || result;
      if (!user.id) throw new Error("로그인 서버가 사용자 정보를 반환하지 않았습니다.");
      S.login("카카오", { id: String(user.id), nickname: user.nickname || user.properties && user.properties.nickname || "" });
      if (!S.profile() && user.nickname) state.draftProfile.nickname = user.nickname;
      history.replaceState({}, "", window.location.pathname);
      routeAfterAuth();
    } catch (err) {
      state.authError = err.message || "카카오 로그인에 실패했습니다.";
      state.screen = "login"; history.replaceState({}, "", window.location.pathname); render();
    }
  }

  function routeAfterAuth() {
    state.profile = S.profile();
    if (state.profile) {
      state.region = { sido: state.profile.sido, sigungu: state.profile.sigungu };
      state.screen = "home";
    } else {
      state.region = S.region();
      state.screen = S.hasSeenIntro() ? "address" : "intro";
    }
    render();
  }

  function regionFromAddress(address) {
    const matches = L.regions().filter(r => address.includes(r.sigungu));
    if (!matches.length) return null;
    return matches.find(r => address.includes(r.sido)) || (matches.length === 1 ? matches[0] : null);
  }

  function saveHomeAddress() {
    const field = document.getElementById("home-address");
    const address = field && field.value.trim();
    if (!address) {
      state.addressError = "집 주소를 입력해주세요."; render(); return;
    }
    const region = regionFromAddress(address);
    if (!region) {
      state.addressError = "입력한 주소의 수수료 데이터는 아직 준비 중이에요. 지원 지역을 확인한 뒤 다시 시도해주세요.";
      render(); return;
    }
    state.draftProfile.addr = address;
    state.draftProfile.sido = region.sido;
    state.draftProfile.sigungu = region.sigungu;
    state.addressError = "";
    state.screen = "onboarding";
    render();
  }

  /* ── 이벤트 처리 — 모든 버튼이 여기로 들어온다 ────────── */
  app.addEventListener("click", function (e) {
    const el = e.target.closest("[data-act]");
    if (!el || el.tagName === "INPUT") return;
    const act = el.dataset.act;
    const d = state.draft;

    switch (act) {
      case "back":   back(); break;
      case "go":     go(el.dataset.to); break;

      case "login":
        if (el.dataset.provider === "카카오") startKakaoLogin();
        else { S.login(el.dataset.provider); state.introPage = 0; routeAfterAuth(); }
        break;
      case "password-auth": passwordAuth(); break;
      case "auth-toggle":
        state.authMode = state.authMode === "login" ? "signup" : "login";
        state.authError = ""; render(); break;
      case "intro-next":
        if ((state.introPage || 0) === 0) { state.introPage = 1; render(); }
        else { S.setSeenIntro(); state.screen = "address"; render(); }
        break;
      case "save-address": saveHomeAddress(); break;

      case "ob-region":
        state.draftProfile.sido = el.dataset.sido;
        state.draftProfile.sigungu = el.dataset.sigungu;
        render(); break;
      case "ob-submit": submitOnboarding(); break;
      case "logout":
        if (!confirm("로그아웃할까요? 이 기기에 저장된 닉네임이 지워집니다.")) return;
        S.logout();
        state.profile = null; state.draftProfile = {}; state.stack = [];
        state.screen = "login"; render(); break;
      case "tab":
        state.stack = [];
        state.screen = { home: "home", share: "shareList", me: "me" }[el.dataset.tab];
        render(); break;

      case "sheet":       state.sheet = el.dataset.sheet; render(); break;
      case "close-sheet": if (e.target === el) { state.sheet = null; render(); } break;
      case "set-region":
        state.region = { sido: el.dataset.sido, sigungu: el.dataset.sigungu };
        S.setRegion(state.region); state.sheet = null; render(); break;

      case "cat":  state.cat = el.dataset.cat; render(); break;
      case "pick-item":
        d.itemId = el.dataset.item;
        d.spec = L.findItem(d.itemId).specs[0];
        state.q = "";
        if (state.screen !== "pick") go("pick", { replace: true }); else render();
        break;
      case "spec": d.spec = el.dataset.spec; render(); break;
      case "to-result": go("result"); break;

      case "retake":     d.photo = null; d.ai = null; state.aiError = ""; render(); break;
      case "confirm-ai":
        d.itemId = d.ai.itemId;
        d.spec = d.ai.spec || L.findItem(d.ai.itemId).specs[0];
        go("result"); break;

      case "go-share":   go("shareForm"); break;
      case "go-centers": go("centers"); break;
      case "go-dispose": submitDispose(); break;
      case "cond":       d.cond = el.dataset.cond; render(); break;
      case "submit-share": submitShare(); break;
      case "filter":     state.filter = el.dataset.filter; render(); break;
    }
  });

  /* 검색창 입력 */
  app.addEventListener("input", function (e) {
    if (e.target.dataset.act === "ob-addr") { state.draftProfile.addr = e.target.value; return; }
    if (e.target.dataset.act === "ob-name" || e.target.dataset.act === "search") {
      const key = e.target.dataset.act;
      if (key === "ob-name") state.draftProfile.nickname = e.target.value;
      else state.q = e.target.value.trim();
      const pos = e.target.selectionStart;
      render();
      const next = app.querySelector('[data-act="' + key + '"]');
      if (next) { next.focus(); next.setSelectionRange(pos, pos); }
    }
  });

  /* 사진 선택 → 축소 → AI 인식 */
  app.addEventListener("change", async function (e) {
    if (e.target.dataset.act !== "photo") return;
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const shrunk = await window.BiumAI.downscale(file);
      state.draft.photo = shrunk.dataUrl;
      state.draft.ai = null;
      state.aiError = "";
      state.aiBusy = true;
      render();

      const result = await window.BiumAI.recognize(shrunk.blob);
      state.draft.ai = result;
      if (!result) state.aiError = "이 환경에서는 사진 인식을 쓸 수 없습니다. 품목을 직접 골라주세요.";
    } catch (err) {
      state.draft.ai = null;
      state.aiError = err.message || "인식에 실패했습니다.";
    } finally {
      state.aiBusy = false;
      render();
    }
  });

  /* ── 동작 ─────────────────────────────────────────────── */
  function submitOnboarding() {
    const d = state.draftProfile;
    if (!d.nickname || !d.nickname.trim() || !d.sigungu) return;

    const profile = S.saveProfile({
      nickname: d.nickname.trim(), sido: d.sido, sigungu: d.sigungu,
      addr: (d.addr || "").trim(), at: Date.now()
    });
    S.setRegion({ sido: d.sido, sigungu: d.sigungu });

    state.profile = profile;
    state.region = { sido: d.sido, sigungu: d.sigungu };
    state.draftProfile = {};
    state.stack = [];
    state.screen = "home";
    render();
  }

  function submitShare() {
    const d = state.draft;
    const title = (document.getElementById("f-title") || {}).value || "";
    const desc = (document.getElementById("f-desc") || {}).value || "";
    const dong = (document.getElementById("f-dong") || {}).value || "";
    if (!title.trim()) { alert("제목을 적어주세요."); return; }

    const item = L.findItem(d.itemId);
    S.addPost({ itemId: d.itemId, itemName: item.name, spec: d.spec,
      title: title.trim(), desc: desc.trim(), cond: d.cond || "사용감 적음",
      dong: dong.trim() || state.region.sigungu, photo: d.photo || null });

    state.draft = {};
    state.stack = [];
    state.screen = "shareList";
    render();
  }

  function submitDispose() {
    const d = state.draft;
    const item = L.findItem(d.itemId);
    const p = L.paths(state.region, item, d.spec);
    if (p.dispose.unknown) { alert("이 지역 수수료 데이터에 이 품목이 없습니다. 구청에 직접 확인해 주세요."); return; }

    // TODO(팀원 누구든): 지금은 이틀 뒤로 고정. 구청별 수거 요일을 반영하면 더 정확해진다.
    const dt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2);
    const date = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-"
      + String(dt.getDate()).padStart(2, "0") + " (" + "일월화수목금토"[dt.getDay()] + ")";

    state.record = S.addRecord({ itemId: d.itemId, itemName: item.name, spec: p.dispose.spec,
      fee: p.dispose.fee, org: p.dispose.org, date: date, no: S.issueNumber(),
      sido: state.region.sido, sigungu: state.region.sigungu });

    go("sticker");
  }

  /* ── 시작 ─────────────────────────────────────────────── */
  const authCode = new URLSearchParams(window.location.search).get("code");
  const authFailure = new URLSearchParams(window.location.search).get("error");
  if (authCode) {
    state.screen = "authLoading"; render(); finishKakaoLogin(authCode);
  } else if (authFailure) {
    state.authError = "카카오 로그인이 취소되었거나 권한 동의에 실패했습니다.";
    history.replaceState({}, "", window.location.pathname); state.screen = "login"; render();
  } else if (!S.auth()) {
    state.screen = "login"; render();
  } else {
    routeAfterAuth();
  }
})();

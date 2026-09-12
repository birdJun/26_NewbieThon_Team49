/* 수수료 조회 + 세 가지 선택지 계산 — 이 앱의 핵심 로직
   data/fees.js (담당 A) 와 data/items.js (담당 C) 를 읽어서 판단한다. */
window.BiumLookup = (function () {

  const norm = s => String(s || "").replace(/\s|·|\(|\)/g, "").toLowerCase();

  /** 수수료 데이터에 실제로 존재하는 지역 목록 */
  function regions() {
    const seen = new Map();
    (window.BIUM_FEES || []).forEach(function (r) {
      const key = r.sido + "|" + r.sigungu;
      if (!seen.has(key)) seen.set(key, { sido: r.sido, sigungu: r.sigungu, org: r.org || "" });
    });
    return Array.from(seen.values())
      .sort((a, b) => (a.sido + a.sigungu).localeCompare(b.sido + b.sigungu, "ko"));
  }

  function findItem(id) {
    return (window.BIUM_ITEMS || []).find(i => i.id === id) || null;
  }

  function itemsOf(catId) {
    return (window.BIUM_ITEMS || []).filter(i => i.cat === catId);
  }

  function search(q) {
    const n = norm(q);
    if (!n) return [];
    return (window.BIUM_ITEMS || []).filter(function (i) {
      return norm(i.name).includes(n) || i.match.some(m => norm(m).includes(n));
    });
  }

  /** 지역 + 품목 + 규격 → 수수료 한 건
   *  @returns {{fee:number, spec:string, source:object, exact:boolean}|null} */
  function fee(region, item, spec) {
    if (!region || !item) return null;
    const rows = (window.BIUM_FEES || []).filter(function (r) {
      return r.sido === region.sido && r.sigungu === region.sigungu;
    });
    if (!rows.length) return null;

    // 1) 품목 매칭: 카탈로그의 match 키워드가 공공데이터 품목명에 들어있는지
    const hits = rows.filter(function (r) {
      const n = norm(r.item);
      return item.match.some(k => n.includes(norm(k)));
    });
    if (!hits.length) return null;

    // 2) 규격 매칭: 완전일치 → 부분일치 → 가장 싼 것
    let best = spec && hits.find(r => norm(r.spec) === norm(spec));
    let exact = !!best;
    if (!best && spec) best = hits.find(r => norm(r.spec).includes(norm(spec)) || norm(spec).includes(norm(r.spec)));
    if (!best) best = hits.slice().sort((a, b) => a.fee - b.fee)[0];

    return { fee: best.fee, spec: best.spec, source: best, exact: exact };
  }

  /** 그 지역에서 이 품목을 매입할 만한 재활용센터 */
  function centers(region, item) {
    const catName = { furniture: "가구", appliance: "가전", living: "생활용품", etc: "기타" }[item ? item.cat : ""];
    return (window.BIUM_CENTERS || []).filter(function (c) {
      if (c.sido !== region.sido || c.sigungu !== region.sigungu) return false;
      return !catName || !c.buys || c.buys.includes(catName);
    });
  }

  /** 전국 공통 제도(폐가전 무상수거 등) 중 이 품목에 해당하는 것 */
  function national(item) {
    if (!item) return [];
    return (window.BIUM_NATIONAL || []).filter(n => !n.appliesTo || n.appliesTo.includes(item.cat));
  }

  /** 세 가지 선택지를 계산한다. 화면은 이 결과만 그리면 된다. */
  function paths(region, item, spec) {
    const f = fee(region, item, spec);
    const free = national(item);
    const ctrs = centers(region, item);

    return {
      fee: f,
      share: {
        available: item.reuse > 0,
        recommended: item.reuse >= 2,
        saves: f ? f.fee : 0,
        reason: item.reuse === 0 ? "위생·안전 문제로 나눔에 적합하지 않은 품목입니다."
              : item.reuse >= 3 ? "중고로 잘 나가는 품목입니다. 가져갈 이웃이 있을 가능성이 높습니다."
              : "상태가 괜찮다면 가져갈 이웃이 있을 수 있습니다."
      },
      dispose: {
        fee: f ? f.fee : null,
        spec: f ? f.spec : spec,
        exact: f ? f.exact : false,
        org: f && f.source.org ? f.source.org : (region.org || ""),
        unknown: !f
      },
      recycle: {
        centers: ctrs,
        national: free,
        freePickup: free.length > 0
      }
    };
  }

  return { regions, findItem, itemsOf, search, fee, centers, national, paths };
})();

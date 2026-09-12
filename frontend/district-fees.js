/* 생활 정보 화면 전용: 같은 자료 버전의 전체 페이지를 읽어 요약한다. */
window.BiumDistrictFees = (function () {
  async function load(request, district) {
    const rows = [];
    let dataset = null;
    let total = null;
    const seen = new Set();
    do {
      const params = new URLSearchParams({ province: '서울특별시', district, limit: '100', offset: String(rows.length) });
      if (dataset) params.set('import_id', dataset.id);
      const page = await request('/waste-fees?' + params);
      if (!page.dataset || !Number.isInteger(page.total) || page.total < 0 || !Array.isArray(page.items)) throw new Error('수수료 응답 형식을 확인할 수 없습니다.');
      if (dataset && (page.dataset.id !== dataset.id || page.total !== total)) throw new Error('조회 중 자료가 변경되었습니다. 다시 조회해주세요.');
      dataset = page.dataset;
      total = page.total;
      if (page.items.length === 0 && rows.length < total) throw new Error('일부 수수료 자료를 불러오지 못했습니다.');
      for (const row of page.items) {
        if (row.province !== '서울특별시' || row.district !== district || seen.has(row.id)) throw new Error('지역 또는 페이지 정보가 일치하지 않습니다.');
        seen.add(row.id);
        rows.push(row);
      }
      if (rows.length > total) throw new Error('수수료 건수가 일치하지 않습니다.');
    } while (rows.length < total);
    const prices = rows.map(r => r.amount_krw).filter(n => Number.isInteger(n) && n >= 0);
    return {
      dataset, total, rows,
      itemCount: new Set(rows.map(r => r.item_name)).size,
      specCount: rows.filter(r => String(r.size_label || '').trim()).length,
      lowest: prices.length ? Math.min(...prices) : null,
      dates: [...new Set(rows.map(r => r.reference_date).filter(Boolean))].sort()
    };
  }
  return { load };
})();

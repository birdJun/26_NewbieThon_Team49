/* 사진으로 대형폐기물 품목을 인식한다.
   Claude 런타임(sample)이 있으면 실제 인식, 없으면 null 을 돌려주고
   앱은 '직접 고르기'로 자연스럽게 넘어간다. */
window.BiumAI = (function () {
  let sample = null;
  let ready = false;
  let canImages = false;

  const init = (async function () {
    try {
      if (!window.claude || typeof window.claude.use !== "function") return;
      sample = await window.claude.use("sample");
      if (!sample) return;
      const limits = await sample.limits().catch(() => null);
      canImages = !!(limits && limits.images);
      ready = canImages;
    } catch (e) {
      console.warn("[Bium] AI 준비 실패:", e);
    }
  })();

  /** 사진 파일을 긴 변 1024px 이하 JPEG 로 줄인다 (전송량·저장량 절약) */
  function downscale(file, max) {
    max = max || 1024;
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob(function (blob) {
          resolve({ blob: blob, dataUrl: c.toDataURL("image/jpeg", 0.7) });
        }, "image/jpeg", 0.8);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("이미지를 읽을 수 없습니다")); };
      img.src = url;
    });
  }

  async function isAvailable() { await init; return ready; }

  /** @returns {Promise<{itemId,spec,confidence,note,alts:string[]}|null>} */
  async function recognize(blob) {
    await init;
    if (!ready) return null;

    const catalog = window.BIUM_ITEMS.map(function (i) {
      return i.id + " = " + i.name + " [규격: " + i.specs.join(" / ") + "]";
    }).join("\n");

    const prompt =
      "너는 한국 대형폐기물 배출 도우미다. 첨부한 사진에 찍힌 물건이 아래 품목 목록 중 무엇인지 판단해라.\n\n" +
      "[품목 목록]\n" + catalog + "\n\n" +
      "규칙:\n" +
      "- itemId 는 반드시 위 목록의 id 중 하나여야 한다.\n" +
      "- spec 은 그 품목의 규격 목록 중 하나를 사진에서 보이는 크기·형태로 추정해서 고른다.\n" +
      "- confidence 는 0~1 사이 숫자.\n" +
      "- alts 에는 헷갈릴 만한 다른 후보 itemId 를 최대 2개 넣는다.\n" +
      "- note 는 무엇을 보고 판단했는지 한국어 한 문장(40자 이내).\n" +
      "- 목록에 없는 물건이거나 대형폐기물이 아니면 itemId 를 null 로 한다.\n\n" +
      '{"itemId": string|null, "spec": string|null, "confidence": number, "alts": string[], "note": string} 형식의 JSON 만 출력해라.';

    try {
      const res = await sample.json(prompt, { images: blob, modelTier: "default" });
      if (!res || !res.itemId) return { itemId: null, note: (res && res.note) || "" , alts: [], confidence: 0, spec: null };
      const known = window.BIUM_ITEMS.some(function (i) { return i.id === res.itemId; });
      if (!known) return { itemId: null, note: res.note || "", alts: [], confidence: 0, spec: null };
      return {
        itemId: res.itemId,
        spec: res.spec || null,
        confidence: typeof res.confidence === "number" ? res.confidence : 0.5,
        alts: Array.isArray(res.alts) ? res.alts.filter(function (a) {
          return window.BIUM_ITEMS.some(function (i) { return i.id === a; });
        }).slice(0, 2) : [],
        note: res.note || ""
      };
    } catch (err) {
      console.warn("[Bium] 인식 실패:", err);
      const e = new Error(errorMessage(err && err.code));
      e.code = err && err.code;
      throw e;
    }
  }

  function errorMessage(code) {
    switch (code) {
      case "not_granted":        return "AI 사진 인식 권한이 없습니다. 품목을 직접 골라주세요.";
      case "rate_limited":       return "요청이 많습니다. 잠시 후 다시 시도하거나 직접 골라주세요.";
      case "images_unavailable": return "이 환경에서는 사진 인식을 쓸 수 없습니다. 직접 골라주세요.";
      case "image_rejected":     return "사진을 읽지 못했습니다. 다른 사진으로 다시 시도해주세요.";
      default:                   return "인식에 실패했습니다. 품목을 직접 골라주세요.";
    }
  }

  return { isAvailable: isAvailable, recognize: recognize, downscale: downscale };
})();

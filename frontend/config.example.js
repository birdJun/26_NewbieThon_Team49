/*
  이 파일을 config.js 로 복사한 뒤 카카오 개발자 콘솔 값으로 채우세요.
  config.js 는 .gitignore 에 포함되어 있어 키를 저장소에 올리지 않습니다.

  authEndpoint 는 인증 코드를 토큰으로 교환하고 앱 세션을 만드는 서버 주소입니다.
  정적 HTML만으로는 REST API 키를 안전하게 보관할 수 없으므로 반드시 서버에서 처리해야 합니다.
*/
window.BIUM_KAKAO = {
  javascriptKey: "",
  redirectUri: "",
  authEndpoint: "/api/auth/kakao"
};

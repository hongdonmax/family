/* =========================================================
   Firebase 설정 파일
   ---------------------------------------------------------
   여기 값을 "본인 Firebase 프로젝트" 값으로 바꾸면
   세린·다윤 패드와 부모님 폰이 실시간으로 같이 공유돼요.

   값을 바꾸기 전까지는 "이 기기에만 저장"되는 모드로 동작합니다.
   설정 방법은 README.md 의 "실시간 공유 설정하기"를 보세요.
   ========================================================= */

window.FIREBASE_CONFIG = {
  apiKey:        "PASTE_API_KEY",
  authDomain:    "PASTE_PROJECT_ID.firebaseapp.com",
  projectId:     "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId:         "PASTE_APP_ID",
};

/* 가족이 함께 보는 한 개의 데이터 칸 이름.
   여러 가족이 같은 코드를 써도 이 이름이 다르면 서로 안 섞여요. */
window.FAMILY_ID = "choi-family";

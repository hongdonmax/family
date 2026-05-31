/* =========================================================
   Firebase 설정 파일
   ---------------------------------------------------------
   여기 값을 "본인 Firebase 프로젝트" 값으로 바꾸면
   세린·다윤 패드와 부모님 폰이 실시간으로 같이 공유돼요.

   값을 바꾸기 전까지는 "이 기기에만 저장"되는 모드로 동작합니다.
   설정 방법은 README.md 의 "실시간 공유 설정하기"를 보세요.
   ========================================================= */

window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBotdOXWDvumwOOsUzBK_0ZP1LcRh7UNVY",
  authDomain:        "family-a0a1c.firebaseapp.com",
  projectId:         "family-a0a1c",
  storageBucket:     "family-a0a1c.firebasestorage.app",
  messagingSenderId: "3935252600",
  appId:             "1:3935252600:web:c18eb4620cadd61bfbbd8d",
};

/* 가족이 함께 보는 한 개의 데이터 칸 이름.
   여러 가족이 같은 코드를 써도 이 이름이 다르면 서로 안 섞여요. */
window.FAMILY_ID = "choi-family";

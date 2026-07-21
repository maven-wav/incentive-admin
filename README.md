# 테이블오더 시책 어드민 (Table Order Incentive Admin)

카카오페이 테이블오더 설치 **시책(보상금) 증빙·지급 관리** 어드민 — 프로토타입.

VAN 대리점(외부)이 가맹 연결·홍보물 부착 증빙을 등록하면, 카카오페이 담당자(내부)가
검수·승인하고, 승인된 건을 월 1회 대리점 계좌로 정산 지급하는 흐름을 다룹니다.

## 스택
- Next.js 14 (App Router) + Tailwind CSS · JavaScript
- 상태: 프로토타입은 in-memory 목데이터. 실개발 시 Supabase(Auth·Postgres·Storage)로 교체.
- 콰트로 결제검수는 `lib/quatro.js` 어댑터로 추상화 (Mock ↔ 실연동 스위치).
- 배포: Vercel (git push 자동 배포)

## 로컬 실행
```bash
npm install
npm run dev   # http://localhost:3000
```

## 3계층 권한 (데모: 우측 상단에서 역할 전환)
- 내부 담당자(카카오페이): 승인·검수·정산 확정
- 얼라이언스사(오케이포스/KICC 등): 소속 대리점 데이터
- VAN대리점(승리정보통신 등): 자기 데이터만

## 화면
- 대시보드 / 가맹점 등록 · 등록내역 / 시책 접수(증빙) · 시책 검수 / 지급·정산

## 실개발 TODO (다음 단계)
- [ ] Supabase 스키마·Auth·Storage·RLS
- [ ] 콰트로 API 실연동 (Mock → Real, QUATRO_SOURCE 스위치)
- [ ] 대량등록 서식(CSV/XLSX) 업로드
- [ ] 홍보물 부착 사진 실제 업로드
- [ ] 내부 데이터 외부 제공 보안 검토

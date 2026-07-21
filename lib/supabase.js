import { createClient } from "@supabase/supabase-js";

// 목업용 백엔드 (dalmuti 프로젝트에 스키마 분리).
// public이 아닌 incentive_admin 스키마를 쓰므로 db.schema 지정이 필수.
// ⚠️ Supabase 대시보드 → Settings → API → Exposed schemas 에 incentive_admin이
//    들어있어야 함. 없으면 모든 요청이 406(PGRST106)으로 실패.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { db: { schema: "incentive_admin" } }
);

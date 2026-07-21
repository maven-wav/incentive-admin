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

// ── 홍보물 부착 사진 (Storage) ──────────────────────────────────
// 버킷 'proofs'는 public + anon read/insert 정책. 데모라 인증 없이 올린다.
const PROOF_BUCKET = "proofs";

// 업로드 후 저장 경로를 반환한다 → incentive_claims.proof_photo 에 그대로 들어감.
export async function uploadProof(file) {
  // 키에 공백·특수문자가 섞이면 URL에서 말썽이라 파일명만 정리한다.
  const safeName = file.name.normalize("NFC").replace(/[^\w.\-]/g, "_");
  const path = `${Date.now()}_${safeName}`;
  const { error } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });
  if (error) throw error;
  return path;
}

// 저장 경로 → 공개 URL.
// ⚠️ 초기 시드의 proof_photo는 실제 파일이 없는 파일명 문자열('부착사진_○○.jpg')이라
//    여기서 만든 URL이 404가 난다. 표시하는 쪽에서 onError로 대체 처리할 것.
export function proofPublicUrl(path) {
  if (!path) return null;
  return supabase.storage.from(PROOF_BUCKET).getPublicUrl(path).data.publicUrl;
}

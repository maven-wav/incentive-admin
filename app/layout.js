import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Shell from "@/components/Shell";

export const metadata = {
  title: "테이블오더 시책 어드민",
  description: "카카오페이 테이블오더 설치 시책 관리 어드민 (프로토타입)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}

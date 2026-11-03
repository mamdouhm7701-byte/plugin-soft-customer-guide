import Link from 'next/link';
import { Header, Footer, Empty } from '@/components/guide/common';
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container not-found">
        <Empty
          title="الشرح أو الدليل غير متاح"
          text="الرابط ممكن يكون قديم، أو تم إيقاف نشر المحتوى مؤقتًا. تقدر ترجع للدليل وتبحث عن سؤالك."
        >
          <Link href="/" className="button primary">
            الرجوع لدليل العميل
          </Link>
        </Empty>
      </main>
      <Footer />
    </>
  );
}

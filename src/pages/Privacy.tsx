import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { seoDefaults } from "@/config/seoPages";
import { LINE_OA_URL } from "@/config/line";
import { SITE_URL } from "@/config/site";

const UPDATED = "2026 年 9 月 20 日";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="mb-3 text-xl font-semibold tracking-tight">{title}</h2>
    <div className="space-y-3 text-sm font-light leading-relaxed text-muted-foreground">{children}</div>
  </section>
);

const Privacy = () => (
  <div className="min-h-screen flex flex-col overflow-x-hidden">
    <Seo title={seoDefaults("/privacy").title} description={seoDefaults("/privacy").description} path="/privacy">
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "首頁", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "隱私權政策", item: `${SITE_URL}/privacy` },
          ],
        })}
      </script>
    </Seo>
    <Navigation variant="dark" />
    <main className="flex-1 pt-36 lg:pt-44 pb-24">
      <div className="container mx-auto max-w-3xl px-6 lg:px-12">
        <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Privacy Policy</p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight lg:text-4xl">隱私權政策</h1>
        <p className="mb-12 text-sm font-light text-muted-foreground">最後更新：{UPDATED}</p>

        <Section title="一、適用範圍">
          <p>
            本政策說明「診斷室驗屋」（以下稱「我們」）在本網站（{SITE_URL}）如何蒐集、使用與保護您提供的個人資料。使用本網站或送出預約，即表示您已閱讀並了解本政策。
          </p>
        </Section>

        <Section title="二、我們蒐集哪些資料">
          <p>
            <strong className="font-medium text-foreground">預約驗屋或加入團報時，由您填寫：</strong>
            姓名、聯絡電話、Email、建案名稱與所在區域、樓層戶號、房屋類型與坪數、希望的檢測日期與時段，以及您在備註中主動提供的內容。
          </p>
          <p>
            <strong className="font-medium text-foreground">提出新建案團報時：</strong>
            建案名稱、建案區域，以及您的姓名與聯絡電話。
          </p>
          <p>
            <strong className="font-medium text-foreground">綁定 LINE 好友時（選用）：</strong>
            經您在 LINE 授權後，我們會取得 LINE 使用者識別碼、顯示名稱，以及您授權提供的 Email，用於發送預約通知與優惠券。
          </p>
          <p>
            <strong className="font-medium text-foreground">瀏覽網站時（自動）：</strong>
            我們使用 Google Analytics 統計網站使用情形，會記錄您瀏覽的頁面、來源、裝置與瀏覽器類型、概略地區，並透過 Cookie 或類似技術辨識瀏覽器。這些資料無法直接識別您的身分，也不含您在表單填寫的內容。
          </p>
        </Section>

        <Section title="三、使用目的">
          <ul className="list-disc space-y-1 pl-5">
            <li>確認、安排與聯繫您的驗屋預約及團報，並提供報價與服務。</li>
            <li>透過 LINE 或電話、Email 通知預約狀態與相關事項。</li>
            <li>統計團報戶數並依條件計算優惠。</li>
            <li>了解網站使用情形，改善網站內容與服務。</li>
            <li>防止濫用與惡意灌單，維護網站安全。</li>
          </ul>
        </Section>

        <Section title="四、資料的保存與處理">
          <p>
            您的資料儲存於我們委託的雲端資料庫服務（Supabase）；網站由 Vercel 提供代管；預約通知透過 LINE 傳送；網站統計使用 Google Analytics。這些服務商僅在提供服務的範圍內處理資料。
          </p>
          <p>我們不會出售您的個人資料。除法律要求或為提供您所要求的服務所必需外，不會向第三方揭露。</p>
          <p>
            我們僅在達成上述目的所需期間內保存資料，之後將依法令保存或予以刪除。團報訂單的姓名與電話，會讓管理員在後台看到，用於聯繫，不會顯示給其他報名者。
          </p>
        </Section>

        <Section title="五、Cookie 與網站統計">
          <p>
            Google Analytics 會使用 Cookie 統計造訪。若您不希望被統計，可在瀏覽器設定中封鎖或清除 Cookie，或安裝 Google 提供的
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-1 text-primary underline-offset-4 hover:underline"
            >
              Google Analytics 停用附加元件
            </a>
            ，這不會影響您預約與使用本網站的功能。
          </p>
        </Section>

        <Section title="六、您的權利">
          <p>
            依《個人資料保護法》，您可以就您提供的個人資料，請求查詢或閱覽、製給複製本、補充或更正、停止蒐集、處理或利用，以及刪除。您不提供必要的資料（如姓名與聯絡方式）時，我們可能無法完成預約與聯繫。
          </p>
        </Section>

        <Section title="七、聯絡我們">
          <p>
            如需行使上述權利或對本政策有疑問，請透過
            <a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer" className="mx-1 text-primary underline-offset-4 hover:underline">
              官方 LINE
            </a>
            與我們聯絡，並說明您的姓名與預約時所填的聯絡電話，以便我們核對後處理。
          </p>
        </Section>

        <Section title="八、政策的修改">
          <p>我們可能因服務或法規調整而修改本政策，更新後會公布在本頁並修改「最後更新」日期。</p>
        </Section>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;

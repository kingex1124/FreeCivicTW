# FreeCivicTW · 公民自由課

給沒有公民基礎的讀者：從生活出發，看懂台灣民主、選舉職務與媒體識讀。

以 React 19、Next.js 16 App Router、TypeScript、Tailwind CSS、Zod 與 Lucide 開發。正式輸出為純靜態網站，部署至 GitHub Pages，不需要 Node.js 伺服器。

## 本機開發

建議 Node.js 22 最新 LTS 修補版（至少 22.13）及 npm。

```powershell
npm ci
npm run dev
```

開啟 `http://localhost:3000/`。開發環境預設不啟用 GA。

也可以使用終端顯示的 Network 網址（例如 `http://192.168.1.104:3000/`）。
`next.config.ts` 會從本機網路介面取得實際使用的私有 IPv4，加入 Next.js 的開發來源白名單，
讓區網存取能完成互動程式初始化及熱更新。這項設定不使用萬用來源，也不影響正式靜態網站。
若啟動開發伺服器後才更換網路或取得新的 IP，請重新啟動 `npm run dev`。

要預覽真正的靜態產物：

```powershell
npm run build:preview
npm run preview
```

開啟 `http://localhost:4173/`。`build:preview` 明確使用本機 canonical 網址，並停用分析，產物位於 `out/`。請勿將這份本機網址產物直接發布為正式網站。

## 正式建置與 GitHub Pages

1. 將原始碼放入自己的 GitHub repository。
2. Repository **Settings → Pages → Source** 選擇 **GitHub Actions**。
3. 推送到 `main`／`master`，或手動執行 `Deploy GitHub Pages` 工作流程。
4. 工作流程從官方 Pages Action 取得正式網域與子路徑，執行檢查、建置、瀏覽器驗證，僅發布通過驗證的 `out/` artifact。

設定檔不會替你建立 Git remote；須先連到自己的 repository。執行本機預覽不會觸發正式發布。

手動正式建置時，可從 `.env.example` 建立 `.env.local` 並填入真實資料，或直接設定環境變數：

```powershell
$env:NEXT_PUBLIC_SITE_ORIGIN = 'https://你的帳號.github.io'
$env:NEXT_PUBLIC_BASE_PATH = '/FreeCivicTW'
npm run build
```

`SITE_ORIGIN` 只含協定與主機，不含專案路徑；根網域／自訂網域根目錄的 `BASE_PATH` 為空字串。缺少正式 origin 時，正式建置會失敗，避免發布錯誤 canonical。

可用以下方式測試專案子路徑：

```powershell
$env:NEXT_PUBLIC_BASE_PATH = '/FreeCivicTW'
npm run build:preview
npm run test:e2e
npm run preview
```

預覽網址為 `http://localhost:4173/FreeCivicTW/`。切回根目錄開發前，移除該環境變數並重新建置。`robots.txt` 僅在網域根目錄有效；專案型 Pages 請向 Search Console 提交專案 sitemap，不能依賴子路徑的 robots 檔案控制全網域。

### Google Search Console 驗證

專案根目錄的 `googlec50a17ce59ee8c3c.html` 會在開發及建置前原樣複製到 `public/`，再隨靜態匯出進入 `out/`，不需另加驗證 meta 標籤或修改 `robots.ts`。以目前 GitHub Pages 專案網址為例：

1. 使用「網址前置字元」資源 `https://kingex1124.github.io/FreeCivicTW/`。
2. 部署後確認 `https://kingex1124.github.io/FreeCivicTW/googlec50a17ce59ee8c3c.html` 可直接開啟，再回 Search Console 按「驗證」。實際路徑須與 Google 顯示的驗證網址一致。
3. 提交 sitemap：`https://kingex1124.github.io/FreeCivicTW/sitemap.xml`。

保留原始驗證檔，之後每次部署都會一併輸出。驗證成功不代表保證收錄或排名；也不需要把驗證檔加進 sitemap。檔名及內容須維持 Google 提供的形式，詳見 [Search Console 官方驗證說明](https://support.google.com/webmasters/answer/9008080?hl=zh-Hant)。

## 已實作的內容與功能

- 首頁三條學習入口、四步快速摘要與八篇完整入門文章。
- 可切換中央／地方的政府角色圖、關係篩選、三組程序導覽及三個生活情境。
- 「民間監督」專頁 `/oversight/`：整理全國性與地方性的公民監督、司法／人權、廉政、資訊及環境團體，提供主題／範圍／關鍵字篩選、原生展開說明、公開成果、參與方式與來源。公督盟內容移至此頁；資料維護於 `Data/civil-oversight.json`，各層集中於 `OversightModel`、`OversightRepository`、`OversightService`、`OversightView`。
- 「便民查詢」專頁 `/resources/`：依生活主題搜尋官方工具、22 縣市政府與議會、司法及中央機關入口。提供用途、可查內容、操作步驟、限制、官方依據與核對日期；進階篩選預設展開，支援主題／單位／縣市／工具或機關首頁的交集。資料維護於 `Data/public-resources.json`，中央部會首頁沿用機關總覽資料與原查核日期，採 `PublicResourceModel`／`PublicResourceRepository`／`PublicResourceService`／`PublicResourcesView` 分層。無 JavaScript 時仍能閱讀全部卡片與原生展開說明，支援 SSG、JSON-LD 及 GitHub Pages 子路徑。
- 政府頁中央／地方切換區只切換政府範圍，司法與民間監督由主要導覽進入。中央／地方機關選擇視窗支援輕量彈跳，並遵循裝置減少動態偏好。
- 民間監督包含經民連的國會觀察、政策研究與公開工作報告，並標明其倡議及資料適用範圍。主導覽採圓角分頁列、目前頁面提示與手機文字導覽鍵。
- 全站共用右下角「Top／回到頂端」入口，捲動超過 300px 後顯示，支援鍵盤與原生頁內跳轉；停用 JavaScript 時保留可使用的連結。平滑捲動遵循裝置減少動態偏好。
- 全站字級使用統一的相對單位，正文及輔助文字以 1rem 為基準，標題使用有限的較大級距，並可隨瀏覽器字體設定縮放。
- 右上角月亮／太陽按鈕切換全站深色／淺色模式，偏好透過 Site Model／Service／Repository 保存於瀏覽器。初始主題在首次繪製前套用，切頁與重整保留選擇；深色模式涵蓋圖卡、表單、選取、回饋及對話視窗。網站不提供動畫開關，一般顯示維持動畫；過去的減少動畫儲存值不再使用。
- 根版型以 `data-scroll-behavior="smooth"` 配合 Next.js 切頁捲動管理，讓主選單切頁由頁首開始；指定段落與 Top 仍保留頁內捲動功能。
- 「司法與警檢」專頁：司法獨立、25項機關／角色說明、搜尋分類、法院分流、刑事公訴流程及分支、羈押與交保附帶條件／電子監控／逃亡風險／抗告、報案與按鈴申告、救濟與法律協助。資料集中於 `Data/justice-system.json`，各層集中於 `JusticeModel`、`JusticeRepository`、`JusticeService`、`JusticeView`。
- 官方 22 縣市、368 鄉鎮市區查詢；包含全部六個山地原住民區，並分開呈現中央、地方職務。
- 同名地區確認、台／臺正規化、一般／平地／山地原住民選舉情境切換：中央替換適用立委候選人票，地方議員及代表在展開職務後顯示條件提醒，未查核當屆完整選區時不自行指定票種。完整比較移至「看更多」，選票指南維持查詢用途。
- 「看更多」專頁 `/more/`：以三個可跳轉主題整理原住民中央／地方選舉、政治攻防與憲法法庭。原住民內容沿用選舉規則單一資料來源；其餘維護於 `Data/supplementary-topics.json`，採 `SupplementModel`／`SupplementRepository`／`SupplementService`／`SupplementView` 分層。政治攻防使用中立假設例子；憲法內容區分歷史、條件式風險與仍持續運作程序，依114憲判1及2026裁判查核，不宣稱目前全面停擺。原生收合小節、逐節官方依據、手機大字與深淺色、無JavaScript全文、靜態SEO及sitemap一併支援；政府角色、相關文章及司法機關筆記連回補充頁。
- 原住民地方議員補充涵蓋2026公告22縣市應選名額（不當作現任人數或個人可領票數）、臺北市全市平地／山地各1席、人口與山地鄉名額條件、平地山地共同選區和同縣市跨鄉鎮區範圍的區別。明示2026公告無共同名額，但法律制度仍存在；說明議員監督自己縣市政府、可關注全市政務，跨縣市協調不等於正式質詢權，並與全國原住民立委區分。
- 政治攻防新增十種可分別展開的話術比較：原始背景、可能誤導的呈現、意思落差與核對方法；使用自編假設，不據此判定特定人物意圖或固定惡意等級。憲法補充消防身高、羈押救濟、健保裁罰及115憲判6兒少性犯罪追訴時效等人民案例。明示115憲判6已於2026年8月14日作成判決，11位聲請人的原裁定廢棄發回，不是直接定罪或所有舊案復活；另區分115審裁665聲請要件不受理與法庭受阻，避免無證據的因果歸屬。
- 「杯葛」另設白話小節，區分程序動議、缺席／清點人數、黨團協商與物理阻擋，不把所有反對都視為杯葛，也不把政治目的當作行為自動合法的理由。
- 「政府怎麼運作」頁內收錄兩套完整立法主題，資料維護於 `Data/legislation.json`，採 `LegislationModel`／`LegislationRepository`／`LegislationService` 分層，與補充頁共用 `TopicContentView` 的閱讀元件。以流程捷徑、分節說明、名詞解釋與官方來源，從提案、程序委員會、專業審查、三讀接到復議／覆議、公布、施行及執行；另外說明聲請憲法審查的資格、受理、暫時處分及判決效力。中央與地方覆議的門檻、期限及主管機關分開；地方讀會以臺北為主要示例，另標示高雄等規則差異，不當成全臺統一門檻。
- 政府頁從「中央與地方，機關都在做什麼？」起設九項閱讀導覽，涵蓋機關、流程、立法院立法、議會立法、人事、質詢、政風、生活情境與角色全文。兩套立法內容直接在同頁閱讀，不再放入「看更多」；相關連結與靜態SEO也指向政府頁。上方互動工作區不納入側欄；窄螢幕改為精簡導覽，桌機側欄可捲動、鍵盤可跳轉。
- 六題虛構媒體識讀情境：證據展開、答題、修改、逐項解析及學習行動。
- 關於本站、開發初衷、公開聯絡信箱、複製與更正郵件入口、來源及更正紀錄。
- 響應式、減少動畫、文字替代、鍵盤表單、SEO metadata、JSON-LD、sitemap、404 與 GA 使用統計。

查詢結果是制度教學，不是個人的實際選舉資格或可領票認證。未提供當屆精確選區、候選人、現任者及投開票所；這些在需求文件中列為另行查核的範圍。

## 分層與資料

```text
src/Model/        型別、Props、Schema、查詢輸入與 ViewModel
src/Repository/   JSON、瀏覽器儲存、剪貼簿與 GA 介接
src/Service/      選舉配置、地名比對、教學及其他商業規則
src/View/         頁面、互動及 UI 綁定
src/app/          Next.js 路由與靜態 metadata 入口
Data/            人工維護及官方匯入的 JSON 原始資料
Images/          原始圖片、favicon 與分享圖
```

View 直接呼叫 Service，資料存取透過 Repository。ESLint 限制跨層 import，Service 亦禁止直接使用 fetch／localStorage。相同主題的方法及型別集中維護；來源目錄的伺服器呈現與共用客戶端來源卡分開，避免將地區名冊無意帶進不需要的頁面。

`Images/` 在開發／建置前同步至生成的 `public/Images/`，不手動維護兩份圖片。Share PNG 已提交；SVG 來源也在 `Images/Site/`。如需重新輸出，可執行 `node scripts/render-share-image.mjs`（需要開發環境中的 `sharp`，隨 Next.js 安裝）。

地區名冊採內政部國土測繪中心 [NLSC 戶政代碼服務](https://data.gov.tw/dataset/102011)，政府資料開放授權條款第 1 版。保留真實 5 位縣市碼、8 位鄉鎮市區碼及前導零。來源 API 沒有提供發布日期，`checkedAt` 只是擷取查核日期。

重新整理官方名冊：

```powershell
node scripts/update-regions.mjs --checked-at YYYY-MM-DD
npm run validate:data
```

此更新動作需網路；一般建置不連外抓取公民或行政區內容。檢查改制、自治例外、來源及選舉規則後再發布。規則或名冊超過 90 天未覆核時，查詢結果會顯示提醒。

## GA4

GitHub Pages 建置已預設啟用使用者提供的 Google Tag `GTM-5WLN6LNC`，對應 GA4 評估 ID 為 `G-M72DVMGDDH`。開發環境及 `build:preview` 仍預設關閉，不混入本機測試流量。若要覆寫或停用，可在 GitHub Repository **Settings → Secrets and variables → Actions → Variables** 設定：

- `ANALYTICS_ENABLED`：`true` 或 `false`（未設定時正式部署為 `true`）
- `GTM_CONTAINER_ID`：`GTM-...`（預設 `GTM-5WLN6LNC`）
- `GA_MEASUREMENT_ID`：`G-...`（預設 `G-M72DVMGDDH`，供辨識該 GA 資源）

這些 ID 為公開設定，不是 API Secret。正式網站啟用分析後會自動初始化 `dataLayer`、`gtag('js', new Date())` 並載入 `gtm.js?id=GTM-5WLN6LNC`，不再顯示同意詢問；先前保存在瀏覽器的設定不影響自動載入。隱私頁說明 GA4 可能使用 Cookie 並處理裝置及網路資訊。

採用 [Google 最新安裝方式](https://developers.google.com/tag-platform/gtagjs)，由 Google Tag Manager 管理目的地。程式不再另外掛載 `gtag/js` 或呼叫 `gtag('config')`，避免重複計數。請在 Google Tag Manager 確認該容器已將 `G-M72DVMGDDH` 設為 Google Analytics 目的地並發布；若容器已有設定，不必再建立另一組相同標記。這部分屬於 Google 帳戶設定，無法由本機程式確認或代為發布。

在 GA4 網頁資料串流開啟 Enhanced Measurement 的頁面載入與 browser history 換頁追蹤；本站不再手動發送 `page_view`，避免雙重計數。請先以自己的測試資源檢查首次進站、Next.js 換頁與上一頁／下一頁。

自訂事件經 Service 白名單，僅使用公開內容 ID 或必要步驟，不含戶籍、身分情境、搜尋原文、答題答案或來信內容。不在網址保存查詢條件。已填入使用者提供的正式 ID；部署後仍須以 Tag Assistant／GA4 即時報表確認正式後台收數。

隔離的 SDK 自動載入測試使用假 ID 與攔截的第三方 script 執行，不送往真實 GA。可在 PowerShell 重現：

```powershell
$env:NEXT_PUBLIC_SITE_ORIGIN = 'http://localhost:4173'
$env:NEXT_PUBLIC_ANALYTICS_ENABLED = 'true'
$env:NEXT_PUBLIC_GTM_CONTAINER_ID = 'GTM-TEST00001'
$env:NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST00001'
$env:TEST_ANALYTICS = 'true'
npm run build
npm run test:e2e -- --grep '分析SDK'
# 結束後，以 npm run build:preview 重建不啟用分析的本機產物。
```

## 檢查與測試

```powershell
npm run check
npm audit --audit-level=high
npm run build:preview
npm run test:e2e
```

開發環境另有區網回歸測試：

```powershell
npm run test:dev
```

此測試優先使用本機實際的區網 IP，涵蓋開發連線、政府頁籤、角色、流程步驟及查詢條件保留。
若已啟動 `npm run dev`，會沿用現有伺服器；也可用 `TEST_DEV_URL` 指定完整開發網址。

單元測試涵蓋所有地區配置、原住民票替換、同名查詢、錯誤父子地區、理解題與 JSON-LD。資料檢查包含 ID、來源、角色關係、完整文章與題庫引用。

瀏覽器測試以真正的 `out/` 執行，涵蓋手機、互動、無 JavaScript、metadata、404 與 WCAG 2.2 AA 自動掃描。Windows 使用已安裝的 Microsoft Edge；Linux CI 與 Pages 建置固定使用 Ubuntu 24.04 runner，以及已包含瀏覽器與系統相依套件的 [Playwright 官方容器](https://playwright.dev/docs/docker) `mcr.microsoft.com/playwright:v1.65.0-noble`。不再於 Browser validation 執行 apt 安裝，避免 runner 版本自動升級或 Ubuntu 套件站 DNS 問題阻擋測試；瀏覽器驗證仍完整執行，通過後才上傳部署產物。更新 `@playwright/test` 時，必須同步更新兩份 workflow 的容器版本。畫面存於忽略追蹤的 `.qa/`，失敗紀錄存於 `test-results/`。

自動掃描不能取代真人可用性／可存取性審閱。目前尚未執行需求中的五位初學者測試，也沒有正式流量可量測第 75 百分位 Core Web Vitals。

所有套件均鎖定版本。`minimatch` 7–10 的間接依賴覆寫為修補版 11.0.1，以處理 [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)；只套用受影響的版本範圍，保留不受影響的舊 API。更新時重跑 lint、測試與 audit。GitHub Actions 固定 SHA，Dependabot 追蹤套件及工作流程更新。

## 規格

- [網站架構](Spec/網站架構.md)
- [第一階段需求](Spec/20261110_第一支功能開發.md)

聯絡：[amaochen0110@gmail.com](mailto:amaochen0110@gmail.com)。

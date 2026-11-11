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

## 已實作的內容與功能

- 首頁三條學習入口、四步快速摘要與八篇完整入門文章。
- 可切換中央／地方的政府角色圖、關係篩選、三組程序導覽及三個生活情境。
- 官方 22 縣市、368 鄉鎮市區查詢；包含全部六個山地原住民區，並分開呈現中央、地方職務。
- 同名地區確認、台／臺正規化、一般／平地／山地原住民立委票別情境切換。
- 六題虛構媒體識讀情境：證據展開、答題、修改、逐項解析及學習行動。
- 關於本站、開發初衷、公開聯絡信箱、複製與更正郵件入口、來源及更正紀錄。
- 響應式、減少動畫、文字替代、鍵盤表單、SEO metadata、JSON-LD、sitemap、404 與 GA 同意控制。

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
- `GA_MEASUREMENT_ID`：`G-...`（預設 `G-M72DVMGDDH`，供撤回時停用該 GA 資源）

這些 ID 為公開設定，不是 API Secret。網站只有在啟用且讀者明確同意後才初始化 `dataLayer`、`gtag('js', new Date())` 並載入 `gtm.js?id=GTM-5WLN6LNC`；拒絕／撤回後停用後續 GA 收集並處理分析 Cookie。隱私頁可重新開啟設定。

採用 [Google 最新安裝方式](https://developers.google.com/tag-platform/gtagjs)，由 Google Tag Manager 管理目的地。程式不再另外掛載 `gtag/js` 或呼叫 `gtag('config')`，避免重複計數。請在 Google Tag Manager 確認該容器已將 `G-M72DVMGDDH` 設為 Google Analytics 目的地並發布；若容器已有設定，不必再建立另一組相同標記。這部分屬於 Google 帳戶設定，無法由本機程式確認或代為發布。

在 GA4 網頁資料串流開啟 Enhanced Measurement 的頁面載入與 browser history 換頁追蹤；本站不再手動發送 `page_view`，避免雙重計數。請先以自己的測試資源檢查首次進站、Next.js 換頁與上一頁／下一頁。

自訂事件經 Service 白名單，僅使用公開內容 ID 或必要步驟，不含戶籍、身分情境、搜尋原文、答題答案或來信內容。不在網址保存查詢條件。已填入使用者提供的正式 ID；正式後台收數仍需部署後允許使用統計，並以 Tag Assistant／GA4 即時報表確認。

隔離的 SDK 同意／撤回測試已使用假 ID 與攔截的第三方 script 執行，不送往真實 GA。可在 PowerShell 重現：

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

瀏覽器測試以真正的 `out/` 執行，涵蓋手機、互動、無 JavaScript、metadata、404 與 WCAG 2.2 AA 自動掃描。Windows 使用已安裝的 Microsoft Edge；Linux CI 執行 `npx playwright install --with-deps chromium` 安裝測試瀏覽器。畫面存於忽略追蹤的 `.qa/`，失敗紀錄存於 `test-results/`。

自動掃描不能取代真人可用性／可存取性審閱。目前尚未執行需求中的五位初學者測試，也沒有正式流量可量測第 75 百分位 Core Web Vitals。

所有套件均鎖定版本。`minimatch` 7–10 的間接依賴覆寫為修補版 11.0.1，以處理 [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)；只套用受影響的版本範圍，保留不受影響的舊 API。更新時重跑 lint、測試與 audit。GitHub Actions 固定 SHA，Dependabot 追蹤套件及工作流程更新。

## 規格

- [網站架構](Spec/網站架構.md)
- [第一階段需求](Spec/20261110_第一支功能開發.md)

聯絡：[amaochen0110@gmail.com](mailto:amaochen0110@gmail.com)。

export const HELP_HTML = `
<header class="help-header">
  <h2>PatentDSL 記法リファレンス</h2>
  <button class="help-close" aria-label="閉じる" type="button">×</button>
</header>
<div class="help-body">

<nav class="help-toc">
  <a href="#h-overview">概要</a>
  <a href="#h-quickstart">クイックスタート</a>
  <a href="#h-id">符号(ID)</a>
  <a href="#h-def">① 定義</a>
  <a href="#h-cont">② 包含</a>
  <a href="#h-conn">③ 接続</a>
  <a href="#h-label">ラベル/多言語</a>
  <a href="#h-comment">コメント</a>
  <a href="#h-quote">クォート</a>
  <a href="#h-infer-kind">図種推論</a>
  <a href="#h-infer-shape">形状推論(◆菱形)</a>
  <a href="#h-shape-howto">菱形の作り方</a>
  <a href="#h-examples">完全な例</a>
  <a href="#h-advanced">応用例</a>
  <a href="#h-output">出力(SVG/PDF/符号表)</a>
  <a href="#h-faq">FAQ</a>
  <a href="#h-tips">Tips・落とし穴</a>
  <a href="#h-shortcuts">操作・モード</a>
  <a href="#h-credit">クレジット</a>
</nav>

<section id="h-overview">
  <h3>概要</h3>
  <p>PatentDSL は <b>3 つの文要素</b>(定義・包含・接続)と <b>1 つのコメント</b> だけで、特許明細書の図面 4 種(ブロック図/フローチャート/シーケンス図/状態遷移図)を書くための記述言語です。</p>
  <ul>
    <li><b>1行 = 1文</b>。改行が文の終わり。</li>
    <li>キーワード(<code>fig</code>/<code>block</code>/<code>flow</code> など)は <b>ありません</b>。図種は構造から自動推論されます。</li>
    <li>符号(reference numerals)を <b>そのままID</b> として使います。明細書本文との照合が直接できます。</li>
    <li><code>"日本語" / "english"</code> の1ソースから日英両方の図を出力できます。</li>
    <li>サーバなし、依存なし。<b>HTMLファイル1枚</b>でブラウザで完結します。</li>
  </ul>
</section>

<section id="h-quickstart">
  <h3>クイックスタート(60秒)</h3>
  <ol>
    <li>左ペインに符号と関係を書く ─ <code>10 = ラベル</code>(定義)、<code>10 : 11 12</code>(包含)、<code>11 -&gt; 12</code>(接続)</li>
    <li>中央に図がリアルタイム描画される</li>
    <li>右ペインに符号表が自動生成される</li>
    <li>ヘッダ右の SVG/PDF/符号MD ボタンで出力</li>
    <li>はじめてなら、左上「サンプル…」から雛形を読込むのが早い</li>
  </ol>
</section>

<section id="h-id">
  <h3>符号(ID)</h3>
  <p>符号は <code>[A-Za-z0-9_*]</code> の並びです。</p>
  <table class="help-tbl">
    <thead><tr><th>例</th><th>用途</th></tr></thead>
    <tbody>
      <tr><td><code>10</code> <code>20</code> <code>100</code></td><td>装置クレームでよくある番号</td></tr>
      <tr><td><code>S100</code> <code>S110</code></td><td>方法クレームのステップ符号</td></tr>
      <tr><td><code>K1</code> <code>P2_3</code> <code>11a</code></td><td>英字+番号、<code>_</code> も使える</td></tr>
      <tr><td><code>*</code></td><td>状態遷移の <b>初期/終端</b> マーカ(黒丸で描画)</td></tr>
    </tbody>
  </table>
  <p>使えない記号: <code>=</code> <code>:</code> <code>-</code> <code>&gt;</code> <code>&lt;</code> <code>.</code> <code>/</code> <code>#</code> <code>"</code></p>
</section>

<section id="h-def">
  <h3>① 定義 <code>id = ラベル</code></h3>
  <p>符号にラベルを付けます。</p>
<pre><code>10 = 制御装置 / control device
11 = CPU
12 = メモリ / memory</code></pre>
  <ul>
    <li><code>=</code> の前後の空白は無視されます。</li>
    <li>ラベル中の <code>/</code> は <b>日本語と英語の区切り</b>。両方書く場合のみ使用。</li>
    <li>片方だけのラベル(<code>11 = CPU</code>)は両言語モードで同じ表示に。</li>
    <li>定義しないで接続だけに書いた符号は <b>暗黙ノード</b> として自動生成され、符号表に薄色で表示されます。</li>
    <li><b>同じ符号の再定義</b>: 後から書いた方で上書きされ、警告が出ます。</li>
  </ul>
</section>

<section id="h-cont">
  <h3>② 包含 <code>親 : 子1 子2 ...</code></h3>
  <p>装置の構成(○○は△△を含む)を表します。</p>
<pre><code>10 = 制御装置
11 = CPU
12 = メモリ

10 : 11 12        # 10 は 11 と 12 を内包する</code></pre>

  <h4>包含のネスト</h4>
  <p>容器自身をさらに別の容器の子にすることで、多段のネストを表現できます。</p>
<pre><code>100 = システム
10 = サブシステムA
20 = サブシステムB
11 = 部品A1
12 = 部品A2
21 = 部品B1

100 : 10 20            # 100 は 10 と 20 を内包
10  : 11 12            # 10 は 11 と 12 を内包
20  : 21               # 20 は 21 を内包</code></pre>

  <h4>自動レイアウト</h4>
  <ul>
    <li>子が 1〜2 個 → 縦1列に並ぶ</li>
    <li>子が 3 個以上で、子同士が直列の処理チェーンを作る場合 → 縦1列に並ぶ</li>
    <li>子が 3 個以上で、分岐/並列/スター状の接続の場合 → 2列グリッド寄りに並ぶ</li>
    <li>同じ親コンテナ内の接続は親の外へ逃がさず、内側の余白通路を優先</li>
    <li>外部ブロックは、接続先の内部ブロックに近い高さへ自動整列</li>
    <li>外部接続は他のブロックを横切らず、接続先の自然な辺(上下左右)へ入る経路を優先</li>
    <li>包含が1つでもあれば、図は <b>ブロック図</b> として描画</li>
  </ul>
</section>

<section id="h-conn">
  <h3>③ 接続 <code>id 演算子 id [ : ラベル ]</code></h3>
  <p>線や矢印を引きます。</p>
  <table class="help-tbl">
    <thead><tr><th>演算子</th><th>線種</th><th>用途</th></tr></thead>
    <tbody>
      <tr><td><code>-</code></td><td>単線</td><td>接続(方向なし)</td></tr>
      <tr><td><code>-&gt;</code></td><td>矢印</td><td>方向のある接続(普通)</td></tr>
      <tr><td><code>&lt;-</code></td><td>逆矢印</td><td><code>A &lt;- B</code> は <code>B -&gt; A</code> と等価。読みやすさのため</td></tr>
      <tr><td><code>&lt;-&gt;</code></td><td>双方向矢印</td><td>相互通信・双方向データ</td></tr>
      <tr><td><code>..</code></td><td>破線</td><td>論理的・無線・補助線</td></tr>
      <tr><td><code>.&gt;</code></td><td>破線矢印</td><td>無線通信などの方向あり破線</td></tr>
      <tr><td><code>=&gt;</code></td><td>太矢印</td><td>強調・主信号</td></tr>
    </tbody>
  </table>
<pre><code>11 -   12          # 単線
13 ->  20          # 矢印
30 <-  40          # 逆矢印(= 40 -> 30)
50 <-> 60          # 双方向
70 ..  80          # 破線
70 .>  80          # 破線矢印
40 =>  50          # 太矢印

13 -> 20 : 信号 / signal          # ラベル付き
30 .> 31 : 無線 / wireless        # 無線通信の慣例(破線矢印)</code></pre>
  <p><b>必ず半角スペースで演算子を囲む</b>(<code>11-12</code> はNG、<code>11 - 12</code> はOK)。</p>
</section>

<section id="h-label">
  <h3>ラベルと多言語</h3>
  <p>定義と接続のラベルは、<code>/</code> で日英を区切ります。</p>
<pre><code>10 = 制御装置 / control device         # 定義(日英)
11 = CPU                              # 英のみ(両モードで CPU と表示)
13 -> 20 : 信号 / signal               # 接続ラベルも同様</code></pre>
  <p>UI右上の <code>日</code>/<code>英</code>/<code>日/英</code> ボタンで表示モードを切替。<b>日/英</b> モードでは1ノード/エッジに両言語が2段で表示されます(PCT国際出願のレビュー用)。</p>
  <p>片言語のみ定義した場合、もう一方の言語モードでもその文字をそのまま表示します。</p>
</section>

<section id="h-comment">
  <h3>コメント</h3>
  <p><code>#</code> から行末まではコメントです。</p>
<pre><code># これはコメント行(完全に無視される)
10 = 制御装置    # 行末コメントもOK
# クォート内の # は文字として扱われる
20 = "型番 #A100" / "Model #A100"</code></pre>
</section>

<section id="h-quote">
  <h3>クォート / エスケープ</h3>
  <p>ラベルに <code>/</code> <code>:</code> <code>=</code> <code>#</code> などの記号を含めたい場合は <code>"..."</code> で囲みます。</p>
<pre><code>13 = "I/O インターフェース" / "I/O interface"    # / を含むラベル
14 = "比率 1:2" / "ratio 1:2"                  # : を含むラベル
15 = "型番 #ABC" / "Model #ABC"                # # を含むラベル
16 = "計算: y = ax + b" / "y = ax + b"          # = を含むラベル</code></pre>
  <p>クォート外の <code>/</code> は日英区切り、<code>:</code> はエッジラベル区切り、<code>#</code> はコメント開始として解釈されます。</p>
</section>

<section id="h-infer-kind">
  <h3>図種の自動推論</h3>
  <p>4つの図種は、ソースの構造を見て <b>上から順に</b> 判定されます。</p>
  <table class="help-tbl">
    <thead><tr><th>優先</th><th>条件</th><th>判定</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>包含文(<code>:</code>)が1つでもある</td><td>ブロック図</td></tr>
      <tr><td>2</td><td>ラベルが <code>?</code> で終わる符号がある</td><td>フローチャート</td></tr>
      <tr><td>3</td><td>符号として <code>*</code> が登場する</td><td>状態遷移図</td></tr>
      <tr><td>4</td><td><code>&lt;-&gt;</code> 演算子、または<b>往復ペア</b>(<code>A→B</code> と <code>B→A</code> の両方)がある</td><td>シーケンス図</td></tr>
      <tr><td>5</td><td>上記いずれにも該当しない(片方向の接続のみ)</td><td>フローチャート(直列パイプライン)</td></tr>
    </tbody>
  </table>
  <p>図種を変えたい場合は、これらの「目印」を使うだけです。ツールバーの「サンプル…」から、各図種の最小例を読み込めます。</p>
  <p><b>シーケンス図にしたい時のコツ</b>: アクター間で<b>往復</b>するメッセージを書く(<code>100 -&gt; 200</code> と <code>200 -&gt; 100</code>)。一方向だけならフローチャートになります。縦破線(ライフライン)はシーケンス図になると自動表示されます。</p>
</section>

<section id="h-infer-shape">
  <h3>形状の自動推論</h3>
  <p>ノードの形は、図種に応じて自動で決まります。</p>

  <h4>フローチャート時</h4>
  <table class="help-tbl">
    <thead><tr><th>条件</th><th>形状</th><th>意味</th></tr></thead>
    <tbody>
      <tr><td>ラベル末尾が <code>?</code></td><td>◆ 菱形</td><td>条件分岐(decision)</td></tr>
      <tr><td>入次数 0(矢印が入ってこない)</td><td>⬭ 角丸</td><td>開始(start)</td></tr>
      <tr><td>出次数 0(矢印が出ていかない)</td><td>⬭ 角丸</td><td>終了(end)</td></tr>
      <tr><td>それ以外</td><td>□ 長方形</td><td>処理(process)</td></tr>
    </tbody>
  </table>

  <h4>状態遷移図時</h4>
  <table class="help-tbl">
    <thead><tr><th>符号</th><th>形状</th></tr></thead>
    <tbody>
      <tr><td><code>*</code></td><td>● 黒丸(初期/終端)</td></tr>
      <tr><td>それ以外</td><td>⬭ 角丸長方形(状態)</td></tr>
    </tbody>
  </table>

  <h4>ブロック図/シーケンス図</h4>
  <p>すべて <b>□ 長方形</b>(包含の親はコンテナ枠として描画)。</p>
</section>

<section id="h-shape-howto">
  <h3>菱形(条件分岐)の作り方</h3>
  <p><b>3つの条件</b>がすべて揃うと菱形になります:</p>
  <ol>
    <li>ラベルの末尾が <code>?</code> である</li>
    <li>図種が <b>フローチャート</b>(包含文がなく、ラベルに <code>?</code> がある)</li>
    <li>その符号が接続に登場している</li>
  </ol>

  <h4>CLI で書く場合</h4>
<pre><code>S100 = 開始 / Start
S110 = 条件A? / "Condition A?"      # ← 末尾の "?" が菱形にする目印
S120 = Yes処理 / Yes Process
S130 = No処理 / No Process
S140 = 終了 / End

S100 -> S110
S110 -> S120 : Yes
S110 -> S130 : No
S120 -> S140
S130 -> S140</code></pre>

  <h4>GUI で書く場合</h4>
  <p>① 符号を定義 カードの「<b>形状: [□四角] [◇菱形]</b>」で「菱形」を選んでから「追加」を押すと、ラベルに自動で <code>?</code> が付きます。四角は通常の部品/処理です。</p>

  <h4>菱形にしたいのに長方形になる時</h4>
  <ul>
    <li>ソースに <code>:</code>(包含)が混ざっていないか確認 → あるとブロック図になり菱形が出ません</li>
    <li>そのノードが接続に1つも現れていない → 孤立ノードはどんな図種でも長方形</li>
    <li>クォート内の <code>?</code> は対象外(<code>"条件?"</code> は OK、<code>"これは?だ"</code> は途中の <code>?</code> なので対象外)</li>
  </ul>
</section>

<section id="h-examples">
  <h3>完全な例</h3>

  <h4>ブロック図(装置クレーム)</h4>
<pre><code>10 = 制御装置 / control device
11 = CPU
12 = メモリ / memory
13 = "I/O インターフェース" / "I/O interface"
20 = 外部機器 / external device

10 : 11 12 13

11 -  12
11 -  13
13 -> 20 : 信号 / signal</code></pre>

  <h4>フローチャート(方法クレーム)</h4>
<pre><code>S100 = 開始 / Start
S110 = 条件A? / "Condition A?"
S120 = 処理X / Process X
S130 = 処理Y / Process Y
S140 = 終了 / End

S100 -> S110
S110 -> S120 : Yes
S110 -> S130 : No
S120 -> S140
S130 -> S140</code></pre>

  <h4>状態遷移図</h4>
<pre><code>S1 = 待機 / Idle
S2 = 動作中 / Running
S3 = エラー / Error

*  -> S1
S1 -> S2 : 起動 / start
S2 -> S1 : 停止 / stop
S2 -> S3 : 異常 / fault
S3 -> S1 : リセット / reset
S3 -> *</code></pre>

  <h4>シーケンス図(プロトコル)</h4>
<pre><code>100 = クライアント / client
200 = サーバ / server

100 -> 200 : 認証要求 / auth request
200 -> 100 : トークン / token
100 -> 200 : リソース要求 / resource request
200 -> 100 : リソース応答 / resource response</code></pre>
</section>

<section id="h-advanced">
  <h3>応用例</h3>
  <p>ツールバーの「サンプル…」やGUIモードの「④よく使うパターン」からワンクリックで挿入できます。</p>
  <p>内蔵サンプルには、基本4図種に加えて、<b>システム全体</b>、<b>IoT/クラウド</b>、<b>画像処理</b>、<b>制御ループ</b>、<b>ハンドシェイク</b>を追加しています。</p>

  <h4>3階層構成</h4>
<pre><code>100 = システム / System
10 = サブシステムA / Subsystem A
20 = サブシステムB / Subsystem B
11 = 部品A1 / Part A1
12 = 部品A2 / Part A2
21 = 部品B1 / Part B1

100 : 10 20
10  : 11 12
20  : 21</code></pre>

  <h4>N段階処理(直列パイプライン)</h4>
<pre><code>S100 = 入力 / Input
S110 = 前処理 / Preprocess
S120 = 主処理 / Main Process
S130 = 後処理 / Postprocess
S140 = 出力 / Output

S100 -> S110
S110 -> S120
S120 -> S130
S130 -> S140</code></pre>

  <h4>並列処理(扇形フォーク+ジョイン)</h4>
<pre><code>S100 = 開始 / Start
S110 = 分岐 / Branch
S120 = 経路A / Path A
S130 = 経路B / Path B
S140 = 経路C / Path C
S150 = 合流 / Join
S160 = 終了 / End

S100 -> S110
S110 -> S120
S110 -> S130
S110 -> S140
S120 -> S150
S130 -> S150
S140 -> S150
S150 -> S160</code></pre>

  <h4>通信ハンドシェイク(双方向矢印を活用)</h4>
<pre><code>100 = 端末 / Terminal
200 = サーバ / Server

100 ->  200 : SYN要求 / SYN
200 ->  100 : SYN+ACK / SYN+ACK
100 ->  200 : ACK応答 / ACK
100 <-> 200 : データ交換 / data exchange   # 双方向
100 ->  200 : FIN / FIN
200 ->  100 : ACK / ACK</code></pre>

  <h4>状態判定フロー(状態名 + 菱形判定)</h4>
<pre><code>S100 = 待機状態 / Idle state
S110 = 検証処理 / Verify
S120 = OK? / OK?
S130 = 完了状態 / Done state
S140 = 失敗状態 / Failed state
S150 = 再試行 / Retry

S100 -> S110 : 要求 / request
S110 -> S120 : 判定 / check
S120 -> S130 : OK
S120 -> S140 : NG
S140 -> S150
S150 -> S100</code></pre>

  <h4>システム全体(階層+外部、有線/無線併用)</h4>
<pre><code>100 = システム本体 / Main system
10  = 制御部 / Control
20  = 通信部 / Comm
11  = CPU
12  = メモリ / memory
21  = 無線部 / wireless
22  = 有線部 / wired
30  = 外部サーバ / external server
40  = 外部端末 / external terminal

100 : 10 20
10  : 11 12
20  : 21 22
21  .> 40 : 無線 / wireless     # 破線矢印で無線を示す
22  -> 30 : 有線 / wired
30  <-> 40 : 通信 / comm</code></pre>

  <h4>クレーム連動の符号統一</h4>
  <p>1つの発明で複数の図(<b>図1</b>=装置、<b>図2</b>=処理フロー)を書く場合、ファイルを分けつつ符号番号を一致させます。例:</p>
<pre><code># fig1.pdg(装置)
10 = 制御装置
11 = CPU
12 = メモリ
10 : 11 12

# fig2.pdg(処理フロー)
S100 = 開始
S110 = "11のCPUで演算"  # 図1の符号11に言及
S120 = "12のメモリへ保存"
S130 = 終了
S100 -> S110
S110 -> S120
S120 -> S130</code></pre>
  <p>接続は <b>1行に1本</b> 書きます。連鎖記法(<code>A -&gt; B -&gt; C</code>)は未サポートです。</p>
</section>

<section id="h-output">
  <h3>出力(SVG/PDF/符号表)</h3>
  <table class="help-tbl">
    <thead><tr><th>形式</th><th>内容</th><th>用途</th></tr></thead>
    <tbody>
      <tr><td>SVG</td><td>ベクタ画像</td><td>Word/LaTeX/Markdownに貼付、Web表示</td></tr>
      <tr><td>PDF</td><td>IPAexゴシック埋込、A4サイズ</td><td>特許出願ファイル、印刷</td></tr>
      <tr><td>符号MD</td><td>Markdown表(符号/日/英)</td><td>明細書【符号の説明】コピペ</td></tr>
      <tr><td>符号CSV</td><td>CSV(id,ja,en)</td><td>翻訳作業、表計算ソフト連携</td></tr>
    </tbody>
  </table>
  <p>表示言語(日/英/日英)はSVG/PDFにも反映されます。</p>
</section>

<section id="h-faq">
  <h3>FAQ</h3>

  <h4>Q. 連鎖記法(<code>A -&gt; B -&gt; C</code>)はできる?</h4>
  <p>A. 現在は未対応。各接続を別行に書いてください。<br>
  <code>A -&gt; B</code><br><code>B -&gt; C</code></p>

  <h4>Q. 同じ符号を別の図でも使いたい</h4>
  <p>A. 現バージョンは <b>1ファイル1図</b>。別ファイルに分けて、符号番号を手動で一致させてください。明細書の符号統一は人手で管理する慣習に従っています。</p>

  <h4>Q. ノードの色を変えたい</h4>
  <p>A. <b>未対応</b>。特許図面は黒線が基本のため。将来「ハイライト」程度のサポートは検討。</p>

  <h4>Q. PDF が文字化けする</h4>
  <p>A. 起こりません。IPAexゴシック(6MB)を埋込済みです。もしダメな場合はブラウザのコンソールにエラー詳細が出ます。</p>

  <h4>Q. 編集中のデータはどこに?</h4>
  <p>A. ブラウザの <b>LocalStorage</b>(リロードしても残る)。サーバには一切送りません。<br>
  クリアしたい時はヘッダ右の「新規」ボタンか、ブラウザの開発者ツールで <code>localStorage.clear()</code>。</p>

  <h4>Q. オフラインで動く?</h4>
  <p>A. 動きます。<code>patent_dsl.html</code> は完全自己完結(フォントもライブラリもインライン)。ネット接続不要。</p>

  <h4>Q. なぜ Mermaid を使わなかった?</h4>
  <p>A. Mermaid は装飾的(色つき、フォント)で、特許庁の様式(黒線・無装飾)と乖離があるため。また符号(reference numerals)を一級市民にしたいため。とはいえ Mermaid に着想を得ています。</p>

  <h4>Q. 自己ループ(同じノードへ戻る矢印)は?</h4>
  <p>A. 書けます: <code>S1 -&gt; S1 : 再試行</code>。ただし現バージョンは見栄えが地味(直線になる)。</p>
</section>

<section id="h-tips">
  <h3>Tips・落とし穴</h3>
  <ul>
    <li><b>演算子の前後は半角スペース</b>(<code>11-12</code> はNG)。パース簡略化のためのルール。</li>
    <li><b>包含のネスト</b>: 容器自身をさらに別の容器の子にすることで多段の階層を表現できる。</li>
    <li><b>接続の方向</b>: 矢印の左→右が方向。逆方向は左右を入れ替えるか <code>&lt;-</code> を使う。</li>
    <li><b>図種を変えたい</b>: <code>:</code> を消す/追加、ラベルに <code>?</code> を入れる、<code>*</code> を使う、など <b>目印を変えるだけ</b>。</li>
    <li><b>暗黙ノード</b>: 定義なしに <code>11 -&gt; 99</code> と書くと、<code>99</code> は符号表に「(暗黙)」として現れる。本当に存在するなら <code>99 = …</code> を追加。</li>
    <li><b>未使用の符号</b>: 定義しただけの符号も符号表には出る。一時的なメモなら <code>#</code> でコメントアウト。</li>
    <li><b>クォート</b>: ラベルに <code>/</code> <code>:</code> <code>=</code> <code>#</code> を含めたい時は必ず <code>"..."</code> で囲む。</li>
    <li><b>PDF品質</b>: 出力PDFはA4縦/横(内容次第)で日本語フォント埋込済み。特許出願にそのまま使える。</li>
    <li><b>LocalStorage</b>: 編集中の内容は自動保存。クリアしたい場合は「新規」ボタン。</li>
    <li><b>シーケンス図の順序</b>: 接続を書いた順に上から下に積まれる。並べ替えたい時はソース内の行を入れ替える。</li>
    <li><b>状態遷移のサイクル</b>: <code>S1 -&gt; S2 -&gt; S1</code> のような循環があってもレイアウト可能(BFS first-touch wins)。</li>
  </ul>
</section>

<section id="h-shortcuts">
  <h3>操作・モード</h3>

  <h4>表示モード</h4>
  <table class="help-tbl">
    <thead><tr><th>モード</th><th>表示内容</th></tr></thead>
    <tbody>
      <tr><td>編集</td><td>エディタのみ全幅(集中入力)</td></tr>
      <tr><td>分割</td><td>エディタ + プレビュー + 符号表(既定)</td></tr>
      <tr><td>プレビュー</td><td>プレビュー + 符号表(レビュー用)</td></tr>
    </tbody>
  </table>

  <h4>入力モード</h4>
  <table class="help-tbl">
    <thead><tr><th>モード</th><th>説明</th></tr></thead>
    <tbody>
      <tr><td>CLI</td><td>テキスト直接編集。慣れたら速い</td></tr>
      <tr><td>GUI</td><td>フォーム + 演算子/パターン/形状の画像選択。記法を覚えていなくてもOK</td></tr>
    </tbody>
  </table>

  <h4>その他</h4>
  <ul>
    <li><b>サンプル…</b>: 図種別・用途別の雛形をワンクリックで読込</li>
    <li><b>新規</b>: 現在のソースを破棄してサンプルに戻す(確認ダイアログあり)</li>
    <li><b>日/英/日英</b>: 表示言語の切替(SVG/PDF出力も同じ)</li>
    <li><b>SVG/PDF</b>: ダウンロード。PDFは日本語フォント埋込</li>
    <li><b>符号MD/CSV</b>: 符号表のダウンロード</li>
  </ul>
</section>

<section id="h-credit">
  <h3>クレジット</h3>
  <p>PatentDSL は単一HTMLファイルで動くオフラインツールです。</p>
  <ul>
    <li>同梱フォント: <a href="https://moji.or.jp/ipafont/" target="_blank">IPAexゴシック</a>(IPAフォントライセンス v1.0)</li>
    <li>PDF生成: <code>jsPDF</code>, <code>svg2pdf.js</code>(MIT)</li>
  </ul>
  <p class="copyright">© 2026 しばやま</p>
</section>

</div>
`;

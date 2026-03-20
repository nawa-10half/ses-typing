/**
 * KV シードスクリプト
 *
 * 使い方:
 *   1. JSON生成:   node scripts/seed-kv.mjs > /tmp/courses.json
 *   2. KVに投入:    npx wrangler kv key put courses --binding KV --path /tmp/courses.json
 *   3. ローカル確認: npx wrangler kv key put courses --binding KV --path /tmp/courses.json --local
 */

const courses = [
  {
    id: 'beginner',
    name: '初級SESコース',
    description: '短い単語でウォーミングアップ',
    timerMultiplier: 1.5,
    words: [
      { word: '単価', kana: 'たんか', flavor: 'あなたの値段がついた瞬間' },
      { word: '現場', kana: 'げんば', flavor: '第二の故郷' },
      { word: '案件', kana: 'あんけん', flavor: 'ガチャの中身' },
      { word: '名刺', kana: 'めいし', flavor: 'お客様先のロゴが入っている' },
      { word: '入社', kana: 'にゅうしゃ', flavor: '夢と希望の第一歩' },
      { word: '研修', kana: 'けんしゅう', flavor: '3日で終わる座学' },
      { word: '常駐', kana: 'じょうちゅう', flavor: '自社より長くいる場所' },
      { word: '帰社日', kana: 'きしゃび', flavor: '月1回だけ思い出す自社の存在' },
    ],
  },
  {
    id: 'intermediate',
    name: '中級SESコース',
    description: 'SES業界用語を打ちまくれ',
    timerMultiplier: 1.0,
    words: [
      { word: '中抜き', kana: 'なかぬき', flavor: '単価の40%は誰かのポケットへ' },
      { word: '自社ビル', kana: 'じしゃびる', flavor: '面接で見た最初で最後の自社' },
      { word: '炎上案件', kana: 'えんじょうあんけん', flavor: '参画初日から既に燃えていた' },
      { word: '現場ガチャ', kana: 'げんばがちゃ', flavor: 'SSRはホワイト現場。確率は非公開' },
      { word: '瑕疵対応', kana: 'かしたいおう', flavor: '無限に湧くバグとの戦い' },
      { word: 'エビデンス', kana: 'えびでんす', flavor: 'スクショを撮る仕事' },
      { word: '定時退社', kana: 'ていじたいしゃ', flavor: '周りが帰らないと帰れない' },
      { word: '仕様変更', kana: 'しようへんこう', flavor: '昨日と今日で仕様が違う' },
      { word: '単価交渉', kana: 'たんかこうしょう', flavor: '「今回は難しいですね」の連打' },
      { word: '有給消化', kana: 'ゆうきゅうしょうか', flavor: '申請すると空気が凍る' },
    ],
  },
  {
    id: 'advanced',
    name: '上級SESコース',
    description: '長文SES用語で限界に挑め',
    timerMultiplier: 0.7,
    words: [
      { word: 'スキルシート', kana: 'すきるしーと', flavor: '書いたことない技術もとりあえず記載' },
      { word: '人月単価', kana: 'にんげつたんか', flavor: '見積もりの基本単位' },
      { word: '経歴詐称', kana: 'けいれきさしょう', flavor: 'Java歴3年（実質3ヶ月）' },
      { word: '多重下請け', kana: 'たじゅうしたうけ', flavor: '上流が誰なのかわからなくなった' },
      { word: 'レガシーコード', kana: 'れがしーこーど', flavor: '書いた人はもういない' },
      { word: '準委任契約', kana: 'じゅんいにんけいやく', flavor: '指揮命令は自社のはず…のはず' },
      { word: '客先常駐', kana: 'きゃくさきじょうちゅう', flavor: 'ここが第二の故郷になる' },
      { word: '工数見積もり', kana: 'こうすうみつもり', flavor: '3倍にしても足りないという不思議' },
      { word: 'エクセル方眼紙', kana: 'えくせるほうがんし', flavor: '設計書はExcelで書く文化' },
      { word: '設計書更新', kana: 'せっけいしょこうしん', flavor: 'コードの後に書く本末転倒' },
      { word: '進捗報告会', kana: 'しんちょくほうこくかい', flavor: '毎朝15分のはずが1時間' },
      { word: '服装規定あり', kana: 'ふくそうきていあり', flavor: '面接で「自由です」と言われたはず' },
    ],
  },
]

console.log(JSON.stringify(courses, null, 2))

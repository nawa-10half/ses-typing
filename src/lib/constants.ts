import type { RankInfo, Course } from '../types/game.ts'

export const COURSES: Course[] = [
  {
    id: 'beginner',
    name: '初級SESコース',
    description: '短い単語でウォーミングアップ',
    timerMultiplier: 1.5,
    words: [
      { word: '単価', kana: 'たんか', romaji: 'tanka', flavor: 'あなたの値段がついた瞬間' },
      { word: '現場', kana: 'げんば', romaji: 'genba', flavor: '第二の故郷' },
      { word: '案件', kana: 'あんけん', romaji: 'anken', flavor: 'ガチャの中身' },
      { word: '名刺', kana: 'めいし', romaji: 'meishi', flavor: 'お客様先のロゴが入っている' },
      { word: '入社', kana: 'にゅうしゃ', romaji: 'nyuusha', flavor: '夢と希望の第一歩' },
      { word: '研修', kana: 'けんしゅう', romaji: 'kenshuu', flavor: '3日で終わる座学' },
      { word: '常駐', kana: 'じょうちゅう', romaji: 'jouchuu', flavor: '自社より長くいる場所' },
      { word: '帰社日', kana: 'きしゃび', romaji: 'kishabi', flavor: '月1回だけ思い出す自社の存在' },
    ],
  },
  {
    id: 'intermediate',
    name: '中級SESコース',
    description: 'SES業界用語を打ちまくれ',
    timerMultiplier: 1.0,
    words: [
      { word: '中抜き', kana: 'なかぬき', romaji: 'nakanuki', flavor: '単価の40%は誰かのポケットへ' },
      { word: '自社ビル', kana: 'じしゃびる', romaji: 'jishabiru', flavor: '面接で見た最初で最後の自社' },
      { word: '炎上案件', kana: 'えんじょうあんけん', romaji: 'enjouanken', flavor: '参画初日から既に燃えていた' },
      { word: '現場ガチャ', kana: 'げんばがちゃ', romaji: 'genbagacha', flavor: 'SSRはホワイト現場。確率は非公開' },
      { word: '瑕疵対応', kana: 'かしたいおう', romaji: 'kashitaiou', flavor: '無限に湧くバグとの戦い' },
      { word: 'エビデンス', kana: 'えびでんす', romaji: 'ebidensu', flavor: 'スクショを撮る仕事' },
      { word: '定時退社', kana: 'ていじたいしゃ', romaji: 'teijitaisha', flavor: '周りが帰らないと帰れない' },
      { word: '仕様変更', kana: 'しようへんこう', romaji: 'shiyouhenkou', flavor: '昨日と今日で仕様が違う' },
      { word: '単価交渉', kana: 'たんかこうしょう', romaji: 'tankakoushou', flavor: '「今回は難しいですね」の連打' },
      { word: '有給消化', kana: 'ゆうきゅうしょうか', romaji: 'yuukyuushouka', flavor: '申請すると空気が凍る' },
    ],
  },
  {
    id: 'advanced',
    name: '上級SESコース',
    description: '長文SES用語で限界に挑め',
    timerMultiplier: 0.7,
    words: [
      { word: 'スキルシート', kana: 'すきるしーと', romaji: 'sukirushiito', flavor: '書いたことない技術もとりあえず記載' },
      { word: '人月単価', kana: 'にんげつたんか', romaji: 'ningetsutanka', flavor: '見積もりの基本単位' },
      { word: '経歴詐称', kana: 'けいれきさしょう', romaji: 'keirekisashou', flavor: 'Java歴3年（実質3ヶ月）' },
      { word: '多重下請け', kana: 'たじゅうしたうけ', romaji: 'tajuushitauke', flavor: '上流が誰なのかわからなくなった' },
      { word: 'レガシーコード', kana: 'れがしーこーど', romaji: 'regashiikoodo', flavor: '書いた人はもういない' },
      { word: '準委任契約', kana: 'じゅんいにんけいやく', romaji: 'junininkeiyaku', flavor: '指揮命令は自社のはず…のはず' },
      { word: '客先常駐', kana: 'きゃくさきじょうちゅう', romaji: 'kyakusakijouchuu', flavor: 'ここが第二の故郷になる' },
      { word: '工数見積もり', kana: 'こうすうみつもり', romaji: 'kousuumitsumori', flavor: '3倍にしても足りないという不思議' },
      { word: 'エクセル方眼紙', kana: 'えくせるほうがんし', romaji: 'ekuseruhouganshi', flavor: '設計書はExcelで書く文化' },
      { word: '設計書更新', kana: 'せっけいしょこうしん', romaji: 'sekkeishokoushin', flavor: 'コードの後に書く本末転倒' },
      { word: '進捗報告会', kana: 'しんちょくほうこくかい', romaji: 'shinchokuhoukokukai', flavor: '毎朝15分のはずが1時間' },
      { word: '服装規定あり', kana: 'ふくそうきていあり', romaji: 'fukusoukiteiari', flavor: '面接で「自由です」と言われたはず' },
    ],
  },
]

export const RANKS: RankInfo[] = [
  { min: 3600, rank: '永久常駐の神', comment: 'もはやSES沼の主。誰も逃がさない' },
  { min: 3000, rank: '光速タイパー', comment: 'その指で議事録を量産してほしい' },
  { min: 2400, rank: 'スピードタイパー', comment: 'このスピードでスキルシートも更新して' },
  { min: 1800, rank: '熟練エンジニア', comment: 'あるある全部わかるやつ' },
  { min: 1200, rank: '沼に片足突っ込み中', comment: 'まだ浅瀬。引き返せ…引き返せるのか？' },
  { min: 0, rank: 'SES沼の住人', comment: '中抜き構造に完全に飲み込まれた' },
]

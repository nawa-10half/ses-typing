// Run with: npx wrangler kv:key put --binding KV stages "$(cat scripts/stages.json)"
// Or use this script with wrangler: npx tsx scripts/seed-kv.ts

const STAGES = [
  {
    name: '入社',
    label: 'STAGE 1 — 入社',
    subtitle: '夢と希望に溢れた新卒エンジニア',
    words: [
      { word: 'スキルシート', hint: 'skill sheet', flavor: '書いたことない技術もとりあえず記載' },
      { word: '入社式', hint: 'nyuusha shiki', flavor: '社長の話が45分続いた' },
      { word: '人月単価', hint: 'ninjitsu tanka', flavor: 'あなたの値段がついた瞬間' },
      { word: '常駐先', hint: 'jouchuu saki', flavor: '自社より長くいる不思議な場所' },
      { word: '研修期間', hint: 'kenshuu kikan', flavor: '3ヶ月後に謎の現場へ飛ばされる' },
      { word: '名刺交換', hint: 'meishi koukan', flavor: 'お客様先の名刺を渡す矛盾' },
      { word: '自社ビル', hint: 'jisha biru', flavor: '面接で見た最初で最後の自社' },
      { word: '帰社日', hint: 'kisha bi', flavor: '月1回だけ思い出す自社の存在' },
    ],
  },
  {
    name: '現場ガチャ',
    label: 'STAGE 2 — 現場ガチャ',
    subtitle: '天国か地獄かは運次第',
    words: [
      { word: '現場ガチャ', hint: 'genba gacha', flavor: 'SSRはホワイト現場。確率は非公開' },
      { word: 'レガシーコード', hint: 'regashii koodo', flavor: '書いた人はもういない' },
      { word: 'リモート不可', hint: 'rimooto fuka', flavor: '理由：セキュリティ上の都合' },
      { word: '工数見積もり', hint: 'kousuu mitsumori', flavor: '3倍にしても足りないという不思議' },
      { word: '服装規定あり', hint: 'fukusou kitei ari', flavor: '面接で「自由です」と言われたはず' },
      { word: '客先常駐', hint: 'kyakusaki jouchuu', flavor: 'ここが第二の故郷になる' },
      { word: 'エクセル方眼紙', hint: 'ekuseru houganshi', flavor: '設計書はExcelで書く文化' },
      { word: '進捗報告会', hint: 'shinchoku houkokukai', flavor: '毎朝15分のはずが1時間' },
    ],
  },
  {
    name: 'SES沼',
    label: 'STAGE 3 — SES沼',
    subtitle: '気づいたら5年が経っていた',
    words: [
      { word: '中抜き', hint: 'nakanuki', flavor: '単価の40%は誰かのポケットへ' },
      { word: '多重下請け', hint: 'tajuu shitauke', flavor: '上流が誰なのかわからなくなった' },
      { word: '炎上案件', hint: 'enjou anken', flavor: '参画初日から既に燃えていた' },
      { word: '単価交渉', hint: 'tanka koushou', flavor: '「今回は難しいですね」の連打' },
      { word: '準委任契約', hint: 'jun-inin keiyaku', flavor: '指揮命令は自社のはず…のはず' },
      { word: '社内ニート', hint: 'shanai niito', flavor: '待機中。給料は出る。でも虚無' },
      { word: '偽装請負', hint: 'gisou ukeoi', flavor: 'これは準委任です（震え声）' },
      { word: '経歴詐称', hint: 'keireki sashou', flavor: 'Java歴3年（実質3ヶ月）' },
    ],
  },
  {
    name: '現場あるある',
    label: 'STAGE 4 — 現場あるある',
    subtitle: '共感したら負けだと思っている',
    words: [
      { word: '議事録係', hint: 'gijiroku gakari', flavor: '新人の永久ポジション' },
      { word: '進捗報告', hint: 'shinchoku houkoku', flavor: '順調です（嘘ではない）' },
      { word: '定時退社', hint: 'teiji taisha', flavor: '周りが帰らないと帰れない' },
      { word: '有給消化', hint: 'yuukyuu shouka', flavor: '申請すると空気が凍る' },
      { word: 'エビデンス', hint: 'ebidensu', flavor: 'スクショを撮る仕事' },
      { word: '瑕疵対応', hint: 'kashi taiou', flavor: '無限に湧くバグとの戦い' },
      { word: '仕様変更', hint: 'shiyou henkou', flavor: '昨日と今日で仕様が違う' },
      { word: '設計書更新', hint: 'sekkeisho koushin', flavor: 'コードの後に書く本末転倒' },
    ],
  },
  {
    name: '脱出',
    label: 'STAGE 5 — 脱出',
    subtitle: 'SES沼からの逃走劇',
    words: [
      { word: '自社開発', hint: 'jisha kaihatsu', flavor: 'やっと自分のプロダクトができる' },
      { word: '技術ブログ', hint: 'gijutsu burogu', flavor: '転職活動の最強の武器になった' },
      { word: 'フリーランス', hint: 'furiirannsu', flavor: '中抜きなし、全部自分の稼ぎ' },
      { word: '退職届', hint: 'taishoku todoke', flavor: '人生で一番緊張した紙' },
      { word: '転職面接', hint: 'tenshoku mensetsu', flavor: '御社でなら成長できると確信' },
      { word: '内定通知', hint: 'naitei tsuuchi', flavor: '画面の前で思わずガッツポーズ' },
      { word: '最終出社', hint: 'saishuu shussha', flavor: 'ロッカーの中身が意外と少ない' },
      { word: '脱出完了', hint: 'dasshutsu kanryou', flavor: 'おめでとう。あなたは沼から出た' },
    ],
  },
]

console.log(JSON.stringify(STAGES, null, 2))
console.log('\nTo seed KV, run:')
console.log('npx wrangler kv:key put --binding KV stages \'<paste JSON above>\'')

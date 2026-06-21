// ==========================================
// Style 07: Code Golf (コードゴルフ)
// ==========================================
// 【制約】
// 1. コードの文字数を極限まで減らす（空白・改行・変数名・関数名の徹底的な短縮）。
// 2. 言語の組み込み機能やワンライナーの手法をフル活用する。
// 3. 可読性を完全に犠牲にし、最短コードでの動作のみを追求する。

let c:[string,string,number,number][]=[['PRD-01','ノートPC',1e5,2],['PRD-02','マウス',3000,5],['PRD-03','キーボード',5000,0]],t:Record<string,number>={};
let d=()=>console.log("=== 商品カタログ ===\n"+c.map(x=>`[${x[0]}] ${x[1]} / 価格: ${x[2]}円 / 在庫: ${x[3]}個`).join('\n')+"\n===================\n");
let a=(i:string,q:number)=>{
  let x=c.find(y=>y[0]==i);if(!x)return console.log(`エラー: 商品 ${i} が見つかりません。`);
  let k=t[i]||0;if(x[3]==0)return console.log(`エラー: ${x[1]} は在庫切れです。`);
  if(x[3]<k+q)return console.log(`エラー: ${x[1]} の在庫が不足しています（要求: ${q}個, カート内: ${k}個, 在庫: ${x[3]}個）。`);
  t[i]=k+q;console.log(`[OK] カートに追加しました: ${x[1]} x ${q}`);
};
let o=()=>{
  let k=Object.keys(t);if(!k.length)return console.log("エラー: カートが空です。");
  console.log("\n--- レシート (Receipt) ---");
  let s=k.reduce((a,i)=>{
    let x=c.find(y=>y[0]==i)!,q=t[i],l=x[2]*q;
    console.log(`・${x[1]} (${x[2]}円) x ${q} = ${l}円`);x[3]-=q;return a+l;
  },0);
  let w=s>=3000?Math.round(s*0.1):0;
  console.log(`割引前合計: ${s}円\n割引額: -${w}円\n支払合計: ${s-w}円\n-------------------------\n`);t={};
};
d();a('PRD-02',1);a('PRD-03',1);a('PRD-01',3);a('PRD-01',1);o();d();

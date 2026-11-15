export const BINS=13;
export function validateShares(row){
 if(row.length!==BINS||row.some(x=>!Number.isFinite(x)||x<0||x>1)||Math.abs(row.reduce((a,b)=>a+b,0)-1)>1e-9)throw Error('Invalid session shares');
}
export function summarize(rows){
 if(!rows.length)throw Error('No sessions');rows.forEach(validateShares);
 const mean=[],min=[],max=[],median=[];
 for(let b=0;b<BINS;b++){
  const col=rows.map(r=>r[b]*BINS).sort((a,b)=>a-b);
  mean.push(col.reduce((s,x)=>s+x/rows.length,0));min.push(col[0]);max.push(col.at(-1));median.push((col[Math.floor((col.length-1)/2)]+col[Math.floor(col.length/2)])/2);
 }
 return {mean,min,max,median};
}
export function parseData(text){
 const lines=text.trim().split(/\r?\n/);if(lines.shift()!=='asset,date,bin,variance_share,volume_share')throw Error('Invalid data header');
 const result={SPY:[],AAPL:[]},groups=new Map();
 if(lines.length!==260)throw Error('Expected 260 derived rows');
 for(const l of lines){const f=l.split(',');if(f.length!==5)throw Error('Invalid row');const[a,date,bs,vs,vols]=f;
  if(!Object.hasOwn(result,a)||!/^2026-11-(0[2-6]|09|1[0-3])$/.test(date)||!/^([0-9]|1[0-2])$/.test(bs)||![vs,vols].every(v=>/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(v)))throw Error('Invalid data fields');
  const b=Number(bs),v=Number(vs),vol=Number(vols),key=a+date;
  if(!groups.has(key))groups.set(key,{asset:a,date,variance:Array(13),volume:Array(13)});
  const g=groups.get(key);if(g.variance[b]!==undefined)throw Error('Duplicate bin');g.variance[b]=v;g.volume[b]=vol;
 }
 for(const g of groups.values()){if(g.variance.filter(x=>x!==undefined).length!==13)throw Error('Incomplete day');validateShares(g.variance);validateShares(g.volume);result[g.asset].push(g);}
 for(const a of Object.keys(result)){result[a].sort((a,b)=>a.date.localeCompare(b.date));if(result[a].length!==10)throw Error('Incomplete sample');}
 return result;
}
export function label(bin){let m=570+30*bin;return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}

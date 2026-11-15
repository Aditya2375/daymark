import{readFileSync}from'node:fs';import{execFileSync}from'node:child_process';import assert from'node:assert/strict';import{parseData,summarize,validateShares,label}from'../web/src/statistics.js';
const text=readFileSync('web/data/shares.csv','utf8'),data=parseData(text);let n=0,max=0;
const ref=execFileSync('java',['-cp','build/classes','RefDump'],{encoding:'utf8'}).trim().split('\n');
for(const line of ref){const[a,m,k,b,v]=line.split(',');const got=summarize(data[a].map(d=>d[+m===0?'variance':'volume']))[k][+b];const error=Math.abs(got-Number(v));max=Math.max(max,error);assert.ok(error<1e-12,line);n++;}
const flat=Array(13).fill(1/13);assert.equal(summarize([flat]).mean[0],1);n++;
assert.throws(()=>parseData(text.replace('SPY,2026-11-02,0,','SPY,2026-11-02,1,')));n++;
assert.throws(()=>parseData(text.replace('SPY,2026-11-02','SPY,2026-11-07')));n++;
assert.throws(()=>parseData(text.replace('variance_share','variance')));n++;
assert.throws(()=>parseData(text.replace(/0\.02577550239696935/,'NaN')));n++;
assert.throws(()=>parseData(text.split('\n').slice(0,-2).join('\n')));n++;
assert.throws(()=>validateShares(Array(13).fill(0)));n++;assert.throws(()=>validateShares(Array(13).fill(Infinity)));n++;assert.throws(()=>summarize([]));n++;
assert.equal(label(0),'09:30');assert.equal(label(12),'15:30');assert.equal(label(13),'16:00');n+=3;
for(const a of Object.keys(data))for(const row of data[a])for(const m of ['variance','volume']){assert.ok(Math.abs(row[m].reduce((a,b)=>a+b,0)-1)<1e-12);n++;}
console.log(`${n} Java/JS comparisons and JS validation checks; max error ${max}`);

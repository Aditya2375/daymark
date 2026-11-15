import{parseData,summarize,label}from'./statistics.js';
const $=id=>document.getElementById(id),asset=$('asset'),metric=$('metric'),day=$('day'),bin=$('bin');let data=null;
const fmt=x=>`${x.toFixed(2)}×`;
function current(){return data[asset.value];}
function chart(summary,row){
 const canvas=$('chart'),dpr=Math.min(window.devicePixelRatio||1,3),w=canvas.clientWidth,h=canvas.clientHeight;
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const c=canvas.getContext('2d');c.scale(dpr,dpr);
 const left=43,right=13,top=18,bottom=35,pw=w-left-right,ph=h-top-bottom;
 const step=Math.max(.5,Math.ceil(Math.max(...summary.max)/5*2)/2),ceiling=Math.max(2,step*5),x=i=>left+(i+.5)*pw/13,y=v=>top+ph-v/ceiling*ph;
 c.font='11px ui-monospace, monospace';c.textAlign='right';c.textBaseline='middle';
 for(let v=0;v<=ceiling+1e-9;v+=step){c.strokeStyle='#d7e3ec';c.lineWidth=1;c.beginPath();c.moveTo(left,y(v));c.lineTo(w-right,y(v));c.stroke();c.fillStyle='#526d82';c.fillText(`${v.toFixed(v%1?1:0)}×`,left-8,y(v));}
 c.fillStyle='rgba(23,91,131,.12)';c.beginPath();summary.max.forEach((v,i)=>i?c.lineTo(x(i),y(v)):c.moveTo(x(i),y(v)));for(let i=12;i>=0;i--)c.lineTo(x(i),y(summary.min[i]));c.closePath();c.fill();
 c.strokeStyle='#617c91';c.setLineDash([4,4]);c.beginPath();c.moveTo(left,y(1));c.lineTo(w-right,y(1));c.stroke();c.setLineDash([]);
 function line(values,color,width,dash){c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();values.forEach((v,i)=>i?c.lineTo(x(i),y(v)):c.moveTo(x(i),y(v)));c.stroke();c.setLineDash([]);}
 line(row.map(v=>v*13),'#a74e25',1.4,[5,4]);line(summary.mean,'#175b83',2.5,[]);
 for(let i=0;i<13;i++){c.fillStyle='#175b83';c.beginPath();c.arc(x(i),y(summary.mean[i]),2.7,0,Math.PI*2);c.fill();if(w>650||i%3===0){c.fillStyle='#526d82';c.textAlign='center';c.fillText(label(i),x(i),h-15);}}
 const b=+bin.value;c.strokeStyle='#172f47';c.lineWidth=1;c.beginPath();c.moveTo(x(b),top);c.lineTo(x(b),h-bottom);c.stroke();
 c.fillStyle='#a74e25';c.beginPath();c.arc(x(b),y(row[b]*13),4,0,Math.PI*2);c.fill();
 canvas.setAttribute('aria-label',`${asset.value}, ${metric.value} profile. Equal-day mean and observed daily minimum to maximum, ten sessions. Selected ${day.value} at ${label(b)}: ${fmt(row[b]*13)}. Exact data in profile table.`);
}
function heatmap(rows){
 const t=$('heatmap');t.replaceChildren();const cap=document.createElement('caption');cap.textContent=`${asset.value} / ${metric.value==='variance'?'realized-variance':'share-volume'} shares / all times New York`;t.append(cap);
 const head=document.createElement('thead'),hr=document.createElement('tr');for(const s of ['Session',...Array.from({length:13},(_,b)=>label(b))]){const th=document.createElement('th');th.scope='col';th.textContent=s;hr.append(th);}head.append(hr);t.append(head);
 const body=document.createElement('tbody'),max=Math.max(...rows.flatMap(r=>r[metric.value].map(v=>v*13)));
 $('scale-max').textContent=fmt(max);
 for(const r of rows){const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=r.date.slice(5);tr.append(th);
  r[metric.value].forEach((v,b)=>{const td=document.createElement('td'),button=document.createElement('button'),q=(v*13/max),light=97-q*65;
   button.textContent=(v*13).toFixed(1);button.style.backgroundColor=`hsl(203 52% ${light}%)`;button.style.color=light<55?'#fff':'#172f47';button.dataset.day=r.date;button.dataset.bin=b;
   button.setAttribute('aria-label',`${r.date}, ${label(b)} to ${label(b+1)}, ${(v*100).toFixed(2)} percent of session, ${fmt(v*13)}`);button.addEventListener('click',()=>{day.value=r.date;bin.value=b;render(false);});td.append(button);tr.append(td);
  });body.append(tr);
 }t.append(body);
}
function render(rebuild=true){
 if(!data)return;const rows=current(),m=metric.value,b=+bin.value,row=rows.find(r=>r.date===day.value)||rows[0],s=summarize(rows.map(r=>r[m]));day.value=row.date;
 $('profile-title').textContent=m==='variance'?'Share of daily price variation':'Share of regular-session volume';
 $('measure-unit').textContent=m==='variance'?'Squared five-minute log returns / normalized each day':'Shares traded / normalized each day';
 $('open').textContent=fmt(s.mean[0]);$('middle').textContent=fmt(s.mean[6]);$('close').textContent=fmt(s.mean[12]);
 $('summary').textContent=`${asset.value}: the opening half-hour averaged ${(s.mean[0]/13*100).toFixed(1)}% of each session's ${m==='variance'?'realized variance':'observed regular-session share volume'}; an equal half-hour would hold ${(100/13).toFixed(2)}%. These are descriptive averages across ten days, not a fitted U-curve.`;
 $('bin-value').textContent=label(b);$('bin').setAttribute('aria-valuetext',`${label(b)} to ${label(b+1)} New York time`);
 $('selected-name').textContent=`${row.date} / ${label(b)} to ${label(b+1)} ET`;$('selected-value').textContent=fmt(row[m][b]*13);$('selected-share').textContent=`${(row[m][b]*100).toFixed(2)}% of this session's ${m==='variance'?'realized variance':'observed volume'}`;
 if(rebuild)heatmap(rows);for(const button of $('heatmap').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.day===row.date&&+button.dataset.bin===b));
 const tbody=$('numbers').querySelector('tbody');tbody.replaceChildren();for(let i=0;i<13;i++){const tr=document.createElement('tr');[`${label(i)} to ${label(i+1)}`,...[s.mean[i],s.median[i],s.min[i],s.max[i],row[m][i]*13].map(v=>v.toFixed(4))].forEach((v,k)=>{const cell=document.createElement(k===0?'th':'td');if(k===0)cell.scope='row';cell.textContent=v;tr.append(cell);});tbody.append(tr);}
 chart(s,row[m]);
}
function populateDay(){const prev=day.value;day.replaceChildren();for(const r of current()){const o=document.createElement('option');o.value=r.date;o.textContent=r.date;day.append(o);}if(current().some(r=>r.date===prev))day.value=prev;}
asset.addEventListener('change',()=>{populateDay();render();});metric.addEventListener('change',()=>render());day.addEventListener('change',()=>render(false));bin.addEventListener('input',()=>render(false));window.addEventListener('resize',()=>render(false));
try{const response=await fetch('./data/shares.csv');if(!response.ok)throw Error('Archive could not be loaded');data=parseData(await response.text());populateDay();for(const e of[asset,metric,day,bin])e.disabled=false;$('loading').hidden=true;render();}catch{data=null;$('loading').hidden=true;$('error').hidden=false;$('error').textContent='The archived results could not be loaded. Reload to try again. No partial profile is shown.';}

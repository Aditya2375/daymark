import{rmSync,mkdirSync,cpSync}from'node:fs';
rmSync('docs',{recursive:true,force:true});mkdirSync('docs/src',{recursive:true});mkdirSync('docs/data',{recursive:true});
for(const f of ['index.html','styles.css'])cpSync(f,`docs/${f}`);
for(const f of ['app.js','statistics.js'])cpSync(`web/src/${f}`,`docs/src/${f}`);
cpSync('web/data/shares.csv','docs/data/shares.csv');console.log('docs built from source');

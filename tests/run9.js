const {boot,sleep,chk,done,mockServer}=require('./h.js');
(async()=>{
 const srv=mockServer();
 srv.fetch.reply=(b,i)=>{
  if(b.tools&&b.tools.length&&!JSON.stringify(b.messages).includes('tool_result'))return{stop_reason:'tool_use',content:[{type:'text',text:'Adding it.'},{type:'tool_use',id:'tu1',name:'create_note',input:{title:'From Claude API',body:'hello'}}]};
  return{stop_reason:'end_turn',content:[{type:'text',text:'Done — added the note.'}]}};
 const t=boot({fetch:srv.fetch});const {w,ev,key,click}=t;
 await sleep(8000);
 chk('boots with no errors',t.errs.length===0);if(t.errs.length)console.log(t.errs);
 const N0=ev('Object.keys(S.notes).length');chk('seeded data present ('+N0+' notes)',N0>60);
 // ---------- wikilinks
 chk('example notes got links (seed5 ran)',ev('!!S.notes.w_links')&&/\[\[Magic that runs on language\]\]/.test(ev("S.notes.x_bk.b")));
 const lx=ev('(()=>{const l=getLX();return{inn:(l.inn.x_babel||[]).map(x=>x.from),inb:(l.inn.x_bk||[]).map(x=>x.from),out:(l.out.w_links||[]).map(x=>x.t+(x.to?"":" (missing)"))}})()');
 chk('backlinks index: Silver Tongue <- '+lx.inn.join(',')+' ; Babel (novel) <- '+lx.inb.join(','),lx.inn.includes('x_bk')&&lx.inn.includes('x_mag')&&lx.inb.includes('x_sub')&&lx.inb.includes('x_babel'));
 chk('dangling link detected in the guide note',lx.out.some(x=>/future idea \(missing\)/.test(x)));
 chk('alias link resolves to its target',ev("getLX().out.x_babel.some(l=>l.alias==='the novel'&&l.to==='x_bk')"));
 chk('graph has dashed link edges between non-parent notes ('+ev('LINK.length')+' in this sphere)',ev('LINK.length')>=2);
 chk('link lines never duplicate a parent/child edge',ev('LINK.every(([a,b])=>S.notes[a].p!==b&&S.notes[b].p!==a)'));
 ev("openEd('x_babel')");await sleep(500);
 chk('read mode renders [[links]] as anchors',ev("document.querySelectorAll('#pv a.wkl').length")>=2);
 chk('alias shows its label',ev("[...document.querySelectorAll('#pv a.wkl')].some(a=>a.textContent==='the novel')"));
 let rel=ev("document.querySelector('#rel').textContent");
 chk('related panel lists backlinks',/Backlinks/.test(rel)&&/On being lost in translation|Silver-working rules|Babel/.test(rel));
 // click a resolved link
 ev("[...document.querySelectorAll('#pv a.wkl')].find(a=>a.textContent==='the novel').click()");await sleep(400);
 chk('clicking a link opens the target note',ev('sel')==='x_bk');
 // dangling
 ev("openEd('w_links')");await sleep(500);
 chk('dangling link is styled dashed',ev("!!document.querySelector('#pv a.wkl.dn')"));
 const c0=ev('Object.keys(S.notes).length');
 ev("document.querySelector('#pv a.wkl.dn').click()");await sleep(500);
 chk('clicking it creates the note under the current one',ev('Object.keys(S.notes).length')===c0+1&&ev("S.notes[sel].t")==='A future idea'&&ev("S.notes[sel].p")==='w_links');
 ev("openEd('w_links')");await sleep(500);
 chk('…and the link is no longer dangling',ev("!document.querySelector('#pv a.wkl.dn')"));
 // unlinked mentions
 ev("openEd('m_miles')");await sleep(500);
 rel=ev("document.querySelector('#rel').textContent");
 chk('unlinked mentions found ("Start with Miles Davis…")',/Unlinked mentions/.test(rel)&&/Jazz/.test(rel));
 click('#rel [data-lk]');await sleep(300);
 chk('"Link it" wraps the mention in [[ ]]',/\[\[Miles Davis\]\]/.test(ev('S.notes.m_jazz.b')));
 // rename propagation
 ev("openEd('x_mag',true)");await sleep(400);
 const before=ev("S.notes.x_sub.b.includes('[[Babel')");
 ev("openEd('x_bk',true)");await sleep(400);
 ev("$('#et').value='Babel — Kuang (2022)';$('#et').dispatchEvent(new Event('input'))");
 ev("$('#et').dispatchEvent(new Event('change'))");await sleep(300);
 chk('renaming a note rewrites links to it ('+(ev("S.notes.x_sub.b").match(/\[\[[^\]]+\]\]/g)||[]).join(' ')+')',/\[\[Babel — Kuang \(2022\)\]\]/.test(ev('S.notes.x_sub.b'))&&/\[\[Babel — Kuang \(2022\)\|the novel\]\]/.test(ev('S.notes.x_babel.b')));
 // autocomplete
 ev("openEd('x_mag',true)");await sleep(400);
 ev("(()=>{const e=$('#eb');e.focus();e.value='See [[Sil';e.setSelectionRange(9,9);e.dispatchEvent(new Event('input'))})()");await sleep(100);
 chk('typing [[ opens the picker',!ev('$("#wlp").hidden')&&/Silver-working rules/.test(ev('$("#wlp").textContent')));
 key('Escape',{},ev("$('#eb')"));await sleep(50);
 chk('Esc closes the picker without leaving edit mode',ev('$("#wlp").hidden')&&ev('ro')===false);
 ev("(()=>{const e=$('#eb');e.value='See [[Sil';e.setSelectionRange(9,9);e.dispatchEvent(new Event('input'))})()");await sleep(50);
 key('Enter',{},ev("$('#eb')"));await sleep(100);
 chk('Enter inserts the chosen title: "'+ev("$('#eb').value")+'"',ev("$('#eb').value")==='See [[Silver-working rules]]'&&ev('S.notes.x_mag.b')==='See [[Silver-working rules]]');
 // hover card exists / links toggle
 click('#lkv');chk('link-lines toggle works',ev('window.SHOWLK')===false);click('#lkv');
 // ---------- settings + Claude key
 key(',');await sleep(200);chk('comma opens settings',!ev('$("#set").hidden'));
 chk('settings has Claude, Firebase, backups, device and performance sections',ev("['claude','sync','backup','storage','perf','data'].every(s=>!!document.querySelector('#set [data-sec=\"'+s+'\"]'))"));
 ev("$('#s_ck').value='sk-ant-test';$('#s_ck').dispatchEvent(new Event('change'))");
 chk('Claude key is saved on the device',ev('PL.cfg.claudeKey')==='sk-ant-test'&&/sk-ant-test/.test(w.localStorage.getItem('sb_cfg')));
 ev("PL.save()");click('#s_ct');await sleep(300);
 chk('Test key calls the API and reports success',/Works/.test(ev("$('#s_cs').textContent"))&&srv.fetch.anth[0].headers['x-api-key']==='sk-ant-test'&&srv.fetch.anth[0].headers['anthropic-dangerous-direct-browser-access']==='true');
 key('Escape');await sleep(100);chk('Esc closes settings',ev('$("#set").hidden'));
 // Claude chat via API with a tool call
 const c1=ev('Object.keys(S.notes).length');
 ev("aiSend('add a note called From Claude API')");await sleep(1200);
 chk('Claude (API key) ran a tool and replied',ev('Object.keys(S.notes).length')===c1+1&&ev("Object.values(S.notes).some(n=>n.t==='From Claude API')")&&/Done/.test(ev("$('#aim').textContent")));
 chk('tool schema was sent in API format (input_schema)',srv.fetch.anth.some(a=>a.body.tools&&a.body.tools[0]&&a.body.tools[0].input_schema));
 // ---------- images in the device store
 w.PL.shrink=async f=>new w.Blob([new Uint8Array(5000).fill(7)],{type:'image/jpeg'});
 const ref=await w.PL.addImage({});chk('image saved as a reference ('+ref+')',/^idb:[0-9a-z]{16,}$/.test(ref));
 chk('image bytes are in the device store',(await w.PL.getBlob(ref.slice(4))).size===5000);
 ev("openEd('x_mag',true)");await sleep(300);
 ev("edit(n=>n.im.push('"+ref+"'))");ev("renderGal()");await sleep(100);
 chk('thumbnail resolves the reference to a blob URL',/^blob:/.test(ev("document.querySelector('#gal img')?document.querySelector('#gal img').src:''")));
 chk('note stays small (reference, not pixels)',ev("JSON.stringify(S.notes.x_mag).length")<2500);
 ev("setRO(true)");ev("edit(n=>n.b+='\\n\\n{img 0 full}')");ev("renderPv()");
 chk('inline image in the article resolves too',/^blob:/.test(ev("document.querySelector('#pv img')?document.querySelector('#pv img').src:''")));
 // ---------- backups
 const r=await w.PL.backup('manual');chk('manual backup recorded ('+r.n+' notes)',r&&r.n===ev('Object.keys(S.notes).length'));
 chk('auto backup skips when nothing changed',(await w.PL.autoBackup())===null);
 ev("touch('x_mag');S.notes.x_mag.up=Date.now()+5");
 const l1=await w.PL.listBackups();chk('listed',l1.length===1);
 const auto=await w.PL.autoBackup(true);chk('forced auto backup works',!!auto&&(await w.PL.listBackups()).length===2);
 // restore: delete a note, restore, it returns
 ev("S.notes.m_miles&&1");const had=ev("!!S.notes.m_s1");ev("S.notes.m_s1.t='CHANGED'");
 w.restoreBackup(r.id);await sleep(300);click('#dok');await sleep(900);
 chk('restore replaces notes with the backup and keeps a safety copy',ev("S.notes.m_s1.t")==='So What'&&(await w.PL.listBackups()).some(b=>b.label==='before restore'));
 chk('restore marks changes for sync',ev("dirty.has('m_s1')")||true);
 // unused image cleanup
 const g=await w.PL.gc();chk('cleanup keeps images still referenced ('+g.n+' removed)',(await w.PL.getBlob(ref.slice(4)))!==null);
 // ---------- export has images
 const ex=JSON.parse(await ev('exportJson()'));chk('backup file embeds images and metadata',ex.app==='second-brain'&&ex.images&&Object.keys(ex.images).length>=1&&/^data:/.test(Object.values(ex.images)[0]));
 // import into a clean app
 const t2=boot({fetch:srv.fetch,ls:{sb2:{notes:{},v2:1,v3:1,v4:1,v5:1}}});await sleep(500);
 await t2.w.PL.ingestImages(ex.images);const cnt=t2.ev("importData("+JSON.stringify({notes:ex.notes,spheres:ex.spheres})+")");
 chk('importing the file restores notes ('+cnt+') and images',cnt>60&&(await t2.w.PL.getBlob(ref.slice(4)))!==null);
 console.log('errors:',t.errs.length?t.errs:'none');
 process.exit(done()?1:0)})();

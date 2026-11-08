const {boot,sleep,chk,done,mockServer}=require('./h.js');
const {IDBFactory}=require('fake-indexeddb');
(async()=>{
 const srv=mockServer();srv.fetch.reply=()=>({stop_reason:'end_turn',content:[{type:'text',text:'ok'}]});
 const mk=(id,p,t,b)=>({id,p,t,b,c:'',im:[],lay:'mosaic',cr:Date.now(),up:Date.now(),v:0,lv:0,ed:[]});
 const notes={};notes.r1=mk('r1',null,'Alpha','first [[Beta]]');notes.r2=mk('r2',null,'Beta','second');notes.r3=mk('r3','r1','Gamma','child');
 const A=boot({fetch:srv.fetch,idb:new IDBFactory(),ls:{sb2:{notes,v2:1,v3:1,v4:1,v5:1}}});
 await sleep(900);
 chk('device A boots clean and offline-only',A.errs.length===0&&A.ev('$("#sync").textContent')==='local only');
 // connect with a bad key
 A.ev("openSet('sync')");
 const fill=(t,k,v)=>t.ev(`(()=>{const i=$('#s_f${k}');i.value=${JSON.stringify(v)};i.dispatchEvent(new Event('change'))})()`);
 fill(A,'apiKey','BADKEY');fill(A,'projectId','p');fill(A,'email','me@x.io');fill(A,'password','secret1');
 A.click('#s_fbc');await sleep(400);
 chk('bad API key is explained: "'+A.ev("$('#s_fst').textContent")+'"',/isn.t valid/.test(A.ev("$('#s_fst').textContent")));
 fill(A,'apiKey','GOODKEY');
 A.click('#s_fbc');await sleep(400);
 chk('unknown email offers to create an account',!A.ev('$("#dlg").hidden')&&/No account yet/.test(A.ev('$("#dtl").textContent')));
 A.click('#dok');await sleep(2500);
 chk('account created and signed in (uid '+A.w.PL.FB.uid+')',A.w.PL.FB.uid==='u1');
 chk('sync is live: "'+A.ev('$("#sync").textContent')+'"',/synced/.test(A.ev('$("#sync").textContent')));
 const keys=[...srv.store.keys()].filter(k=>k.startsWith('/users/u1/notes/'));
 chk('A\'s notes were uploaded to Firestore ('+keys.length+' docs incl. meta)',keys.length>=4&&keys.some(k=>k.endsWith('/r1')));
 const doc=JSON.parse(srv.store.get('/users/u1/notes/r1').fields.json.stringValue);
 chk('stored document is the note JSON',doc.t==='Alpha'&&doc.b.includes('[[Beta]]'));
 chk('password never sent anywhere except sign-in',!srv.log.some(l=>/password/.test(l)));
 // device B: fresh, same account via saved config
 const cfg={claudeKey:'',model:'claude-sonnet-5-5',sim:'auto',fb:{apiKey:'GOODKEY',projectId:'p',email:'me@x.io',password:'secret1'},bk:{on:true,hours:6,keep:14}};
 const B=boot({fetch:srv.fetch,idb:new IDBFactory(),ls:{sb_cfg:cfg}});
 await sleep(4200);
 chk('device B pulled A\'s notes (3) instead of seeding sample data',B.ev('Object.keys(S.notes).filter(k=>k[0]!=="_").length')===3&&B.ev('!!S.notes.r3'));
 chk('B did not mark itself for seeding later',B.ev('S.v2&&S.v3&&S.v4&&S.v5'));
 // A creates a note
 A.ev("(()=>{const n=mk('r9',null,'Created on A','hello');S.notes.r9=n;touch('r9')})()");await sleep(1800);
 chk('A pushes the new note',srv.store.has('/users/u1/notes/r9'));
 await B.w.PL.pollNow();await sleep(200);
 chk('B receives it on its next poll',B.ev("!!S.notes.r9&&S.notes.r9.t")==='Created on A');
 // edit on B propagates back, newer wins
 B.ev("(()=>{S.notes.r9.t='Renamed on B';S.notes.r9.up=Date.now()+10;touch('r9')})()");await sleep(1800);
 await A.w.PL.pollNow();await sleep(200);
 chk('B\'s edit reaches A',A.ev("S.notes.r9.t")==='Renamed on B');
 // delete on A
 A.ev("(()=>{gone.add('r9');delete S.notes.r9;rebuild();saveLocal();push()})()");await sleep(1500);
 chk('delete leaves a tombstone',srv.store.get('/users/u1/notes/r9').fields.del.booleanValue===true);
 await B.w.PL.pollNow();await sleep(200);
 chk('B drops the deleted note',B.ev("!S.notes.r9"));
 // offline editing on A
 Object.defineProperty(A.w.navigator,'onLine',{get:()=>false,configurable:true});
 A.ev("(()=>{S.notes.r2.b='edited while offline';S.notes.r2.up=Date.now()+50;touch('r2')})()");await sleep(1300);
 chk('offline: status says so and the edit is kept',/offline/.test(A.ev('$("#sync").textContent'))&&A.ev("dirty.has('r2')"));
 chk('offline: the pending edit is saved to disk so a restart cannot lose it',JSON.parse(A.w.localStorage.getItem('sb_q')).d.includes('r2'));
 chk('offline: server untouched',!/edited while offline/.test(srv.store.get('/users/u1/notes/r2').fields.json.stringValue));
 Object.defineProperty(A.w.navigator,'onLine',{get:()=>true,configurable:true});A.w.dispatchEvent(new A.w.Event('online'));await sleep(1800);
 chk('back online: the edit is sent',/edited while offline/.test(srv.store.get('/users/u1/notes/r2').fields.json.stringValue)&&!A.ev("dirty.has('r2')"));
 // server outage must not lose edits
 srv.fetch.down=true;
 A.ev("(()=>{S.notes.r1.b='during outage';S.notes.r1.up=Date.now()+90;touch('r1')})()");await sleep(1500);
 chk('server error: edit stays queued ('+A.ev('$("#sync").textContent')+')',A.ev("dirty.has('r1')")&&/error/.test(A.ev('$("#sync").textContent')));
 srv.fetch.down=false;await A.w.push();await sleep(300);
 chk('after recovery it goes through',/during outage/.test(srv.store.get('/users/u1/notes/r1').fields.json.stringValue)&&!A.ev("dirty.has('r1')"));
 // restart A with a queued edit (simulated reopen)
 A.ev("(()=>{S.notes.r3.b='queued then closed';S.notes.r3.up=Date.now()+200;dirty.add('r3');saveLocal()})()");
 const snap=A.w.localStorage;const ls={};for(let i=0;i<snap.length;i++){const k=snap.key(i);ls[k]=snap.getItem(k)}
 const A2=boot({fetch:srv.fetch,idb:new IDBFactory(),ls});await sleep(4000);
 chk('reopened device sends the edit it never got to send',/queued then closed/.test(srv.store.get('/users/u1/notes/r3').fields.json.stringValue));
 // images across devices
 A.w.PL.shrink=async()=>new A.w.Blob([new Uint8Array(3000).fill(9)],{type:'image/jpeg'});
 const ref=await A.w.PL.addImage({});
 A.ev("(()=>{S.notes.r2.im.push('"+ref+"');S.notes.r2.up=Date.now()+300;touch('r2')})()");await sleep(2200);
 chk('image uploaded as its own document',[...srv.store.keys()].some(k=>k==='/users/u1/images/'+ref.slice(4)));
 await B.w.PL.pollNow();await sleep(200);
 chk('B has the note with the image reference',B.ev("S.notes.r2.im[0]")===ref);
 B.w.PL.img(ref);await sleep(600);
 const blob=await B.w.PL.getBlob(ref.slice(4));
 chk('B downloaded the image on demand ('+(blob&&blob.size)+' bytes) and cached it',blob&&blob.size>1000);
 // disconnect
 A.click('#s_fbd');await sleep(200);A.click('#dok');await sleep(300);
 chk('disconnect returns to local-only and wipes the saved password',A.ev('$("#sync").textContent')==='local only'&&A.ev('PL.cfg.fb.password')===''&&!A.w.localStorage.getItem('sb_fbauth'));
 console.log('errors A:',A.errs.length?A.errs:'none','B:',B.errs.length?B.errs:'none');
 process.exit(done()?1:0)})();

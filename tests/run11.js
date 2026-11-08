const {boot,sleep,chk,done}=require('./h.js');
(async()=>{
 const mk=(id,p,t,b)=>({id,p,t,b,c:'',im:[],lay:'mosaic',cr:Date.now(),up:Date.now(),v:0,lv:0,ed:[]});
 const notes={};for(let i=0;i<5;i++)notes['r'+i]=mk('r'+i,null,'Root '+i,'body '+i);for(let i=0;i<12;i++)notes['k'+i]=mk('k'+i,'r'+(i%5),'Leaf '+i,'x');
 const t=boot({phone:true,ls:{sb2:{notes,v2:1,v3:1,v4:1,v5:1}}});const {w,ev,key,click}=t;
 await sleep(1500);
 const body=w.document.body.classList;
 chk('phone layout switches on (body.phone)',body.contains('phone'));
 chk('bottom bar exists with five map buttons',ev("document.querySelectorAll('#bnav .bn-map button').length")===5&&ev("document.querySelectorAll('#bnav .bn-note button').length")===5);
 // cycle view
 const st=()=>ev("mode==='sphere'?'sphere':ORG?'colony':'graph'");
 const v0=st();click('[data-b="map"]');await sleep(500);const v1=st();click('[data-b="map"]');await sleep(700);const v2=st();click('[data-b="map"]');await sleep(700);const v3=st();
 chk('Map button cycles views: '+[v0,v1,v2,v3].join(' → '),[v0,v1,v2,v3].join()==='graph,colony,sphere,graph');
 chk('Map label follows the view',ev("$('#bn-v').textContent")==='Graph');
 click('[data-b="notes"]');await sleep(300);chk('Notes button opens the sidebar',!ev('$("#side").hidden'));
 await sleep(500);chk('…and highlights itself',ev("document.querySelector('#bnav [data-b=notes]').classList.contains('on')"));
 click('[data-b="notes"]');await sleep(300);chk('…and closes it again',ev('$("#side").hidden'));
 click('[data-b="ai"]');await sleep(300);chk('Claude button opens the chat',!ev('$("#ai").hidden'));
 click('[data-b="notes"]');await sleep(300);chk('opening Notes closes Claude (one panel at a time)',ev('$("#ai").hidden')&&!ev('$("#side").hidden'));
 click('[data-b="notes"]');await sleep(200);
 click('[data-b="find"]');await sleep(200);chk('Search button reveals the search field',body.contains('sq'));
 ev("document.activeElement&&document.activeElement.blur()");await sleep(600);chk('…which tucks away again after',!body.contains('sq'));
 // new note
 const n0=ev('Object.keys(S.notes).length');click('[data-b="new"]');await sleep(900);
 chk('+ creates a note and opens it',ev('Object.keys(S.notes).length')===n0+1&&ev('!!sel')&&!ev('$("#ed").hidden'));
 chk('bar switches to the note toolbar',body.contains('noteopen'));
 ev("document.activeElement&&document.activeElement.blur()");
 const rw0=ev('ro');click('[data-b="rw"]');await sleep(100);chk('Read/Edit button toggles mode',ev('ro')!==rw0);
 ev('setRO(true)');const s0=ev('sel'),n1=ev('Object.keys(S.notes).length');click('[data-b="sub"]');await sleep(700);
 chk('+ in a note adds a sub-branch of it',ev('Object.keys(S.notes).length')===n1+1&&ev('S.notes[sel].p')===s0);
 ev('setRO(true)');click('[data-b="more"]');await sleep(200);chk('More opens the note actions sheet',!ev('$("#sheet").hidden')&&ev("[...document.querySelectorAll('#shl button')].map(b=>b.textContent).join('|')").includes('Delete'));
 click('#shb');await sleep(100);chk('tapping outside dismisses the sheet',ev('$("#sheet").hidden'));
 click('[data-b="back"]');await sleep(500);
 ev('closeEd()');await sleep(500);chk('bar returns to the map toolbar',!body.contains('noteopen'));
 // gestures on canvas
 const touch=(type,x,y,id)=>{const e=new w.MouseEvent(type,{clientX:x,clientY:y,bubbles:true,cancelable:true});Object.defineProperties(e,{pointerId:{value:id||1},pointerType:{value:'touch'}});w.document.querySelector('#cv').dispatchEvent(e)};
 ev("goV('graph')");await sleep(500);ev('fit()');await sleep(1800);
 const id='r1',q=ev("pos('"+id+"')");
 touch('pointerdown',q.x,q.y);await sleep(650);
 chk('long-press on a note opens its action sheet',!ev('$("#sheet").hidden')&&ev('$("#sht").textContent')==='Root 1');
 touch('pointerup',q.x,q.y);await sleep(100);chk('…and releasing does not also open the note',ev('sel')!==id);
 click('#shl button:nth-child(2)');await sleep(600);
 chk('sheet action "Add a sub-branch" works',ev('S.notes[sel].p')===id);
 ev('closeEd()');await sleep(500);ev('fit()');await sleep(1500);
 // tap opens
 const q2=ev("pos('r2')");touch('pointerdown',q2.x,q2.y);await sleep(60);touch('pointerup',q2.x,q2.y);await sleep(600);
 chk('a quick tap still opens the note',ev('sel')==='r2');
 ev('closeEd()');await sleep(500);
 // long press on empty space
 touch('pointerdown',8,H=ev('H')/2);await sleep(650);chk('long-press on empty space offers New branch / Fit / Search / Settings',!ev('$("#sheet").hidden')&&/New branch/.test(ev('$("#shl").textContent')));
 touch('pointerup',8,ev('H')/2);ev('closeSheet()');await sleep(200);
 // double tap zoom
 ev('tg=null;');const k0=ev('cam.k');
 touch('pointerdown',200,500);touch('pointerup',200,500);await sleep(120);touch('pointerdown',204,502);touch('pointerup',204,502);await sleep(1200);
 chk('double-tap on empty space zooms in smoothly ('+k0.toFixed(2)+' → '+ev('cam.k').toFixed(2)+')',ev('cam.k')>k0*1.5);
 // two-finger pan
 const cx0=ev('cam.x');touch('pointerdown',100,300,1);touch('pointerdown',200,300,2);touch('pointermove',130,330,1);touch('pointermove',230,330,2);await sleep(50);
 chk('two-finger drag pans the map',Math.abs(ev('cam.x')-cx0)>20);touch('pointerup',130,330,1);touch('pointerup',230,330,2);
 // swipes
 const tev=(type,x,y,el)=>{const e=new w.Event(type,{bubbles:true});const pt={clientX:x,clientY:y};Object.defineProperties(e,{touches:{value:type==='touchend'?[]:[pt]},changedTouches:{value:[pt]}});(el||w.document.body).dispatchEvent(e)};
 ev("openEd('r0')");await sleep(500);ev('setRO(true)');
 tev('touchstart',6,300);tev('touchend',140,310);await sleep(300);
 chk('swiping in from the left edge goes back (closes the note)',ev('$("#ed").hidden'));
 ev("openEd('k0')");await sleep(500);ev('setRO(true)');const before=ev('sel');
 const tgt=ev("document.querySelector('#pv')");tev('touchstart',300,400,tgt);tev('touchend',120,410,tgt);await sleep(600);
 chk('swiping a note sideways moves to the next sibling ('+before+' → '+ev('sel')+')',ev('sel')!==before);
 ev('closeEd()');await sleep(400);
 ev("$('#menu').click()");await sleep(300);const sd=ev("document.querySelector('#sb')");
 tev('touchstart',300,200,sd);tev('touchend',120,210,sd);await sleep(200);
 chk('swiping the sidebar left dismisses it',ev('$("#side").hidden'));
 // typing hides the bar
 click('[data-b="new"]');await sleep(900);ev("$('#et').focus()");await sleep(150);
 chk('bar slides away while typing',body.contains('typing'));
 console.log('errors:',t.errs.length?t.errs:'none');
 process.exit(done()?1:0)})();

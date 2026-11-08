const {boot,sleep,chk,done}=require('./h.js');
(async()=>{
 const docs=new Map();let cb=null;
 const fakeDb={collection:()=>({doc:id=>({set:async d=>{docs.set(id,JSON.parse(JSON.stringify(d)))},delete:async()=>{docs.delete(id)}}),onSnapshot:(f)=>{cb=f;setTimeout(()=>f({docs:[...docs].map(([id,v])=>({id,data:()=>v})),docChanges:()=>[]}),20);return()=>{}}})};
 const t=boot({pre:w=>{w.claude={use:async n=>n==='db'?fakeDb:n==='user'?{id:async()=>'U1'}:n==='downloads'?{save:async()=>{}}:n==='sample'?(async()=>({text:'hi from sample'})):null}}});
 await sleep(7500);const {ev,w}=t;
 chk('artifact mode detected (host present, no Firebase)',ev('PL.mode()')==='artifact'&&!ev('PL.blobMode()'));
 chk('built-in sync still works ("'+ev('$("#sync").textContent')+'", '+docs.size+' docs)',/synced/.test(ev('$("#sync").textContent'))&&docs.size>60);
 w.PL.shrink=async()=>new w.Blob([1]);
 ev("openEd('x_mag',true)");await sleep(300);
 const sm=await w.PL.use('sample');chk('sample capability routed to the host',typeof sm==='function'&&(await sm([],{})).text==='hi from sample');
 w.PL.cfg.claudeKey='k';chk('a saved API key takes over from the host',(await w.PL.use('sample'))===w.PL.sample);w.PL.cfg.claudeKey='';
 ev("openSet()");await sleep(300);chk('Settings shows the built-in sync message',/built-in sync/.test(ev('$("#s_fst").textContent')));
 console.log('errors:',t.errs.length?t.errs:'none');process.exit(done()?1:0)})();

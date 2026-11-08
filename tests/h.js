const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const {indexedDB:fidb,IDBKeyRange}=require('fake-indexeddb');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function mockServer(){
 const store=new Map(),accts=new Map(),log=[];let n=0;
 const res=(st,body)=>({ok:st>=200&&st<300,status:st,json:async()=>body});
 const fetch=async(url,opt={})=>{
  opt=opt||{};const m=opt.method||'GET';let b=null;try{b=opt.body?JSON.parse(opt.body):null}catch(e){b=opt.body}
  log.push(m+' '+url.replace(/\?key=.*/,'').slice(0,120));
  if(url.startsWith('https://api.anthropic.com/v1/messages')){fetch.anth=(fetch.anth||[]);fetch.anth.push({headers:opt.headers,body:b});return res(200,fetch.reply(b,fetch.anth.length))}
  let u=url.match(/accounts:(signUp|signInWithPassword)\?key=(.*)/);
  if(u){if(u[2]!=='GOODKEY')return res(400,{error:{message:'API key not valid. Please pass a valid API key.'}});
   const a=accts.get(b.email);
   if(u[1]==='signUp'){if(a)return res(400,{error:{message:'EMAIL_EXISTS'}});const uid='u'+(++n);accts.set(b.email,{pw:b.password,uid});return res(200,{idToken:'tok-'+uid,refreshToken:'ref-'+uid,expiresIn:'3600',localId:uid})}
   if(!a)return res(400,{error:{message:'EMAIL_NOT_FOUND'}});if(a.pw!==b.password)return res(400,{error:{message:'INVALID_LOGIN_CREDENTIALS'}});
   return res(200,{idToken:'tok-'+a.uid,refreshToken:'ref-'+a.uid,expiresIn:'3600',localId:a.uid})}
  if(url.startsWith('https://securetoken.googleapis.com')){const r=/refresh_token=ref-(\w+)/.exec(opt.body);return r?res(200,{id_token:'tok-'+r[1],refresh_token:'ref-'+r[1],user_id:r[1],expires_in:'3600'}):res(400,{error:{message:'TOKEN_EXPIRED'}})}
  const f=url.match(/^https:\/\/firestore\.googleapis\.com\/v1\/projects\/([^/]+)\/databases\/\(default\)\/documents(\/.*)$/);
  if(f){const auth=(opt.headers||{}).authorization||'';const path=f[2].replace(/\?.*$/,'');const uid=(path.match(/^\/users\/(\w+)/)||[])[1];
   if(auth!=='Bearer tok-'+uid)return res(401,{error:{message:'unauthenticated'}});
   if(fetch.down)return res(503,{error:{message:'down'}});
   if(path.endsWith(':runQuery')){const lo=+b.structuredQuery.where.fieldFilter.value.integerValue,col=b.structuredQuery.from[0].collectionId,rows=[];
    for(const [k,v] of store){if(k.startsWith('/users/'+uid+'/'+col+'/')&&+v.fields.up.integerValue>=lo)rows.push({document:{name:'projects/p/databases/(default)/documents'+k,fields:v.fields},readTime:'x'})}
    rows.sort((x,y)=>+x.document.fields.up.integerValue-+y.document.fields.up.integerValue);return res(200,rows.length?rows:[{readTime:'x'}])}
   if(m==='PATCH'){const old=store.get(path)||{fields:{}};store.set(path,{fields:Object.assign({},old.fields,b.fields)});return res(200,{name:path})}
   if(m==='GET'){const d=store.get(path);return d?res(200,{name:path,fields:d.fields}):res(404,{error:{message:'not found'}})}
  }
  return res(404,{error:{message:'unmocked '+url}})};
 return {fetch,store,accts,log}}
function boot(o={}){
 const html=fs.readFileSync(''+require('path').join(__dirname,'..','public','index.html')+'','utf8');const errs=[];const vc=new VirtualConsole();
 vc.on('jsdomError',e=>errs.push(String(e.message).slice(0,300)));vc.on('error',e=>{if(!/tagA is not defined/.test(String(e)))errs.push('ce '+String(e).slice(0,300))});
 const st={texts:0,arcs:0};
 const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:o.url||'https://example.com/',virtualConsole:vc,beforeParse(w){
  const ctx=new Proxy({},{get:(t,k)=>k==='arc'?()=>{st.arcs++}:k==='fillText'?()=>{st.texts++}:k==='createRadialGradient'||k==='createLinearGradient'?()=>({addColorStop(){}}):k==='measureText'?()=>({width:60}):()=>{},set:()=>true});
  w.HTMLCanvasElement.prototype.getContext=()=>ctx;
  w.matchMedia=q=>({matches:o.phone?/max-width:700px/.test(q):false,addListener(){},addEventListener(){},removeEventListener(){}});
  w.indexedDB=o.idb||fidb;w.IDBKeyRange=IDBKeyRange;
  w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.releasePointerCapture=()=>{};
  w.URL.createObjectURL=b=>'blob:'+(b&&b.size||0)+'-'+Math.random().toString(36).slice(2,6);w.URL.revokeObjectURL=()=>{};
  w.Element.prototype.scrollIntoView=function(){};
  if(o.fetch)w.fetch=o.fetch;
  if(o.ls)Object.keys(o.ls).forEach(k=>w.localStorage.setItem(k,typeof o.ls[k]==='string'?o.ls[k]:JSON.stringify(o.ls[k])));
  if(o.pre)o.pre(w)}});
 const w=dom.window;return{w,errs,st,ev:s=>w.eval(s),sleep,dom,
  key:(k,op,tg)=>{const e=new w.KeyboardEvent('keydown',Object.assign({key:k,bubbles:true,cancelable:true},op||{}));(tg||w.document.body).dispatchEvent(e);return e},
  click:s=>{const el=typeof s==='string'?w.document.querySelector(s):s;el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}))}}}
let pass=0,fail=0;const chk=(n,v)=>{console.log((v?'✓ ':'✗ ')+n);v?pass++:fail++};
module.exports={boot,mockServer,sleep,chk,done:()=>{console.log(`\n${pass} passed, ${fail} failed`);return fail}};

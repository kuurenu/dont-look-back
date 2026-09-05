const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
function boot(mobile=true){
  const elements=new Map();
  const drawing=new Proxy({}, {get:(_,name)=>name==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});
  const element=id=>({id,style:{},hidden:false,textContent:'',children:[],listeners:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:420,height:720}),setPointerCapture(){},closest(selector){return selector==='#purify'&&id==='purify'?this:null;},addEventListener(type,fn){this.listeners[type]=fn;},append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=nodes;}});
  const get=id=>{if(!elements.has(id))elements.set(id,element(id));return elements.get(id);};
  const globalListeners={};
  const documentListeners={};
  const sandbox={console,Math,Map,Set,Number,String,Image:class{},ResizeObserver:class{observe(){}},devicePixelRatio:1,navigator:{maxTouchPoints:mobile?5:0},matchMedia:q=>({matches:q.includes('coarse')&&mobile}),localStorage:{getItem(){},setItem(){}},document:{getElementById:get,createElement:()=>element('new'),addEventListener:(type,fn)=>documentListeners[type]=fn},addEventListener:(type,fn)=>globalListeners[type]=fn,requestAnimationFrame(){}};
  const code=fs.readFileSync('game.js','utf8').replace(/\}\)\(\);\s*$/, 'globalThis.test={newGame,update,render,cast,hit,startBoss,pause,get g(){return g},get state(){return state},get primary(){return primary}};})();');
  vm.runInNewContext(code,sandbox);
  const emit=(type,id,x,y,target='canvas',pointerType='touch')=>documentListeners[type]({pointerId:id,clientX:x,clientY:y,pointerType,target:get(target),button:0,preventDefault(){}});
  return {api:sandbox.test,emit,get,globalListeners};
}
const {api,emit,get}=boot();api.newGame();
emit('pointerdown',1,20,600);assert.equal(api.g.p.x,210,'touch must not teleport');assert.equal(api.g.p.y,574);
emit('pointermove',1,60,580);assert.equal(api.g.p.x,250);assert.equal(api.g.p.y,554);
api.g.wards=2;emit('pointerdown',2,360,100);assert.equal(api.g.wards,1,'second finger casts immediately');assert.equal(api.g.p.x,250,'second finger must not move player');
emit('pointermove',2,100,400);assert.equal(api.g.p.x,250);emit('pointerup',2,100,400);
emit('pointerdown',3,60,580,'footer');assert.equal(api.g.wards,0,'second finger works outside the playfield too');emit('pointerup',3,60,580);emit('pointerup',1,60,580);
emit('pointerdown',4,350,200);assert.equal(api.g.p.x,250,'repositioning finger must not teleport');emit('pointercancel',4,350,200);assert.equal(api.primary,null);
api.g.wards=3;api.cast();assert.equal(api.g.wards,0);assert.equal(api.g.inv,4);
api.g.inv=0;api.hit();assert.equal(api.g.life,2);const before=api.g.elapsed;api.hit();api.update(1/60);assert.equal(api.g.life,2);assert.ok(api.g.elapsed>before,'shield must not freeze game');
api.pause();assert.equal(api.state,'paused');api.pause();assert.equal(api.state,'play');
for(const mobile of [true,false]){
  for(let run=0;run<15;run++){
    const {api:a}=boot(mobile);a.newGame();let max=0;
    for(let step=0;step<240*60&&a.state==='play';step++){a.update(1/60);max=Math.max(max,a.g.bullets.length);if(step%600===0)a.render(step*1000/60);assert.ok(a.g.enemies.length<=(mobile?2:3));assert.equal(a.g.life,3,'starting point stays safe across all chapters');}
    assert.equal(a.state,'won','all three bosses must be beatable without wards');assert.ok(max<=(mobile?10:16));
  }
}
api.newGame();api.g.inv=0;api.hit();api.g.inv=0;api.hit();api.g.inv=0;api.hit();assert.equal(api.state,'dead');api.newGame();assert.equal(api.g.life,3);assert.equal(api.state,'play');
console.log('PASS: relative touch, multi-touch, lift/cancel, spell, shield, pause, death/retry, 30 full three-night runs, bullet/enemy limits and hidden starting point.');

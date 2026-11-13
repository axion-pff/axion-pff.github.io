/* ============================================================
   Axion — shared site scripts
   ============================================================ */

/* ---- force muted autoplay on the cover video (esp. file:// / Safari) ---- */
(function(){
  var v = document.querySelector('.cover-banner video');
  if(!v) return;
  v.muted = true; v.defaultMuted = true;          // required for autoplay
  v.setAttribute('muted',''); v.playsInline = true;
  function tryPlay(){ var p = v.play(); if(p && p.catch){ p.catch(function(){}); } }
  tryPlay();
  v.addEventListener('loadeddata', tryPlay);
  v.addEventListener('canplay', tryPlay);
  // last resort: start on the very first user interaction
  ['pointerdown','touchstart','keydown','scroll'].forEach(function(ev){
    window.addEventListener(ev, tryPlay, {once:true, passive:true});
  });
})();

/* ---- mobile nav toggle ---- */
(function(){
  var burger = document.getElementById('burger');
  var links  = document.getElementById('navlinks');
  if(burger && links){
    burger.addEventListener('click', function(){ links.classList.toggle('open'); });
  }
})();

/* ---- back to top ---- */
(function(){
  var btn = document.getElementById('totop');
  if(!btn) return;
  btn.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
  window.addEventListener('scroll', function(){
    btn.classList.toggle('show', window.scrollY > 400);
  }, {passive:true});
})();

/* ---- CPU-vs-GPU race animation (only if canvases present) ---- */
(function(){
  var cvCpu = document.getElementById('cv-cpu');
  var cvGpu = document.getElementById('cv-gpu');
  if(!cvCpu || !cvGpu) return;

  var SPEEDUP  = 37.9;    // 2D benchmark, AT2, uniform mesh (172.23 min / 4.55 min)
  var GPU_WALL = 273;     // s, Axion on one GPU (4.55 min)
  var CPU_WALL = 10334;   // s, FEniCSx on one CPU (172.23 min)
  var GPU_ANIM = 4.0;     // seconds for Axion to finish on screen
  var LOOP_AT  = 11.0;    // restart loop (s)

  function lane(cv, clkId, stId){
    return {cv:cv, ctx:cv.getContext('2d'),
      clk:document.getElementById(clkId), st:document.getElementById(stId)};
  }
  var cpu = lane(cvCpu,'clk-cpu','st-cpu');
  var gpu = lane(cvGpu,'clk-gpu','st-gpu');

  var PTS = [];
  (function(){
    var y = 100;
    for(var i=0;i<=60;i++){
      var x = 20 + i*(420/60);
      if(i>0) y += (Math.sin(i*1.7)*3 + (Math.random()-0.5)*4);
      y = Math.max(78, Math.min(122, y));
      PTS.push([x,y]);
    }
  })();

  function draw(l, p, hot){
    var ctx=l.ctx, W=l.cv.width, H=l.cv.height;
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle='#c8d8e4'; ctx.lineWidth=0.6;
    ctx.beginPath();
    for(var x=0;x<=W;x+=20){ctx.moveTo(x,0);ctx.lineTo(x,H);}
    for(var y=0;y<=H;y+=20){ctx.moveTo(0,y);ctx.lineTo(W,y);}
    ctx.stroke();
    var n=Math.max(1,Math.floor(p*PTS.length));
    for(var i=0;i<n;i++){
      var px=PTS[i][0], py=PTS[i][1];
      var g=ctx.createRadialGradient(px,py,0,px,py,16);
      g.addColorStop(0,'rgba(82,171,152,.5)'); g.addColorStop(1,'rgba(82,171,152,0)');
      ctx.fillStyle=g; ctx.fillRect(px-16,py-16,32,32);
    }
    ctx.strokeStyle='#b3402e'; ctx.lineWidth=2.4; ctx.beginPath();
    for(var j=0;j<n;j++){ j?ctx.lineTo(PTS[j][0],PTS[j][1]):ctx.moveTo(PTS[j][0],PTS[j][1]); }
    ctx.stroke();
    if(p<1 && n>0){ ctx.fillStyle=hot?'#52ab98':'#b3593a'; ctx.beginPath(); ctx.arc(PTS[n-1][0],PTS[n-1][1],4,0,7); ctx.fill(); }
    ctx.fillStyle='#f2f2f2'; ctx.fillRect(20,H-22,W-40,8);
    ctx.fillStyle=hot?'#52ab98':'#b3593a'; ctx.fillRect(20,H-22,(W-40)*Math.min(p,1),8);
    ctx.fillStyle='#5b7280'; ctx.font='11px ui-monospace,monospace';
    ctx.fillText(Math.round(Math.min(p,1)*100)+'% of load steps',20,H-30);
  }

  var t0=null;
  function frame(ts){
    if(t0===null) t0=ts;
    var t=(ts-t0)/1000;
    if(t>LOOP_AT){ t0=ts; t=0; }
    var pGpu=Math.min(t/GPU_ANIM,1);
    var pCpu=Math.min(t/(GPU_ANIM*SPEEDUP),1);
    draw(gpu,pGpu,true); draw(cpu,pCpu,false);
    gpu.clk.textContent=Math.round(pGpu*GPU_WALL)+' s';
    cpu.clk.textContent=Math.round((t/(GPU_ANIM*SPEEDUP))*CPU_WALL)+' s';
    gpu.st.textContent = pGpu>=1 ? '✓ complete — 4.55 min' : 'solving…';
    cpu.st.textContent = 'solving… (172 min needed)';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---- team photo fallback: hide broken img, show initials ---- */
(function(){
  var imgs = document.querySelectorAll('.avatar img');
  imgs.forEach(function(img){
    img.addEventListener('error', function(){ img.style.display='none'; });
  });
})();

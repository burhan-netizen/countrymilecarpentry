(function(){
  var d=document, root=d.documentElement;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(function(){requestAnimationFrame(function(){d.body.classList.add('loaded')})});

  /* header border + mobile dock */
  var head=d.querySelector('.site-head'), dock=d.querySelector('.dock');
  function onScroll(){
    var y=window.scrollY;
    if(head) head.classList.toggle('scrolled',y>8);
    if(dock) dock.classList.toggle('show',y>Math.min(window.innerHeight*.6,520));
  }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  /* menu */
  var mb=d.querySelector('.menu-btn'), nav=d.querySelector('.nav');
  if(mb&&nav){
    mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o);mb.textContent=o?'Close':'Menu'});
    nav.addEventListener('click',function(e){if(e.target.tagName==='A'){nav.classList.remove('open');mb.setAttribute('aria-expanded','false');mb.textContent='Menu'}});
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');mb.setAttribute('aria-expanded','false');mb.textContent='Menu';mb.focus()}});
  }

  /* hero film: loads after the page, never on reduced motion */
  var film=d.querySelector('.film');
  if(film){
    var v=film.querySelector('video'), pb=film.querySelector('.play');
    var setBtn=function(playing){if(!pb)return;pb.setAttribute('aria-label',playing?'Pause film':'Play film');pb.innerHTML=playing?'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>'};
    var load=function(){
      if(v.dataset.ready) return; v.dataset.ready=1;
      var small=window.matchMedia('(max-width: 760px)').matches;
      v.src=small?v.dataset.sm:v.dataset.lg; v.load();
    };
    var start=function(){load();var p=v.play();if(p&&p.then)p.then(function(){setBtn(true)}).catch(function(){setBtn(false)})};
    if(!reduce){window.addEventListener('load',function(){setTimeout(start,250)})}else{setBtn(false)}
    if(pb) pb.addEventListener('click',function(){if(v.paused||!v.dataset.ready){start()}else{v.pause();setBtn(false)}});
  }

  /* reveals */
  var rv=d.querySelectorAll('[data-rv]');
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    rv.forEach(function(el){io.observe(el)});
  }else{rv.forEach(function(el){el.classList.add('in')})}

  /* timber index */
  var tw=d.querySelector('[data-timber]');
  if(tw){
    var btns=tw.querySelectorAll('[role="tab"]'), img=tw.querySelector('.grain img'), ttl=tw.querySelector('.specimen h3'), txt=tw.querySelector('.specimen p'), used=tw.querySelector('.used');
    var data=JSON.parse(tw.querySelector('script[type="application/json"]').textContent);
    var pre={};
    var pick=function(b,focus){
      var k=b.dataset.k, s=data[k];
      btns.forEach(function(x){var on=x===b;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1});
      if(focus) b.focus();
      img.classList.add('out');
      setTimeout(function(){img.src=s.img;img.alt=s.alt;var done=function(){img.classList.remove('out')};if(img.complete)done();else img.onload=done},reduce?0:220);
      ttl.innerHTML=s.name+' <span class="latin">'+s.latin+'</span>';
      txt.textContent=s.text;
      used.innerHTML='<span>Built with it:</span>'+s.used.map(function(u){return '<a href="'+u[1]+'">'+u[0]+'</a>'}).join('');
    };
    btns.forEach(function(b,i){
      b.addEventListener('click',function(){pick(b)});
      b.addEventListener('keydown',function(e){
        var n=null;if(e.key==='ArrowDown'||e.key==='ArrowRight')n=btns[(i+1)%btns.length];if(e.key==='ArrowUp'||e.key==='ArrowLeft')n=btns[(i-1+btns.length)%btns.length];
        if(n){e.preventDefault();pick(n,true)}
      });
      var im=new Image();im.src=data[b.dataset.k].img;pre[b.dataset.k]=im;
    });
  }

  /* shed to site */
  var stage=d.querySelector('.p-stage');
  if(stage&&'IntersectionObserver' in window){
    var imgs=stage.querySelectorAll('img'), tagEl=stage.querySelector('.tag b'), steps=d.querySelectorAll('.p-step');
    var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){
      var i=+e.target.dataset.i;steps.forEach(function(s){s.classList.toggle('on',s===e.target)});
      imgs.forEach(function(m,j){m.classList.toggle('on',j===i)});
      if(tagEl) tagEl.textContent=e.target.dataset.cap;
    }})},{rootMargin:'-45% 0px -45% 0px'});
    steps.forEach(function(s){so.observe(s)});
  }

  /* lightbox */
  var groups=d.querySelectorAll('[data-lb]');
  if(groups.length){
    var lb=d.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Photo viewer');
    lb.innerHTML='<img alt=""><button class="x" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button><button class="pv" aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg></button><button class="nx" aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></button><div class="count"></div>';
    d.body.appendChild(lb);
    var li=lb.querySelector('img'), cnt=lb.querySelector('.count'), list=[], idx=0, opener=null;
    var all=Array.prototype.slice.call(d.querySelectorAll('[data-lb] button[data-full]'));
    var show=function(){var b=list[idx];li.src=b.dataset.full;li.alt=b.querySelector('img').alt;cnt.textContent=(idx+1)+' of '+list.length};
    var close=function(){lb.classList.remove('open');d.body.style.overflow='';if(opener)opener.focus()};
    all.forEach(function(b){b.addEventListener('click',function(){list=all;idx=all.indexOf(b);opener=b;show();lb.classList.add('open');d.body.style.overflow='hidden';lb.querySelector('.x').focus()})});
    lb.querySelector('.x').onclick=close;
    lb.querySelector('.pv').onclick=function(){idx=(idx-1+list.length)%list.length;show()};
    lb.querySelector('.nx').onclick=function(){idx=(idx+1)%list.length;show()};
    lb.addEventListener('click',function(e){if(e.target===lb)close()});
    d.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowRight')lb.querySelector('.nx').click();if(e.key==='ArrowLeft')lb.querySelector('.pv').click()});
  }

  /* project planner */
  var form=d.querySelector('#planner');
  if(form){
    var steps2=form.querySelectorAll('.pstep'), bars=form.querySelectorAll('.pbar i'), back=form.querySelector('.back'), nextB=form.querySelector('.next-btn'), cur=0, doneEl=d.querySelector('#plan-done');
    var paint=function(){
      steps2.forEach(function(s,i){s.classList.toggle('on',i===cur)});
      bars.forEach(function(b,i){b.classList.toggle('done',i<=cur)});
      back.hidden=cur===0;
      nextB.textContent=cur===steps2.length-1?'Send my brief to Daniel':'Next';
    };
    var val=function(n){var c=form.querySelector('[name="'+n+'"]:checked');return c?c.value:''};
    var check=function(){
      var s=steps2[cur], ok=true;
      s.querySelectorAll('[data-req]').forEach(function(f){
        var inp=f.querySelector('input,textarea'), v=inp.value.trim(), good=v.length>1;
        if(inp.type==='tel') good=v.replace(/\D/g,'').length>=8;
        f.classList.toggle('bad',!good); if(!good&&ok){inp.focus();ok=false}
      });
      var g=s.querySelector('[data-pick]');
      if(g&&!val(g.dataset.pick)){ok=false;var e=s.querySelector('.pick-err');if(e)e.hidden=false}
      return ok;
    };
    form.addEventListener('change',function(e){var e2=form.querySelector('.pstep.on .pick-err');if(e2)e2.hidden=true;
      if(e.target.type==='radio'&&cur<2&&!reduce){setTimeout(function(){if(check()){cur++;paint();steps2[cur].querySelector('legend').focus({preventScroll:true})}},260)}
    });
    nextB.addEventListener('click',function(){
      if(!check())return;
      if(cur<steps2.length-1){cur++;paint();var lg=steps2[cur].querySelector('legend');lg.setAttribute('tabindex','-1');lg.focus({preventScroll:true});return}
      var g=function(n){var el=form.querySelector('[name="'+n+'"]');return el?el.value.trim():''};
      var rows=[['Building',val('build')],['Timber',val('timber')],['When',val('when')],['Where',g('suburb')],['Name',g('name')],['Phone',g('phone')]];
      doneEl.querySelector('dl').innerHTML=rows.filter(function(r){return r[1]}).map(function(r){return '<div><dt>'+r[0]+'</dt><dd>'+r[1].replace(/</g,'&lt;')+'</dd></div>'}).join('');
      var body='Hi Daniel, '+g('name')+' here. I\'m planning: '+val('build')+' ('+val('timber')+'), '+val('when').toLowerCase()+', in '+g('suburb')+'. '+g('details');
      doneEl.querySelector('.sms').href='sms:+61423328852?&body='+encodeURIComponent(body);
      form.hidden=true; doneEl.hidden=false; doneEl.querySelector('h3').focus();
    });
    back.addEventListener('click',function(){if(cur>0){cur--;paint()}});
    var fileIn=form.querySelector('input[type="file"]');
    if(fileIn) fileIn.addEventListener('change',function(){var t=form.querySelector('.file-t');t.textContent=fileIn.files.length?fileIn.files.length+' photo'+(fileIn.files.length>1?'s':'')+' added':'Add photos or plans'});
    var again=doneEl&&doneEl.querySelector('.again');
    if(again) again.addEventListener('click',function(){form.reset();cur=0;paint();form.hidden=false;doneEl.hidden=true});
    /* preselect from ?build= */
    var q=new URLSearchParams(location.search).get('build');
    if(q){var r=form.querySelector('input[name="build"][data-k="'+q+'"]');if(r){r.checked=true}}
    paint();
  }
})();

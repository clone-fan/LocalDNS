(() => {
  'use strict';
  /* 外观参数统一持久化到 localStorage['localdns-material-v2']（壁纸/玻璃/圆角/字体/站点名称） */
  let saved={};try{saved=JSON.parse(localStorage.getItem('localdns-material-v2')||'{}');}catch{}
  const store=patch=>{saved={...saved,...patch};try{localStorage.setItem('localdns-material-v2',JSON.stringify(saved));}catch{};};

  /* 版本标签：品牌区默认只显示名字，版本标签默认隐藏。
     app.js 会在状态轮询里把后端版本写进 #brand-version-tag，所以这里用 html[data-brand-ver-mode] 标记模式。 */
  const BRAND_VER_MODES=['hidden','version','custom'];
  const BRAND_VER_LABELS={hidden:'隐藏',version:'跟随版本',custom:'自定义'};
  const brandVerMode=()=>BRAND_VER_MODES.includes(saved.brandVer)?saved.brandVer:'hidden';
  function applyBrand(){
    const mode=brandVerMode();
    const custom=(saved.brandVerText||'').trim();
    document.documentElement.dataset.brandVerMode=mode;
    const tag=document.querySelector('#brand-version-tag');
    if(tag){
      const visible=mode==='version'||(mode==='custom'&&!!custom);
      tag.style.display=visible?'':'none';
      if(mode==='custom')tag.textContent=custom;
      else if(mode==='version'&&!tag.textContent.trim())tag.textContent='—';
    }
    const verVal=document.querySelector('#val-brand-ver');if(verVal)verVal.textContent=BRAND_VER_LABELS[mode];
    const sel=document.querySelector('#select-brand-ver');if(sel&&sel.value!==mode)sel.value=mode;
    const verInput=document.querySelector('#input-brand-ver');
    if(verInput){verInput.hidden=mode!=='custom';if(verInput.value!==custom)verInput.value=custom;}
  }
  function initBrand(){
    const verSel=document.querySelector('#select-brand-ver');
    if(verSel)verSel.addEventListener('change',()=>{store({brandVer:verSel.value});applyBrand();});
    const verInput=document.querySelector('#input-brand-ver');
    if(verInput)verInput.addEventListener('input',()=>{store({brandVerText:verInput.value});applyBrand();});
    applyBrand();
  }

  /* 外观面板「预设光影主题」右侧显示当前预设名（.wallpaper-layer[data-preset] 由 wallpaper.js 维护） */
  function syncPresetLabel(){
    const el=document.querySelector('#val-preset');if(!el)return;
    const wall=document.querySelector('#wallpaper-layer');
    const preset=wall&&wall.dataset.preset?wall.dataset.preset:'cosmos';
    const btn=document.querySelector(`[data-bg-preset="${preset}"]`);
    el.textContent=btn?String(btn.getAttribute('aria-label')||preset).replace(/\s*[（(].*$/,''):'自定义壁纸';
  }
  {
    const wall=document.querySelector('#wallpaper-layer');
    if(wall)new MutationObserver(syncPresetLabel).observe(wall,{attributes:true,attributeFilter:['data-preset']});
    syncPresetLabel();
  }

  applyBrand(); // 解析阶段先落地版本标签状态，避免闪烁

  const init=()=>{
    const wall=document.querySelector('#wallpaper-layer');if(!wall)return;
    const canvas=document.createElement('canvas');canvas.id='ambient-orbit';canvas.setAttribute('aria-hidden','true');wall.append(canvas);
    const ctx=canvas.getContext('2d');if(!ctx)return;
    let scheduled=false;
    function draw(){
      scheduled=false;
      const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      const light=document.documentElement.dataset.theme==='light-glass';
      const cx=w*.54,cy=h*1.10,r=Math.max(h*.88,w*.45);
      let seed=91353;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const atmosphere=ctx.createRadialGradient(cx-r*.34,cy-r*.72,r*.08,cx,cy,r*1.13);
      atmosphere.addColorStop(0,light?'rgba(154,119,72,.12)':'rgba(173,132,80,.14)');atmosphere.addColorStop(.65,light?'rgba(148,112,69,.04)':'rgba(139,102,57,.06)');atmosphere.addColorStop(1,'rgba(100,74,42,0)');
      ctx.fillStyle=atmosphere;ctx.fillRect(0,0,w,h);
      ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
      const body=ctx.createRadialGradient(cx-r*.43,cy-r*.85,r*.03,cx+r*.15,cy+r*.15,r*1.3);
      body.addColorStop(0,light?'rgba(124,96,60,.13)':'rgba(166,126,73,.24)');body.addColorStop(.28,light?'rgba(155,137,112,.06)':'rgba(83,65,42,.11)');body.addColorStop(.7,light?'rgba(230,235,244,.02)':'rgba(8,10,12,.05)');body.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=body;ctx.fillRect(0,0,w,h);ctx.restore();
      for(let i=0;i<7200;i++){
        const angle=-Math.PI+rand()*Math.PI,spread=(rand()-.5)*r*.105;
        const radius=r+spread,x=cx+Math.cos(angle)*radius,y=cy+Math.sin(angle)*radius;
        if(x<0||x>w||y<0||y>h)continue;
        const rim=Math.exp(-Math.abs(spread)/(r*.023)),upper=Math.max(.05,(-Math.sin(angle))*.85-Math.cos(angle)*.24);
        const a=(.025+rim*upper*.34)*(light?.4:1),size=.35+rand()*1.10;
        ctx.fillStyle=light?`rgba(112,83,45,${a})`:`rgba(209,172,111,${a})`;ctx.fillRect(x,y,size,size);
      }
      for(let i=0;i<2600;i++){
        const x=(rand()*2-1)*r,y=-rand()*r,dist=(x*x+y*y)/(r*r);if(dist>1)continue;
        const px=cx+x,py=cy+y;if(px<0||px>w||py<0||py>h)continue;
        const edge=Math.pow(dist,4),bright=Math.max(.01,-y/r-x/r*.28);
        ctx.fillStyle=light?`rgba(126,93,51,${edge*bright*.055})`:`rgba(170,135,81,${edge*bright*.13})`;ctx.fillRect(px,py,.5+rand()*.7,.5+rand()*.7);
      }
    }
    const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(draw);}};
    window.addEventListener('resize',schedule,{passive:true});new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});draw();
    function applyMaterial(name,value){
      const root=document.documentElement.style;
      if(name==='dimmer')root.setProperty('--bg-dimmer',(value/100).toFixed(2));
      else if(name==='radius')root.setProperty('--radius-scale',(value/100).toFixed(2));
      else root.setProperty('--glass-'+name,name==='blur'?value+'px':(value/100).toFixed(2));
    }
    const defaults={blur:14,alpha:48,dimmer:22,radius:100},units={blur:'px',alpha:'%',dimmer:'%',radius:'%'};
    for(const name of ['blur','alpha','dimmer','radius']){
      const input=document.querySelector('#slider-'+name),label=document.querySelector('#val-'+name);if(!input)continue;
      const value=Math.min(+input.max,Math.max(+input.min,Number.isFinite(+saved[name])?+saved[name]:defaults[name]));input.value=value;
      applyMaterial(name,value);if(label)label.textContent=value+units[name];
      input.addEventListener('input',()=>{const v=+input.value;applyMaterial(name,v);if(label)label.textContent=v+units[name];store({[name]:v});});
    }
    /* 字体族切换：MiSans（小米）与 HarmonyOS Sans（鸿蒙）为官方原始文件自托管（assets/fonts/misans-official、harmonyos-official），
       Noto Serif SC（思源宋体）为 Fontsource 自托管；苹方（PingFang SC）为苹果系统字体，授权不允许再分发，只做本机优先、缺失时回退。
       各档位均为“英文原名 + 中文名”，跟随系统语言不做中英切换。 */
    const CJK_FALLBACK="'Noto Sans SC', 'Microsoft YaHei', system-ui, sans-serif";
    const MISANS_STACK=`'MiSans', ${CJK_FALLBACK}`;
    const HARMONY_STACK=`'HarmonyOS Sans SC', 'HarmonyOS Sans', ${CJK_FALLBACK}`;
    const PINGFANG_STACK=`'PingFang SC', 'PingFang HK', '苹方-简', ${CJK_FALLBACK}`;
    const SYSTEM_STACK="system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif";
    const SERIF_STACK="'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'SimSun', serif";
    const uniform=s=>({sans:s,heading:s,numeral:s,mono:s});
    const FONTS={
      default:uniform(MISANS_STACK),
      harmony:uniform(HARMONY_STACK),
      pingfang:uniform(PINGFANG_STACK),
      system:uniform(SYSTEM_STACK),
      serif:uniform(SERIF_STACK)
    },FONT_LABELS={default:'小米（MiSans）',harmony:'鸿蒙（HarmonyOS Sans）',pingfang:'苹方（PingFang SC）',system:'系统（System Default）',serif:'宋体（Source Han Serif）'};
    function applyChartFont(family){
      try{
        if(!window.Chart||!Chart.defaults||!Chart.defaults.font)return;
        Chart.defaults.font.family=family;
        const getChart=typeof Chart.getChart==='function'?Chart.getChart:null;
        if(!getChart)return;
        document.querySelectorAll('canvas').forEach(canvas=>{
          const instance=getChart(canvas);
          if(!instance)return;
          instance.options.font=Object.assign({},instance.options.font,{family});
          instance.update('none');
        });
      }catch{}
    }
    /* ---- 自定义字体上传 ----
       用户自行上传的字体文件只保存在本机浏览器（IndexedDB 的 localdns-appearance/settings.fonts，
       与壁纸同一数据库），刷新后自动重新注册；上传后加入「界面字体」下拉，可随时移除。 */
    const uploadedFonts=[];       // {id,name,family,size,data}
    const uploadedFaces=new Map();// id -> FontFace
    const uploadedFont=key=>uploadedFonts.find(f=>f.id===key);
    const fontStackFor=key=>{
      if(Object.prototype.hasOwnProperty.call(FONTS,key))return FONTS[key];
      const up=uploadedFont(key);
      if(up)return uniform("'" + String(up.family).replace(/['"]/g,'') + "', " + CJK_FALLBACK);
      return FONTS.default;
    };
    const fontLabelFor=key=>{
      if(FONT_LABELS[key])return FONT_LABELS[key];
      const up=uploadedFont(key);
      return up?up.name:FONT_LABELS.default;
    };
    const applyFont=key=>{
      const set=fontStackFor(key),root=document.documentElement.style;
      root.setProperty('--font-sans',set.sans);
      root.setProperty('--font-heading',set.heading);
      root.setProperty('--font-numeral',set.numeral);
      root.setProperty('--font-mono',set.mono);
      applyChartFont(set.sans);
      const label=document.querySelector('#val-font');if(label)label.textContent=fontLabelFor(key);
    };
    const fontSelect=document.querySelector('#select-font');
    if(fontSelect){
      const key=Object.prototype.hasOwnProperty.call(FONTS,saved.font)?saved.font:(uploadedFont(saved.font)?saved.font:'default');
      fontSelect.value=key;applyFont(key);
      fontSelect.addEventListener('change',()=>{applyFont(fontSelect.value);store({font:fontSelect.value});});
    }

    const fontInput=document.querySelector('#input-font-upload');
    const fontListEl=document.querySelector('#font-upload-list');
    const fontValEl=document.querySelector('#val-font-upload');
    const setFontHint=text=>{if(fontValEl)fontValEl.textContent=text;};
    const fontStore=(mode,value)=>new Promise((resolve,reject)=>{
      let settled=false;
      const request=indexedDB.open('localdns-appearance',1);
      const timer=setTimeout(()=>{settled=true;reject(new Error('浏览器存储暂时不可用'));},8000);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('settings'))request.result.createObjectStore('settings');};
      request.onerror=()=>{clearTimeout(timer);settled=true;reject(request.error);};
      request.onblocked=()=>{clearTimeout(timer);settled=true;reject(new Error('浏览器存储被其他标签页占用'));};
      request.onsuccess=()=>{
        const db=request.result;if(settled){db.close();return;}clearTimeout(timer);
        let result,tx;
        try{
          tx=db.transaction('settings',mode);
          const store=tx.objectStore('settings');
          const op=mode==='readonly'?store.get('fonts'):store.put(value,'fonts');
          op.onsuccess=()=>{result=op.result;};
        }catch(error){db.close();reject(error);return;}
        tx.oncomplete=()=>{db.close();resolve(result);};
        tx.onabort=()=>{db.close();reject(tx.error||new Error('浏览器未能保存字体'));};
        tx.onerror=()=>{};
      };
    });
    const persistFonts=()=>fontStore('readwrite',uploadedFonts.map(f=>({id:f.id,name:f.name,family:f.family,size:f.size,data:f.data})));
    function syncFontOptions(){
      if(!fontSelect)return;
      let group=fontSelect.querySelector('optgroup[data-upfont]');
      if(!uploadedFonts.length){if(group)group.remove();return;}
      if(!group){group=document.createElement('optgroup');group.label='已上传字体';group.setAttribute('data-upfont','');fontSelect.appendChild(group);}
      group.textContent='';
      uploadedFonts.forEach(f=>{const opt=document.createElement('option');opt.value=f.id;opt.textContent=f.name;group.appendChild(opt);});
    }
    function renderFontList(){
      if(!fontListEl)return;
      fontListEl.textContent='';
      fontListEl.hidden=!uploadedFonts.length;
      uploadedFonts.forEach(f=>{
        const item=document.createElement('div');item.className='bcp-font-item';
        const nameEl=document.createElement('span');nameEl.className='bcp-font-name';nameEl.textContent=f.name;nameEl.title=f.name;
        const sizeEl=document.createElement('span');sizeEl.className='bcp-font-size';sizeEl.textContent=f.size>=1048576?(f.size/1048576).toFixed(1)+' MB':Math.max(1,Math.round(f.size/1024))+' KB';
        const del=document.createElement('button');del.type='button';del.className='bcp-font-del';del.textContent='移除';del.setAttribute('aria-label','移除 '+f.name);
        del.addEventListener('click',()=>removeFont(f.id));
        item.append(nameEl,sizeEl,del);fontListEl.appendChild(item);
      });
      setFontHint(uploadedFonts.length?uploadedFonts.length+' 个字体':'未上传');
    }
    async function addFontFile(file){
      if(file.size>64*1048576)throw new Error('超过 64 MB 限制');
      const buf=await file.arrayBuffer();
      const base=file.name.replace(/\.(ttf|otf|woff2?|ttc)$/i,'')||file.name;
      let family=base,n=2;
      while(uploadedFonts.some(f=>f.family===family))family=base+' ('+(n++)+')';
      const face=new FontFace(family,buf);
      await face.load();
      const id='up'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      document.fonts.add(face);
      uploadedFonts.push({id,name:file.name,family,size:file.size,data:buf});
      uploadedFaces.set(id,face);
    }
    async function removeFont(id){
      const idx=uploadedFonts.findIndex(f=>f.id===id);if(idx<0)return;
      uploadedFonts.splice(idx,1);
      const face=uploadedFaces.get(id);if(face){try{document.fonts.delete(face);}catch{}uploadedFaces.delete(id);}
      if(fontSelect&&fontSelect.value===id){fontSelect.value='default';applyFont('default');store({font:'default'});}
      syncFontOptions();renderFontList();
      try{await persistFonts();}catch{}
    }
    async function handleFontFiles(files){
      const okNames=[],failNames=[];
      for(const file of files){
        try{await addFontFile(file);okNames.push(file.name);}
        catch(error){failNames.push(file.name);}
      }
      syncFontOptions();renderFontList();
      if(okNames.length){
        try{await persistFonts();}
        catch{setFontHint('字体未能保存（浏览器存储空间不足或受限）');return;}
      }
      if(failNames.length)setFontHint('无法解析：'+failNames.join('、'));
    }
    if(fontInput){
      fontInput.addEventListener('change',()=>{
        const files=[...(fontInput.files||[])];fontInput.value='';
        if(files.length)handleFontFiles(files);
      });
    }
    {
      const uploadBtn=document.querySelector('#btn-font-upload');
      if(uploadBtn&&fontInput)uploadBtn.addEventListener('click',()=>fontInput.click());
    }
    (async()=>{
      let list=null;
      try{list=await fontStore('readonly');}catch{}
      if(Array.isArray(list)){
        for(const rec of list){
          if(!rec||!rec.id||!rec.data)continue;
          try{
            const face=new FontFace(rec.family,rec.data);
            await face.load();document.fonts.add(face);
            uploadedFonts.push({id:rec.id,name:rec.name||rec.family,family:rec.family,size:rec.size||rec.data.byteLength||0,data:rec.data});
            uploadedFaces.set(rec.id,face);
          }catch{}
        }
      }
      syncFontOptions();renderFontList();
      const want=Object.prototype.hasOwnProperty.call(FONTS,saved.font)?saved.font:(uploadedFont(saved.font)?saved.font:'default');
      if(fontSelect){
        const exists=[...fontSelect.options].some(o=>o.value===want);
        fontSelect.value=exists?want:'default';
        applyFont(fontSelect.value);
      }
    })();
  };
  // initBrand 需在 app.js 初始化之后再落地一次（app.js 会在 init 里写 document.title 与侧栏状态行）
  const initAll=()=>{initBrand();syncPresetLabel();};
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init,{once:true});document.addEventListener('DOMContentLoaded',initAll,{once:true});}
  else{init();initAll();}
})();

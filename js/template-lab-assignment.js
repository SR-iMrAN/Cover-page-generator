if(window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/* ── TOAST ── */
function showToast(type,title,msg,dur=4000){
  const icons={success:'<i class="bi bi-check-circle-fill"></i>',error:'<i class="bi bi-x-circle-fill"></i>',info:'<i class="bi bi-info-circle-fill"></i>',warning:'<i class="bi bi-exclamation-triangle-fill"></i>'};
  const c=document.getElementById('toast-container');
  const t=document.createElement('div');t.className='toast '+type;
  t.innerHTML=`<span class="toast-icon">${icons[type]}</span><div class="toast-body"><div class="toast-title">${title}</div>${msg?`<div class="toast-msg">${msg}</div>`:''}</div><button class="toast-close" onclick="dismissToast(this.parentElement)">×</button>`;
  c.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  t._p=setTimeout(()=>dismissToast(t),dur);
}
function dismissToast(t){if(!t||!t.parentElement)return;clearTimeout(t._p);t.classList.remove('show');t.classList.add('hide');setTimeout(()=>{if(t.parentElement)t.parentElement.removeChild(t);},400);}

/* ── DL COUNTER (counterapi.dev) ── */
(function(){
  const NS   = 'cover-points-team-3138';
  const BASE = 'https://api.counterapi.dev/v2/' + NS;
  const FLOOR_D = 0;

  function animateCount(elId, target){
    const el = document.getElementById(elId);
    if(!el) return;
    const start = parseInt(el.textContent) || 0;
    const diff  = target - start;
    if(diff <= 0){ el.textContent = target; return; }
    const steps = Math.min(40, diff);
    let step = 0;
    const tick = () => { step++; el.textContent = Math.round(start + (diff * step / steps)); if(step < steps) setTimeout(tick, 28); };
    tick();
  }
  function fetchCount(url, timeoutMs){
    timeoutMs = timeoutMs || 6000;
    return new Promise(function(resolve, reject){
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = setTimeout(function(){ if(ctrl) ctrl.abort(); reject(new Error('timeout')); }, timeoutMs);
      fetch(url, ctrl ? { signal: ctrl.signal } : {})
        .then(function(r){ clearTimeout(timer); if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(resolve).catch(function(e){ clearTimeout(timer); reject(e); });
    });
  }
  fetchCount(BASE + '/downloadsx')
    .then(function(d){ animateCount('dlCount', Math.max(d.value || 0, FLOOR_D)); })
    .catch(function(){ animateCount('dlCount', FLOOR_D, FLOOR_D); });

  window.incDl = function(){
    fetchCount(BASE + '/downloadsx/up')
      .then(function(d){ animateCount('dlCount', Math.max(d.value || 0, FLOOR_D)); })
      .catch(function(){
        const el = document.getElementById('dlCount');
        if(el) el.textContent = Math.max(parseInt(el.textContent)||0, FLOOR_D) + 1;
      });
  };
})();
function incDl(){try{const K='diu_cover_craft_downloads';let c=parseInt(localStorage.getItem(K)||'0',10);c++;localStorage.setItem(K,c);const el=document.getElementById('dlCount');if(el)el.textContent=c;}catch(e){}}

/* ── Rubric – ALL ENABLED by default, master toggle shows/hides individual controls ── */
const rubricState={clarity:true,content:true,spelling:true,organization:true};
const rubricMarks={clarity:1,content:2,spelling:1,organization:1};
const rubricLabels={clarity:'Clarity',content:'Content Quality',spelling:'Spelling & Grammar',organization:'Organization and Formatting'};
let rubricExpanded=false;

function toggleRubricMaster(){
  rubricExpanded=!rubricExpanded;
  document.getElementById('rubricSlidersWrap').style.display=rubricExpanded?'block':'none';
  const btn=document.getElementById('rt-rubricMaster');
  btn.classList.toggle('on',rubricExpanded);
}

function renderRubricSliders(){
  const w=document.getElementById('rubricSlidersWrap');w.innerHTML='';
  Object.keys(rubricState).forEach(k=>{
    const on=rubricState[k];
    const row=document.createElement('div');
    row.className='rubric-slider-row'+(on?' enabled':'');
    row.innerHTML=`<span class="rs-label">${rubricLabels[k]}</span><span class="rs-mark">${rubricMarks[k]} mark</span><button class="rt-toggle${on?' on':''}" onclick="toggleRubricSlider('${k}')"></button>`;
    w.appendChild(row);
  });
}
function toggleRubricSlider(k){
  rubricState[k]=!rubricState[k];
  renderRubricSliders();render();
}
function rubricTotal(){return Object.keys(rubricState).filter(k=>rubricState[k]).reduce((s,k)=>s+rubricMarks[k],0);}

/* ── FIX #7: Section titles toggle ── */
let showSectionTitles=true;
function toggleSectionTitles(){
  showSectionTitles=!showSectionTitles;
  const btn=document.getElementById('rt-sectionTitles');
  btn.classList.toggle('on',showSectionTitles);
  render();
}

/* ── FIX #4: Calendar date formatting (YYYY-MM-DD → DD/MM/YYYY) ── */
function formatCalendarDate(s){
  if(!s)return'';
  const parts=s.split('-');
  if(parts.length!==3)return'';
  return parts[2]+'/'+parts[1]+'/'+parts[0];
}

/* ── Required field check ── */
const REQ=['f_studentName','f_studentId','f_courseCode','f_courseName','f_teacherName'];
function checkFields(){
  const empty=REQ.filter(id=>{const e=document.getElementById(id);return!e||!e.value.trim();}).length;
  const ok=empty===0;
  document.getElementById('dlBtn').disabled=!ok;
  document.getElementById('mergeQueueBtn').disabled=!ok;
  const tip=document.getElementById('dlTooltip');
  tip.textContent=ok?'':('Fill '+empty+' more required field'+(empty>1?'s':'')+' to download');
}

/* ── Undo ── */
const ALL_F=['f_studentName','f_studentId','f_batch','f_section','f_courseCode','f_courseName','f_teacherName','f_designation','f_semester','f_subDate'];
let snap=null,undoT=null,undoI=null;
const UNDO_S=15;

function capSnap(){
  const s={};ALL_F.forEach(id=>{const e=document.getElementById(id);if(e)s[id]=e.value;});
  s._pt=document.getElementById('f_pageTitle').value;
  s._rb={...rubricState};
  s._re=rubricExpanded;
  s._st=showSectionTitles;
  return s;
}
function resetAll(){
  const hasData=ALL_F.some(id=>{const e=document.getElementById(id);return e&&e.value.trim();});
  if(!hasData){showToast('warning','Nothing to reset','All fields already empty.');return;}
  snap=capSnap();
  ALL_F.forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  document.getElementById('f_pageTitle').value='Lab Assignment Report';
  Object.keys(rubricState).forEach(k=>rubricState[k]=true);
  rubricExpanded=false;
  document.getElementById('rubricSlidersWrap').style.display='none';
  const rm=document.getElementById('rt-rubricMaster');if(rm)rm.classList.remove('on');
  showSectionTitles=true;
  document.getElementById('rt-sectionTitles').classList.add('on');
  renderRubricSliders();render();startUndo();
  showToast('warning','Fields cleared','Press Undo within 15s to restore.');
}
function startUndo(){
  const btn=document.getElementById('undoBtn'),txt=document.getElementById('undoTxt'),bar=document.getElementById('undoBar');
  if(undoT)clearTimeout(undoT);if(undoI)clearInterval(undoI);
  btn.disabled=false;let rem=UNDO_S;txt.textContent='('+rem+'s)';
  bar.style.transition='none';bar.style.width='100%';bar.getBoundingClientRect();
  bar.style.transition='width '+UNDO_S+'s linear';bar.style.width='0%';
  undoI=setInterval(()=>{rem--;txt.textContent='('+rem+'s)';if(rem<=0){clearInterval(undoI);undoI=null;}},1000);
  undoT=setTimeout(killUndo,UNDO_S*1000);
}
function killUndo(){
  snap=null;if(undoI){clearInterval(undoI);undoI=null;}
  const btn=document.getElementById('undoBtn'),txt=document.getElementById('undoTxt'),bar=document.getElementById('undoBar');
  btn.disabled=true;txt.textContent='';bar.style.transition='none';bar.style.width='0%';
}
function doUndo(){
  if(!snap)return;
  const s=snap;
  ALL_F.forEach(id=>{const e=document.getElementById(id);if(e)e.value=s[id]||'';});
  document.getElementById('f_pageTitle').value=s._pt||'Lab Assignment Report';
  Object.assign(rubricState,s._rb||{});
  showSectionTitles=s._st!==undefined?s._st:true;
  document.getElementById('rt-sectionTitles').classList.toggle('on',showSectionTitles);
  renderRubricSliders();render();
  if(undoT){clearTimeout(undoT);undoT=null;}
  killUndo();
  showToast('success','Restored!','Fields have been recovered.');
}

/* ── BUILD RUBRIC TABLE ── */
function buildTable(){
  const rows=[
    {key:'clarity',label:'Clarity',mark:1},
    {key:'content',label:'Content Quality',mark:2},
    {key:'spelling',label:'Spelling &amp; Grammar',mark:1},
    {key:'organization',label:'Organization and<br>Formatting',mark:1},
  ];
  const enabled=rows.filter(r=>rubricState[r.key]);
  const tot=rubricTotal();
  let trs='';
  enabled.forEach(r=>{
    trs+=`<tr><td class="lbl-cell">${r.label}</td><td class="mark-cell">${r.mark}</td><td></td><td></td><td></td><td></td><td></td></tr>`;
  });
  return `<table class="cv-rubric-table">
    <colgroup><col class="c-name"><col class="c-mark"><col class="c-ni"><col class="c-dev"><col class="c-suf"><col class="c-aa"><col class="c-total"></colgroup>
    <thead>
      <tr><th colspan="7" class="only-teacher">Only for course Teacher</th></tr>
      <tr>
        <th colspan="2" style="text-align:left;padding-left:10px;"></th>
        <th>Needs<br>Improvement</th><th>Developing</th><th>Sufficient</th>
        <th>Above<br>Average</th><th>Total<br>Mark</th>
      </tr>
      <tr>
        <td colspan="2" style="font-weight:700;text-align:left;padding-left:10px;">Allocate mark &amp; Percentage</td>
        <td>25%</td><td>50%</td><td>75%</td><td>100%</td><td>${tot}</td>
      </tr>
    </thead>
    <tbody>
      ${trs}
      <tr><td colspan="6" style="text-align:right;font-weight:700;padding-right:10px;">Total obtained mark</td><td></td></tr>
      <tr class="comments-row"><td class="comments-lbl">Comments</td><td colspan="6"></td></tr>
    </tbody>
  </table>`;
}

/* ── BUILD HTML ── */
function gv(id){const e=document.getElementById(id);return e?e.value.trim():'';}
function buildHTML(){
  const pt=gv('f_pageTitle')||'Lab Assignment Report';
  const name=gv('f_studentName'),sid=gv('f_studentId'),batch=gv('f_batch'),sec=gv('f_section');
  const cc=gv('f_courseCode'),cn=gv('f_courseName');
  const teacher=gv('f_teacherName'),desig=gv('f_designation');
  const sem=gv('f_semester');
  const subDate=formatCalendarDate(gv('f_subDate'));

  let h='';
  h+=`<div class="cv-logo-row"><img src="img/DIU-Logo.png" alt="DIU" onerror="this.style.display='none'"></div>`;
  h+=`<div class="cv-page-title">${pt}</div>`;
  h+=`<div class="cv-rubric-wrap">${buildTable()}</div>`;

  // Submitted By FIRST (student info on top)
  if(showSectionTitles) h+=`<div class="cv-section-title">Submitted By:</div>`;
  h+=`<div class="cv-row"><span class="cv-lbl">Semester:</span><span class="cv-val">&nbsp;${sem}</span></div>`;
  h+=`<div class="cv-row"><span class="cv-lbl">Student Name:</span><span class="cv-val">&nbsp;${name}</span></div>`;
  h+=`<div class="cv-row"><span class="cv-lbl">Student ID:</span><span class="cv-val">&nbsp;${sid}</span></div>`;
  h+=`<div class="cv-dual-row"><div class="cv-dual-left"><span class="cv-lbl">Batch:</span><span class="cv-val">&nbsp;${batch}</span></div><div class="cv-dual-right"><span class="cv-lbl">Section:</span><span class="cv-val">&nbsp;${sec}</span></div></div>`;
  h+=`<div class="cv-dual-row"><div class="cv-dual-left"><span class="cv-lbl">Course Code:</span><span class="cv-val">&nbsp;${cc}</span></div><div class="cv-dual-right"><span class="cv-lbl">Course Name:</span><span class="cv-val">&nbsp;${cn}</span></div></div>`;

  // Submitted To SECOND (teacher info below)
  if(showSectionTitles) h+=`<div class="cv-section-title" style="margin-top:14px;">Submitted To:</div>`;
  else h+=`<div style="margin-top:10px;"></div>`;
  h+=`<div class="cv-row"><span class="cv-lbl">Course Teacher Name:</span><span class="cv-val">&nbsp;${teacher}</span></div>`;
  h+=`<div class="cv-row"><span class="cv-lbl">Designation:</span><span class="cv-val">&nbsp;${desig}</span></div>`;

  h+=`<div class="cv-date-row" style="margin-top:30px;"><span class="cv-lbl">Submission Date:</span><span class="cv-val">&nbsp;${subDate}</span></div>`;
  return h;
}

function render(){
  document.getElementById('cv-body').innerHTML=buildHTML();
  checkFields();
}

/* ── FIX #5: Download filename = pageTitle + sitename ── */
async function toDataURL(url){
  try{const r=await fetch(url,{mode:'cors'});const b=await r.blob();return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b);});}catch(e){return null;}
}
function uDl(blob,name){
  try{
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';
    document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},500);
    setTimeout(()=>showToast('success','PDF Downloaded!','Check your downloads folder.',5000),800);
  }catch(e){showToast('error','Download Failed','Try Chrome or Firefox.',5000);}
}
function burst(btn){
  const rect=btn.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
  const ov=document.createElement('div');ov.className='dl-particles';document.body.appendChild(ov);
  const cols=['#4ade80','#2d54b8','#a8c0ff','#7c3aed','#fbbf24','#f472b6'];
  for(let i=0;i<22;i++){
    const p=document.createElement('div');p.className='dl-particle';
    const angle=(Math.PI*2/22)*i,dist=50+Math.random()*100,size=6+Math.random()*8;
    p.style.cssText=`left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${cols[i%cols.length]};--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;animation-duration:${.5+Math.random()*.5}s;`;
    ov.appendChild(p);
  }
  setTimeout(()=>{if(ov.parentNode)ov.parentNode.removeChild(ov);},1400);
}
function buildFilename(){
  const pt=gv('f_pageTitle')||'Lab-Assignment-Report';
  return pt.replace(/\s+/g,'-').replace(/[^a-zA-Z0-9\-]/g,'')+'-diucoverpoint.pdf';
}

async function buildBlob(){
  const w=document.createElement('div');
  w.style.cssText='position:absolute;top:0;left:0;width:794px;visibility:hidden;pointer-events:none;z-index:-9999;';
  const clone=document.createElement('div');
  clone.style.cssText='width:794px;min-height:1122px;background:#fff;position:relative;font-family:"Calibri","Carlito",Arial,sans-serif;color:#000;';
  const wm=document.createElement('div');
  wm.style.cssText='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:360px;height:360px;background-size:contain;background-repeat:no-repeat;background-position:center;opacity:0.06;z-index:1;pointer-events:none;';
  clone.appendChild(wm);
  const inner=document.createElement('div');
  inner.style.cssText='position:relative;z-index:5;padding:36px 55px 40px 55px;min-height:1050px;display:flex;flex-direction:column;font-family:"Calibri","Carlito",Arial,sans-serif;color:#000;';
  inner.innerHTML=buildHTML();
  clone.appendChild(inner);
  w.appendChild(clone);document.body.appendChild(w);
  try{
    // Load logo
    const lg=clone.querySelector('.cv-logo-row img');
    if(lg&&lg.src&&!lg.src.startsWith('data:')){
      const d=await toDataURL(lg.src);
      if(d) lg.src=d;
    }
    // Load watermark separately (same image as logo)
    const wmData=await toDataURL('img/watermark.jpg');
    if(wmData) wm.style.backgroundImage=`url(${wmData})`;
  }catch(e){}
  await new Promise(r=>setTimeout(r,150));
  const opt={margin:0,image:{type:'jpeg',quality:1},html2canvas:{scale:2.8,useCORS:true,allowTaint:true,logging:false,width:794,scrollX:0,scrollY:0},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}};
  const blob=await html2pdf().set(opt).from(clone).outputPdf('blob');
  document.body.removeChild(w);
  return blob;
}

async function downloadPDF(){
  const btn=document.getElementById('dlBtn');if(btn.disabled)return;
  btn.classList.add('generating');
  btn.innerHTML='<i class="bi bi-arrow-repeat" style="display:inline-block;animation:spin 1s linear infinite;margin-right:8px"></i> GENERATING...';
  btn.disabled=true;
  try{
    const blob=await buildBlob();
    btn.classList.remove('generating');btn.classList.add('success');
    burst(btn);uDl(blob,buildFilename());incDl();
    btn.innerHTML='<i class="bi bi-check-circle-fill"></i> DOWNLOADED!';
    setTimeout(()=>{btn.classList.remove('success');btn.innerHTML='<i class="bi bi-download"></i> &nbsp; DOWNLOAD PDF';checkFields();},2500);
  }catch(e){
    btn.classList.remove('generating');btn.innerHTML='<i class="bi bi-download"></i> &nbsp; DOWNLOAD PDF';checkFields();
    showToast('error','Generation Failed','Could not create PDF. Try again.',5000);
  }
}

/* ══ MERGE VIEW ══ */
let mergeItems=[],dragSrcIdx=null;
const mCardsEl=document.getElementById('mergeCards');
const mEmptyEl=document.getElementById('mergeEmpty');

function openMergeView(){document.getElementById('mainLayout').classList.add('hidden');document.getElementById('mergeView').classList.add('active');updateMSteps();}
function closeMergeView(){document.getElementById('mergeView').classList.remove('active');document.getElementById('mainLayout').classList.remove('hidden');}
async function addToMergeAndGo(){await addCoverToPile();openMergeView();}

const dz=document.getElementById('mergeDropzone');
['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('over');}));
dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('over');const files=[...e.dataTransfer.files].filter(f=>f.type==='application/pdf');if(files.length)handleMergeFiles(files);});

function fmtSz(b){if(b<1024)return b+'B';if(b<1048576)return(b/1024).toFixed(1)+'KB';return(b/1048576).toFixed(1)+'MB';}

async function handleMergeFiles(files){
  for(const f of files){
    const bytes=new Uint8Array(await f.arrayBuffer());
    const id='f'+Date.now()+Math.random();let pg=1,thumb=null;
    try{const pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise;pg=pdf.numPages;const page=await pdf.getPage(1);const vp=page.getViewport({scale:.42});const canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;thumb=canvas;}catch(e){}
    mergeItems.push({id,name:f.name,bytes,pageCount:pg,isCover:false,thumb,size:f.size});
  }
  document.getElementById('mergeFileInput').value='';
  renderCards();updateMSteps();
  showToast('info','Files Added',`${files.length} PDF${files.length>1?'s':''} added.`,3000);
}

async function addCoverToPile(){
  mergeItems=mergeItems.filter(x=>!x.isCover);
  const btn=document.getElementById('addCoverBtn');const prev=btn.innerHTML;
  btn.innerHTML='<i class="bi bi-hourglass-split" style="display:inline-block;animation:spin 1s linear infinite;"></i> Generating...';btn.disabled=true;
  try{
    const blob=await buildBlob();
    const bytes=new Uint8Array(await blob.arrayBuffer());let thumb=null;
    try{const pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise;const page=await pdf.getPage(1);const vp=page.getViewport({scale:.42});const canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;thumb=canvas;}catch(e){}
    mergeItems.unshift({id:'cover',name:'Lab Assignment Cover (Generated)',bytes,pageCount:1,isCover:true,thumb,size:blob.size});
    document.getElementById('coverNoteWrap').style.display='block';
    renderCards();updateMSteps();
    showToast('success','Cover Added','Cover page added to queue.',3000);
  }catch(e){showToast('error','Failed','Fill required fields first.',5000);}
  btn.innerHTML=prev;btn.disabled=false;
}

function renderCards(){
  mCardsEl.innerHTML='';
  const tot=mergeItems.reduce((a,x)=>a+x.pageCount,0);
  const totSz=mergeItems.reduce((a,x)=>a+(x.size||0),0);
  const has=mergeItems.length>0;
  document.getElementById('cardCount').textContent=mergeItems.length+' file'+(mergeItems.length!==1?'s':'');
  document.getElementById('mergeDlBtn').disabled=mergeItems.length<2;
  document.getElementById('clearBtn').style.display=has?'':'none';
  document.getElementById('dragHint').style.display=mergeItems.length>1?'flex':'none';
  if(!has){mCardsEl.appendChild(mEmptyEl);document.getElementById('coverNoteWrap').style.display='none';document.getElementById('mergeInfo').textContent='Add at least 2 PDFs to merge';return;}
  document.getElementById('mergeInfo').innerHTML=`<strong>${mergeItems.length} PDF${mergeItems.length!==1?'s':''}</strong> · ${tot} pg · ${fmtSz(totSz)}`;
  mergeItems.forEach((item,idx)=>{
    const card=document.createElement('div');card.className='pdf-card'+(item.isCover?' is-cover':'');card.draggable=true;
    const badge=document.createElement('div');badge.className='card-badge';badge.textContent=item.isCover?'COVER':'#'+(idx+1);card.appendChild(badge);
    const rm=document.createElement('button');rm.className='card-remove';rm.innerHTML='&times;';
    rm.onclick=e=>{e.stopPropagation();mergeItems.splice(idx,1);if(item.isCover)document.getElementById('coverNoteWrap').style.display='none';renderCards();updateMSteps();};card.appendChild(rm);
    const th=document.createElement('div');th.className='card-thumb';
    if(item.thumb){const c=item.thumb.cloneNode(true);c.style.cssText='width:100%;height:100%;object-fit:contain;display:block;';th.appendChild(c);}else th.innerHTML='<div class="card-thumb-placeholder"><i class="bi bi-file-earmark-pdf" style="font-size:30px;color:#b0c2e8;"></i></div>';
    card.appendChild(th);
    const info=document.createElement('div');info.className='card-info';
    info.innerHTML=`<div class="card-name" title="${item.name}">${item.name}</div><div class="card-meta"><span class="card-pages">${item.pageCount}pg</span><span class="card-size">${fmtSz(item.size||0)}</span></div>`;
    card.appendChild(info);
    const ar=document.createElement('div');ar.className='card-arrows';
    const lb=document.createElement('button');lb.className='arr-btn';lb.textContent='◀';lb.disabled=idx===0;lb.onclick=e=>{e.stopPropagation();[mergeItems[idx-1],mergeItems[idx]]=[mergeItems[idx],mergeItems[idx-1]];renderCards();updateMSteps();};
    const rb=document.createElement('button');rb.className='arr-btn';rb.textContent='▶';rb.disabled=idx===mergeItems.length-1;rb.onclick=e=>{e.stopPropagation();[mergeItems[idx],mergeItems[idx+1]]=[mergeItems[idx+1],mergeItems[idx]];renderCards();updateMSteps();};
    ar.appendChild(lb);ar.appendChild(rb);card.appendChild(ar);
    card.addEventListener('dragstart',e=>{dragSrcIdx=idx;card.classList.add('dragging');e.dataTransfer.effectAllowed='move';});
    card.addEventListener('dragend',()=>card.classList.remove('dragging'));
    card.addEventListener('dragover',e=>{e.preventDefault();card.classList.add('drag-over');});
    card.addEventListener('dragleave',()=>card.classList.remove('drag-over'));
    card.addEventListener('drop',e=>{e.preventDefault();card.classList.remove('drag-over');if(dragSrcIdx===null||dragSrcIdx===idx)return;const m=mergeItems.splice(dragSrcIdx,1)[0];mergeItems.splice(idx,0,m);dragSrcIdx=null;renderCards();updateMSteps();});
    mCardsEl.appendChild(card);
  });
}

function clearAll(){mergeItems=[];renderCards();updateMSteps();showToast('info','Queue Cleared','',2000);}

function updateMSteps(){
  const has=mergeItems.length>0,can=mergeItems.length>=2;
  document.getElementById('mstep1').className='merge-step'+(has?' done':' active-step');
  document.getElementById('mstep2').className='merge-step'+(can?' done':has?' active-step':'');
  document.getElementById('mstep3').className='merge-step'+(can?' active-step':'');
}

async function doMerge(){
  if(mergeItems.length<2)return;
  const btn=document.getElementById('mergeDlBtn');
  btn.classList.add('generating');btn.innerHTML='<i class="bi bi-arrow-repeat" style="display:inline-block;animation:spin 1s linear infinite;margin-right:6px"></i> MERGING...';btn.disabled=true;
  const prog=document.getElementById('mergeProgress'),bar=document.getElementById('mergeProgressBar');
  prog.classList.add('show');bar.style.width='0%';
  try{
    const{PDFDocument}=PDFLib;const merged=await PDFDocument.create();
    for(let i=0;i<mergeItems.length;i++){
      bar.style.width=Math.round((i/mergeItems.length)*88)+'%';
      const src=await PDFDocument.load(mergeItems[i].bytes);
      const pages=await merged.copyPages(src,src.getPageIndices());
      pages.forEach(p=>merged.addPage(p));
    }
    bar.style.width='96%';const out=await merged.save();bar.style.width='100%';
    const blob=new Blob([out],{type:'application/pdf'});
    btn.classList.remove('generating');btn.classList.add('success');
    burst(btn);uDl(blob,'DIU_Merged_Document-diucoverpoint.pdf');incDl();
    btn.innerHTML='<i class="bi bi-check-circle-fill"></i> DOWNLOADED!';
    setTimeout(()=>{btn.classList.remove('success');btn.innerHTML='<i class="bi bi-download"></i> &nbsp; DOWNLOAD MERGED PDF';btn.disabled=mergeItems.length<2;prog.classList.remove('show');bar.style.width='0%';},2500);
  }catch(err){
    btn.classList.remove('generating');
    showToast('error','Merge Failed','Ensure PDFs are valid and not password-protected.',6000);
    btn.innerHTML='<i class="bi bi-download"></i> &nbsp; DOWNLOAD MERGED PDF';btn.disabled=false;prog.classList.remove('show');
  }
}

// ── INIT ──
renderRubricSliders();
render();
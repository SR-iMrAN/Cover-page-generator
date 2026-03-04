if(window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let mode='assignment';
let currentRating=0;
let lastModeBeforeMerge='assignment';
let coverChoiceSelected='assignment';

/* ── TOAST SYSTEM ── */
function showToast(type,title,msg,duration=4000){
  const icons={success:'<i class="bi bi-check-circle-fill"></i>',error:'<i class="bi bi-x-circle-fill"></i>',info:'<i class="bi bi-info-circle-fill"></i>',warning:'<i class="bi bi-exclamation-triangle-fill"></i>'};
  const container=document.getElementById('toast-container');
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.style.position='relative';
  t.innerHTML=`<span class="toast-icon">${icons[type]||'<i class="fa-regular fa-comment-dots"></i>'}</span>
    <div class="toast-body"><div class="toast-title">${title}</div>${msg?`<div class="toast-msg">${msg}</div>`:''}
    </div><button class="toast-close" onclick="dismissToast(this.parentElement)">×</button>`;
  container.appendChild(t);
  requestAnimationFrame(()=>{requestAnimationFrame(()=>{t.classList.add('show');});});
  const pid=setTimeout(()=>dismissToast(t),duration);
  t._pid=pid;
  return t;
}
function dismissToast(t){
  if(!t||!t.parentElement)return;
  clearTimeout(t._pid);
  t.classList.remove('show');t.classList.add('hide');
  setTimeout(()=>{if(t.parentElement)t.parentElement.removeChild(t);},400);
}

/* ── FLOATING FEEDBACK BUTTON ── */
let ffbHasShownOnce=false;
let ffbIdleTimer=null;
let ffbRepeatTimer=null;
let ffbPillHideTimer=null;
let ffbCurrentMsg=0; // 0=comment opinion, 1=suggest feature

const FFB_MESSAGES=[
  {line1:'<i class="fa-regular fa-comment-dots"></i> COMMENT YOUR OPINION',line2:'Share your thoughts!'},
  {line1:'<i class="bi bi-lightbulb-fill"></i> SUGGEST A FEATURE',line2:'Help us improve!'}
];

function ffbShowPill(msgIdx){
  const pill=document.getElementById('ffbPill');
  const line1=document.getElementById('ffbLine1');
  const line2=document.getElementById('ffbLine2');
  clearTimeout(ffbPillHideTimer);
  // Set text first while hidden
line1.innerHTML = FFB_MESSAGES[msgIdx].line1;
line2.innerHTML = FFB_MESSAGES[msgIdx].line2;
  pill.classList.add('visible');
  // Auto hide text after 3.5s but keep icon
  ffbPillHideTimer=setTimeout(()=>{
    pill.classList.remove('visible');
    // After first msg hides, show second msg after a pause then hide
    if(msgIdx===0){
      setTimeout(()=>{
        ffbShowPill(1);
      },1200);
    }
  },3500);
}

function ffbTriggerSequence(){
  ffbShowPill(0);
}

function initFloatingFeedbackBtn(){
  // Auto-enable the field when optional toggle is opened
  // Show pill after welcome banner closes + a few seconds delay
  const wbDelay=9500; // after welcome banner auto-closes (8s) + 1.5s
  setTimeout(()=>{
    if(!ffbHasShownOnce){
      ffbHasShownOnce=true;
      ffbTriggerSequence();
    }
    // Set up idle-based repeat: if user stays too long, randomly re-open
    scheduleIdleRepeat();
  }, wbDelay);
}

function scheduleIdleRepeat(){
  clearTimeout(ffbRepeatTimer);
  // Random interval between 90s and 180s
  const delay=90000+Math.random()*90000;
  ffbRepeatTimer=setTimeout(()=>{
    // Only show again if side modal is NOT open
    const modal=document.getElementById('feedbackSideModal');
    if(!modal.classList.contains('open')){
      ffbTriggerSequence();
    }
    scheduleIdleRepeat();
  },delay);
}

function openFeedbackSide(){
  document.getElementById('feedbackSideModal').classList.add('open');
  document.getElementById('feedbackSideOverlay').classList.add('open');
  // Hide pill if showing
  document.getElementById('ffbPill').classList.remove('visible');
  clearTimeout(ffbPillHideTimer);
}
function closeFeedbackSide(){
  document.getElementById('feedbackSideModal').classList.remove('open');
  document.getElementById('feedbackSideOverlay').classList.remove('open');
}

/* FSM Rating */
let fsmRating=0;
const fsmLabels=['','Awful 😞','Not great 😕','OK 😐','Good 😊','Excellent! 🎉'];
function setFsmRating(v){
  fsmRating=v;
  document.querySelectorAll('.fsm-star').forEach(s=>s.classList.toggle('active',parseInt(s.dataset.v)<=v));
  document.getElementById('fsmRatingLabel').textContent=fsmLabels[v];
}

async function submitFsmFeedback(){
  if(!fsmRating){document.getElementById('fsmRatingLabel').innerHTML='<i class="bi bi-exclamation-triangle-fill" style="color:#f59e0b;"></i> Please select a rating first';return;}
  const name=document.getElementById('fsmNameInput').value.trim()||'Anonymous';
  const comment=document.getElementById('fsmCommentBox').value.trim()||'(no comment)';
  const ratingText=fsmLabels[fsmRating];
  const btn=document.getElementById('fsmSubmitBtn');
  btn.disabled=true;btn.innerHTML='⏳ Submitting...';
  const FORM_ACTION='https://docs.google.com/forms/u/0/d/e/1FAIpQLSfoFHpaBqMIm0jV-OIzAfAcyrosfodkknnm1w027T8AG2XxrA/formResponse';
  const ENTRY_NAME='entry.1386726769';const ENTRY_RATING='entry.1233291528';const ENTRY_COMMENT='entry.1004794290';
  try{
    const iframe=document.createElement('iframe');iframe.name='gf_'+Date.now();iframe.style.cssText='display:none;position:absolute;width:0;height:0;border:0;';document.body.appendChild(iframe);
    const form=document.createElement('form');form.method='POST';form.action=FORM_ACTION;form.target=iframe.name;form.style.display='none';
    [[ENTRY_NAME,name],[ENTRY_RATING,fsmRating+' ★ — '+ratingText],[ENTRY_COMMENT,comment]].forEach(([k,v])=>{const inp=document.createElement('input');inp.type='hidden';inp.name=k;inp.value=v;form.appendChild(inp);});
    document.body.appendChild(form);form.submit();
    setTimeout(()=>{[form,iframe].forEach(el=>{if(el.parentNode)el.parentNode.removeChild(el);});},4000);
  }catch(e){}
  showToast('success','Thank you, '+name.split(' ')[0]+'! <i class="bi bi-star-fill" style="color:#fbbf24"></i>','Your feedback has been recorded.');
  btn.innerHTML='<i class="bi bi-check-circle-fill"></i> Submitted! Thank you';
  setTimeout(()=>{
    btn.disabled=false;btn.innerHTML='<i class="bi bi-send-check-fill"></i> Submit Rating &amp; Comment';
    document.getElementById('fsmCommentBox').value='';
    document.getElementById('fsmNameInput').value='';
    fsmRating=0;setFsmRating(0);
    document.getElementById('fsmRatingLabel').textContent='Click a star to rate';
  },3000);
}

async function submitFsmFeature(){
  const idea=document.getElementById('fsmFeatureBox').value.trim();
  if(!idea){showToast('warning','Empty','Please type your feature idea first.');return;}
  const btn=document.getElementById('fsmFeatBtn');
  btn.disabled=true;btn.innerHTML='⏳ Sending...';
  const FORM_ACTION='https://docs.google.com/forms/u/0/d/e/1FAIpQLSfoFHpaBqMIm0jV-OIzAfAcyrosfodkknnm1w027T8AG2XxrA/formResponse';
  const ENTRY_COMMENT='entry.1004794290';
  try{
    const iframe=document.createElement('iframe');iframe.name='gff_'+Date.now();iframe.style.cssText='display:none;position:absolute;width:0;height:0;border:0;';document.body.appendChild(iframe);
    const form=document.createElement('form');form.method='POST';form.action=FORM_ACTION;form.target=iframe.name;form.style.display='none';
    const inp=document.createElement('input');inp.type='hidden';inp.name=ENTRY_COMMENT;inp.value='[FEATURE SUGGESTION] '+idea;form.appendChild(inp);
    document.body.appendChild(form);form.submit();
    setTimeout(()=>{[form,iframe].forEach(el=>{if(el.parentNode)el.parentNode.removeChild(el);});},4000);
  }catch(e){}
  showToast('success','Suggestion Sent! 🚀','We appreciate your idea!');
  btn.innerHTML='✅ Suggestion Sent!';
  setTimeout(()=>{btn.disabled=false;btn.innerHTML='🚀 Send Feature Suggestion';document.getElementById('fsmFeatureBox').value='';},3000);
}

/* ── WELCOME BANNER ── */
const WELCOME_DURATION=8000;
const WELCOME_KEY='diu_cover_craft_welcome_shown';
let wbTimer=null,wbInterval=null;

function shouldShowWelcome(){
  try{if(localStorage.getItem(WELCOME_KEY)==='1')return false;if(sessionStorage.getItem(WELCOME_KEY)==='1')return false;return true;}catch(e){return false;}
}
function markWelcomeShown(){
  try{localStorage.setItem(WELCOME_KEY,'1');sessionStorage.setItem(WELCOME_KEY,'1');}catch(e){}
}
function showWelcome(){
  if(!shouldShowWelcome()){
    // Still init floating btn even if welcome doesn't show
    setTimeout(initFloatingFeedbackBtn,2000);
    return;
  }
  markWelcomeShown();
  setTimeout(()=>{
    const b=document.getElementById('welcomeBanner');b.classList.add('open');
    const bar=document.getElementById('wbBar');const secEl=document.getElementById('wbSec');
    bar.style.transition='none';bar.style.width='100%';bar.getBoundingClientRect();
    bar.style.transition='width '+WELCOME_DURATION+'ms linear';bar.style.width='0%';
    let rem=Math.floor(WELCOME_DURATION/1000);if(secEl)secEl.textContent=rem;
    wbInterval=setInterval(()=>{rem--;if(secEl)secEl.textContent=Math.max(0,rem);if(rem<=0)clearInterval(wbInterval);},1000);
    wbTimer=setTimeout(()=>{closeWelcome();initFloatingFeedbackBtn();},WELCOME_DURATION);
  },700);
}
function closeWelcome(){
  clearTimeout(wbTimer);clearInterval(wbInterval);
  const b=document.getElementById('welcomeBanner');
  b.style.transition='transform .4s cubic-bezier(.4,0,.2,1)';b.classList.remove('open');
}
showWelcome();

/* TEMPLATE MODAL */
function closeTplBg(e){if(e.target===document.getElementById('tplModal'))closeModal('tplModal');}

/* UNDO STATE */
const undoState={assignment:null,lab:null};
let undoTimerHandle={assignment:null,lab:null};
let undoIntervalHandle={assignment:null,lab:null};
const UNDO_SECONDS=15;

/* ── REAL PERSISTENT COUNTERS (counterapi.dev) ──
   Visitor : increments once per browser session (sessionStorage guard).
   Download: increments on every real PDF download.
   Floor   : never shows below 3 so the site never looks empty.
   API docs: https://counterapi.dev
*/
(function(){
  const NS   = 'cover-points-team-3138';   // change this string to reset both counters to 0
const BASE = "https://api.counterapi.dev/v2/" + NS;
  const FLOOR_V = 0;   // minimum visitors shown
  const FLOOR_D = 0;   // minimum downloads shown

  /* count-up animation */
  function animateCount(elId, target){
    const el = document.getElementById(elId);
    if(!el) return;
    const start = parseInt(el.textContent) || 0;
    const diff  = target - start;
    if(diff <= 0){ el.textContent = target; return; }
    const steps = Math.min(40, diff);
    let step = 0;
    const tick = () => {
      step++;
      el.textContent = Math.round(start + (diff * step / steps));
      if(step < steps) setTimeout(tick, 28);
    };
    tick();
  }

  function display(elId, raw, floor){
    animateCount(elId, Math.max(raw || 0, floor));
  }

  /* ── helper: fetch with timeout ── */
  function fetchCount(url, timeoutMs){
    timeoutMs = timeoutMs || 6000;
    return new Promise(function(resolve, reject){
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = setTimeout(function(){ if(ctrl) ctrl.abort(); reject(new Error('timeout')); }, timeoutMs);
      fetch(url, ctrl ? { signal: ctrl.signal } : {})
        .then(function(r){
          clearTimeout(timer);
          if(!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(resolve)
        .catch(function(e){ clearTimeout(timer); reject(e); });
    });
  }

  /* ── VISITOR COUNTER ── */
  (function initVisits(){
    const SESSION_KEY = 'dcp_visited';
    const url = SESSION_KEY in sessionStorage
      ? BASE + '/visitsx'
      : BASE + '/visitsx/up';
    if(!(SESSION_KEY in sessionStorage)) sessionStorage.setItem(SESSION_KEY,'1');

    fetchCount(url)
      .then(function(d){ display('visitorCount', d.data.up_count, FLOOR_V); })
      .catch(function(err){
        console.warn('[CounterAPI] visitor fetch failed:', err);
        /* retry once after 3 s */
        setTimeout(function(){
          fetchCount(url)
            .then(function(d){ display('visitorCount', d.data.up_count, FLOOR_V); })
            .catch(function(){ display('visitorCount', FLOOR_V, FLOOR_V); });
        }, 3000);
      });
  })();

  /* ── DOWNLOAD COUNTER (read on load) ── */
  fetchCount(BASE + '/downloadsx')
    .then(function(d){ display('dlCount', d.data.up_count, FLOOR_D); })
    .catch(function(err){
      console.warn('[CounterAPI] download fetch failed:', err);
      setTimeout(function(){
        fetchCount(BASE + '/downloadsx')
          .then(function(d){ display('dlCount', d.data.up_count, FLOOR_D); })
          .catch(function(){ display('dlCount', FLOOR_D, FLOOR_D); });
      }, 3000);
    });

  /* ── incrementDownloadCount called on every real PDF save ── */
  window.incrementDownloadCount = function(){
    fetchCount(BASE + '/downloadsx/up')
      .then(function(d){ display('dlCount', d.data.up_count, FLOOR_D); })
      .catch(function(){
        const el = document.getElementById('dlCount');
        if(el) el.textContent = Math.max(parseInt(el.textContent)||0, FLOOR_D) + 1;
      });
  };
})();

/* ── OPTIONAL FIELDS TOGGLE (updated behaviour) ── 
   When the toggle row is clicked:
   1. It opens/closes as before
   2. On OPEN — the field auto-enables (slider turns on, input unlocked)
   3. When slider is turned OFF — the section auto-collapses/hides again
*/
const optGroupToField={
  'a_optional_doc':'a_assignmentNo',
  'a_optional_teacher':'a_tDesignation',
  'l_optional_teacher':'l_tDesignation',
  'l_optional_student':'l_groupNo'
};
const optGroupToIcon={
  'a_optional_doc':'opt-icon-a-doc',
  'a_optional_teacher':'opt-icon-a-teacher',
  'l_optional_teacher':'opt-icon-l-teacher',
  'l_optional_student':'opt-icon-l-student'
};

function toggleOptional(groupId){
  const el=document.getElementById(groupId);
  const isOpen=el.classList.contains('open');
  const iconEl=document.getElementById(optGroupToIcon[groupId]);
  if(isOpen){
    // Closing: also disable the field
    el.classList.remove('open');if(iconEl)iconEl.classList.remove('open');
    const fieldId=optGroupToField[groupId];
    if(fieldId)disableField(fieldId);
  }else{
    // Opening: show section AND auto-enable the field
    el.classList.add('open');if(iconEl)iconEl.classList.add('open');
    const fieldId=optGroupToField[groupId];
    if(fieldId)enableField(fieldId);
  }
}

function enableField(fieldId){
  const inp=document.getElementById(fieldId);
  const fg=document.getElementById('fg-'+fieldId);
  const btn=document.getElementById('toggle-'+fieldId);
  if(!inp||!fg||!btn)return;
  if(!inp.disabled)return; // already enabled
  inp.disabled=false;
  fg.classList.remove('fg-optional');fg.classList.add('enabled');
  btn.classList.add('on');
  setTimeout(()=>inp.focus(),50);
  render();
}

function disableField(fieldId){
  const inp=document.getElementById(fieldId);
  const fg=document.getElementById('fg-'+fieldId);
  const btn=document.getElementById('toggle-'+fieldId);
  if(!inp||!fg||!btn)return;
  if(inp.disabled)return; // already disabled
  inp.disabled=true;
  fg.classList.add('fg-optional');fg.classList.remove('enabled');
  btn.classList.remove('on');
  render();
}

function toggleField(fieldId){
  const inp=document.getElementById(fieldId);
  if(!inp)return;
  if(inp.disabled){
    // Turning ON
    enableField(fieldId);
  }else{
    // Turning OFF — also collapse the parent optional-fields group
    disableField(fieldId);
    // Find which group owns this field and close it
    const groupId=Object.keys(optGroupToField).find(k=>optGroupToField[k]===fieldId);
    if(groupId){
      const el=document.getElementById(groupId);
      const iconEl=document.getElementById(optGroupToIcon[groupId]);
      el.classList.remove('open');if(iconEl)iconEl.classList.remove('open');
    }
  }
}

// On page init: make sure all optional fields start as disabled & collapsed
// (buttons have class 'on' in HTML but fields are disabled — fix the visual state)
document.addEventListener('DOMContentLoaded',()=>{
  Object.values(optGroupToField).forEach(fieldId=>{
    const inp=document.getElementById(fieldId);
    const fg=document.getElementById('fg-'+fieldId);
    const btn=document.getElementById('toggle-'+fieldId);
    if(inp&&inp.disabled){
      if(fg){fg.classList.add('fg-optional');fg.classList.remove('enabled');}
      if(btn)btn.classList.remove('on');
    }
  });
});

/* FIELD VALIDATION */
const REQUIRED_FIELDS={
  assignment:['a_topicName','a_courseCode','a_courseTitle','a_tName','a_tDept','a_sName','a_sId','a_sSec','a_sSem','a_sDept','a_subDate'],
  lab:['l_expName','l_expNo','l_courseCode','l_courseTitle','l_tName','l_tDept','l_sName','l_sId','l_sSec','l_sSem','l_sDept','l_subDate']
};
function checkFields(){
  if(mode==='merge')return;
  const fields=REQUIRED_FIELDS[mode];
  let empty=0;
  fields.forEach(id=>{const el=document.getElementById(id);if(!el||!el.value.trim())empty++;});
  const btn=document.getElementById('dlBtn'),tip=document.getElementById('dlTooltip');
  const ok=empty<=2;btn.disabled=!ok;
  tip.textContent=ok?'':`Fill ${Math.max(0,empty-2)} more field${(empty-2)>1?'s':''} to enable download`;
  updateResetBarVisibility();
}
function updateResetBarVisibility(){
  document.getElementById('resetBarA').style.display=(mode==='assignment')?'flex':'none';
  document.getElementById('resetBarL').style.display=(mode==='lab')?'flex':'none';
}
function countFilledFields(modeKey){
  return REQUIRED_FIELDS[modeKey].filter(id=>{const el=document.getElementById(id);return el&&el.value.trim();}).length;
}

/* RESET + UNDO */
function captureSnapshot(modeKey){const snap={};REQUIRED_FIELDS[modeKey].forEach(id=>{const el=document.getElementById(id);if(el)snap[id]=el.value;});return snap;}
function hasAnyData(modeKey){return REQUIRED_FIELDS[modeKey].some(id=>{const el=document.getElementById(id);return el&&el.value.trim();});}
function resetFields(modeKey){
  if(!hasAnyData(modeKey)){showToast('warning','Nothing to reset','All fields are already empty.');return;}
  undoState[modeKey]=captureSnapshot(modeKey);
  REQUIRED_FIELDS[modeKey].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  render();startUndoTimer(modeKey);
  showToast('warning','Fields cleared','Press Undo within 15s to restore.','3000');
}
function startUndoTimer(modeKey){
  const btn=document.getElementById('undo-btn-'+modeKey);const timerSpan=document.getElementById('undo-timer-'+modeKey);const bar=document.getElementById('undo-bar-'+modeKey);
  if(undoTimerHandle[modeKey])clearTimeout(undoTimerHandle[modeKey]);if(undoIntervalHandle[modeKey])clearInterval(undoIntervalHandle[modeKey]);
  btn.disabled=false;let remaining=UNDO_SECONDS;timerSpan.textContent='('+remaining+'s)';
  bar.style.transition='none';bar.style.width='100%';bar.getBoundingClientRect();
  bar.style.transition='width '+UNDO_SECONDS+'s linear';bar.style.width='0%';
  undoIntervalHandle[modeKey]=setInterval(()=>{remaining--;if(timerSpan)timerSpan.textContent='('+remaining+'s)';if(remaining<=0){clearInterval(undoIntervalHandle[modeKey]);undoIntervalHandle[modeKey]=null;}},1000);
  undoTimerHandle[modeKey]=setTimeout(()=>expireUndo(modeKey),UNDO_SECONDS*1000);
}
function expireUndo(modeKey){
  undoState[modeKey]=null;if(undoIntervalHandle[modeKey]){clearInterval(undoIntervalHandle[modeKey]);undoIntervalHandle[modeKey]=null;}
  const btn=document.getElementById('undo-btn-'+modeKey);const timerSpan=document.getElementById('undo-timer-'+modeKey);const bar=document.getElementById('undo-bar-'+modeKey);
  if(btn)btn.disabled=true;if(timerSpan)timerSpan.textContent='';if(bar){bar.style.transition='none';bar.style.width='0%';}
}
function undoReset(modeKey){
  if(!undoState[modeKey])return;
  const snap=undoState[modeKey];Object.keys(snap).forEach(id=>{const el=document.getElementById(id);if(el)el.value=snap[id];});
  render();if(undoTimerHandle[modeKey]){clearTimeout(undoTimerHandle[modeKey]);undoTimerHandle[modeKey]=null;}
  expireUndo(modeKey);showToast('success','Restored!','Your fields have been recovered.');
}

/* MODE SWITCHER */
function setMode(m){
  if(m!=='merge')lastModeBeforeMerge=m;mode=m;
  document.getElementById('btn-a').className='tbtn'+(m==='assignment'?' active':'');
  document.getElementById('btn-l').className='tbtn'+(m==='lab'?' active':'');
  document.getElementById('btn-m').className='tbtn merge-tab'+(m==='merge'?' active':'');
  document.getElementById('panel-assignment').className='mode-panel'+(m==='assignment'?' active':'');
  document.getElementById('panel-lab').className='mode-panel'+(m==='lab'?' active':'');
  document.getElementById('mainLayout').style.display=m==='merge'?'none':'grid';
  document.getElementById('mergeView').className='merge-view'+(m==='merge'?' active':'');
  document.querySelectorAll('.mob-tab').forEach(t=>t.classList.remove('active'));
  if(m==='assignment')document.getElementById('mobtab-a').classList.add('active');
  else if(m==='lab')document.getElementById('mobtab-l').classList.add('active');
  else if(m==='merge')document.getElementById('mobtab-m').classList.add('active');
  if(m!=='merge'){document.getElementById('mobileToggleLabel').textContent=m==='assignment'?'Switch to Lab Report':'Switch to Assignment';render();}
  updateResetBarVisibility();updateMergeSteps();
}
function updateMergeSteps(){
  if(mode!=='merge')return;
  const hasFiles=mergeItems.length>0;const canDl=mergeItems.length>=2;
  document.getElementById('mstep1').className='merge-step'+(hasFiles?' done':' active-step');
  document.getElementById('mstep2').className='merge-step'+(canDl?' done':hasFiles?' active-step':'');
  document.getElementById('mstep3').className='merge-step'+(canDl?' active-step':'');
}
function toggleMenu(){
  const btn=document.getElementById('hamburgerBtn'),menu=document.getElementById('dropdownMenu');
  const o=menu.classList.contains('open');
  btn.classList.toggle('open',!o);menu.classList.toggle('open',!o);
  const mob=window.innerWidth<=700;
  document.getElementById('mobileModeSection').style.display=mob?'block':'none';
  document.getElementById('mobileToggleBtn').style.display=mob?'flex':'none';
}
function closeMenu(){document.getElementById('hamburgerBtn').classList.remove('open');document.getElementById('dropdownMenu').classList.remove('open');}
document.addEventListener('click',e=>{
  const menu=document.getElementById('dropdownMenu'),btn=document.getElementById('hamburgerBtn');
  if(menu.classList.contains('open')&&!menu.contains(e.target)&&!btn.contains(e.target))closeMenu();
});
function toggleModeFromMenu(){setMode(mode==='assignment'||mode==='merge'?'lab':'assignment');closeMenu();}
function openModal(id){closeMenu();document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function closeBg(e,id){if(e.target===document.getElementById(id))closeModal(id);}

function copyFromAssignment(){
  ['courseCode','courseTitle','tName','tDept','sName','sId','sSec','sSem','sDept','subDate'].forEach(f=>{
    const src=document.getElementById('a_'+f),dst=document.getElementById('l_'+f);if(src&&dst)dst.value=src.value;
  });
  render();showToast('success','Copied!','Assignment fields copied to Lab Report.');
}

function g(id){const e=document.getElementById(id);return e?e.value.trim():'';}
function gmFor(modeKey,f){return g((modeKey==='assignment'?'a_':'l_')+f);}
function fd(s){if(!s)return'';const d=new Date(s+'T12:00:00');return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();}
function isFieldEnabled(id){const el=document.getElementById(id);return el&&!el.disabled&&el.value.trim();}
function row(l,v){return`<div class="cv-row"><span class="cv-lbl">${l} </span><span class="cv-val">${v||''}</span></div>`;}
function irow(l,v,b=false){return`<div class="cv-ir"><span class="cv-il">${l} </span><span class="cv-iv${b?' cv-iv-name':''}">${v||''}</span></div>`;}

function buildHTMLForMode(modeKey){
  const isLab=modeKey==='lab';
  const get=(f)=>gmFor(modeKey,f);
  const getOptional=(f)=>{const id=(isLab?'l_':'a_')+f;const el=document.getElementById(id);return(el&&!el.disabled)?el.value.trim():'';};
  let h='';
  h+=`<div class="cv-logo"><img src="img/DIU-Logo.png" alt="DIU" onerror="this.style.display='none'"></div>`;
  h+=`<div class="cv-title">${isLab?'LAB REPORT':'Assignment'}</div>`;
  if(!isLab){const assignNo=getOptional('assignmentNo');if(assignNo)h+=row('Assignment No:',assignNo);h+=row('Topic Name:',get('topicName'));}
  else{h+=row('Experiment Name:',get('expName'));h+=row('Experiment No:',get('expNo'));}
  h+=row('Course Code:',get('courseCode'));h+=row('Course Title:',get('courseTitle'));
  const tDesig=getOptional('tDesignation');
  h+=`<div class="cv-sec"><u>Submitted To</u>:</div><div class="cv-ib">
    ${irow('Teacher Name:',get('tName'),true)}${tDesig?irow('Designation:',tDesig):''}
    ${irow('Department:',get('tDept'))}
    <div class="cv-uline">Daffodil International University.</div>
  </div>`;
  const groupNo=isLab?getOptional('groupNo'):'';
  h+=`<div class="cv-sec"><u>Submitted By</u>:</div><div class="cv-ib">
    ${irow('Name:',get('sName'),true)}${irow('ID:',get('sId'))}
    ${isLab&&groupNo?irow('Group No:',groupNo):''}
    ${irow('Section:',get('sSec'))}${irow('Semester:',get('sSem'))}${irow('Department:',get('sDept'))}
    <div class="cv-uline">Daffodil International University.</div>
  </div>`;
  h+=`<div style="height:26px"></div>`;
  h+=`<div class="cv-date-row"><span class="cv-lbl"><u>Submission Date</u>: </span><span class="cv-val">${fd(get('subDate'))}</span></div>`;
  return h;
}
function buildHTML(){return buildHTMLForMode(mode==='merge'?lastModeBeforeMerge:mode);}
function render(){document.getElementById('cv-body').innerHTML=buildHTML();checkFields();}

/* Particle burst */
function triggerParticleBurst(btn){
  const rect=btn.getBoundingClientRect();const cx=rect.left+rect.width/2;const cy=rect.top+rect.height/2;
  const overlay=document.createElement('div');overlay.className='dl-particles';document.body.appendChild(overlay);
  const colors=['#4ade80','#2d54b8','#a8c0ff','#7c3aed','#fbbf24','#f472b6','#38bdf8','#fb923c'];
  for(let i=0;i<22;i++){
    const p=document.createElement('div');p.className='dl-particle';
    const angle=(Math.PI*2/22)*i;const dist=50+Math.random()*100;const size=6+Math.random()*8;
    p.style.cssText=`left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${colors[i%colors.length]};--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;animation-duration:${0.5+Math.random()*0.5}s;`;
    overlay.appendChild(p);
  }
  setTimeout(()=>{if(overlay.parentNode)overlay.parentNode.removeChild(overlay);},1400);
}

/* Universal download */
function universalDownload(blob,filename){
  try{
    if(window.navigator&&window.navigator.msSaveOrOpenBlob){window.navigator.msSaveOrOpenBlob(blob,filename);return;}
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';
    document.body.appendChild(a);a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},500);
    setTimeout(()=>{showToast('success','PDF Downloaded!','Check your downloads folder.',5000);},800);return;
  }catch(e1){}
  try{
    const url=URL.createObjectURL(blob);const opened=window.open(url,'_blank');
    setTimeout(()=>URL.revokeObjectURL(url),15000);
    if(!opened||opened.closed){blobToDataURIDownload(blob,filename);}
    else{showToast('info','PDF Opened','Save it from the new tab/window.',5000);}return;
  }catch(e2){}
  blobToDataURIDownload(blob,filename);
}
function blobToDataURIDownload(blob,filename){
  const r=new FileReader();
  r.onload=function(){
    const dataURI=r.result;
    try{const a=document.createElement('a');a.href=dataURI;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();document.body.removeChild(a);showToast('success','PDF Ready','If it didn\'t save, open in Chrome or Firefox.',6000);return;}catch(e){}
    try{window.open(dataURI,'_blank');}catch(e){}
    showToast('warning','Download Issue','Please open this page in Chrome or Firefox for best results.',8000);
  };
  r.onerror=()=>{showToast('error','Download Failed','Please open in Chrome or Firefox.',8000);};
  r.readAsDataURL(blob);
}
async function toDataURL(url){
  try{const res=await fetch(url,{mode:'cors'});const blob=await res.blob();return await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob);});}catch(e){return null;}
}

async function buildCoverPDFBlobForMode(modeKey){
  const SITE_URL='https://coverpoint.netlify.app';
  const wrapper=document.createElement('div');
  wrapper.style.cssText='position:absolute;top:0;left:0;width:793px;height:1122px;overflow:hidden;visibility:hidden;pointer-events:none;z-index:-9999;';
  wrapper.innerHTML=`
    <div id="pci" style="width:793px;height:1122px;background:#fff;position:relative;font-family:'Calibri','Carlito',Arial,sans-serif;color:#000;">
      <div style="position:absolute;top:16px;left:22px;right:22px;bottom:16px;border:1.5px solid #444;z-index:10;margin-right:2px;"></div>
      <div id="pwm" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:420px;height:420px;background-image:url('img/watermark.jpg');background-size:contain;background-repeat:no-repeat;background-position:center;opacity:0.075;z-index:1;"></div>
      <div style="position:relative;z-index:5;padding:36px 55px 40px 55px;display:flex;flex-direction:column;">${buildHTMLForMode(modeKey)}</div>
      <a id="pdf-wm-link" href="${SITE_URL}" style="position:absolute;bottom:24px;right:28px;z-index:20;display:block;width:160px;height:28px;color:rgba(255,255,255,0.01);font-size:7px;font-family:Arial,sans-serif;line-height:28px;text-align:center;text-decoration:none;background:transparent;white-space:nowrap;overflow:hidden;">${SITE_URL}</a>
    </div>`;
  document.body.appendChild(wrapper);
  const cl=wrapper.querySelector('#pci');
  const st=document.createElement('style');st.textContent='.cv-iv-name{font-size:23px!important;font-weight:400!important;position:relative;top:2px;}';cl.appendChild(st);
  try{const lg=cl.querySelector('.cv-logo img');if(lg&&lg.src&&!lg.src.startsWith('data:')){const d=await toDataURL(lg.src);if(d)lg.src=d;}}catch(e){}
  try{const wm=cl.querySelector('#pwm');if(wm){const bg=wm.style.backgroundImage;const m=bg.match(/url\(['"]?(.*?)['"]?\)/);if(m&&m[1]&&!m[1].startsWith('data:')){const d=await toDataURL(m[1]);if(d)wm.style.backgroundImage=`url(${d})`;}}}catch(e){}
  await new Promise(r=>setTimeout(r,80));
  const opt={margin:0,image:{type:'jpeg',quality:1},html2canvas:{scale:3,useCORS:true,allowTaint:true,logging:false,width:794,height:1122,scrollX:0,scrollY:0},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}};
  const blob=await html2pdf().set(opt).from(cl).outputPdf('blob');
  document.body.removeChild(wrapper);return blob;
}

async function downloadPDF(){
  const btn=document.getElementById('dlBtn');if(btn.disabled)return;
  btn.classList.add('generating');btn.innerHTML='<span style="display:inline-block;animation:spin 1s linear infinite;margin-right:8px">⏳</span> GENERATING...';btn.disabled=true;
  try{
    const modeKey=mode==='merge'?lastModeBeforeMerge:mode;
    const blob=await buildCoverPDFBlobForMode(modeKey);
    btn.classList.remove('generating');btn.classList.add('success');
    const fname=(modeKey==='lab'?'Lab_Report_Cover-diucoverpoint':'Assignment_Cover_Page-diucoverpoint')+'.pdf';
    triggerParticleBurst(btn);universalDownload(blob,fname);incrementDownloadCount();
    btn.innerHTML='<i class="bi bi-check-circle-fill"></i> DOWNLOADED!';
    setTimeout(()=>{btn.classList.remove('success');btn.innerHTML='<i class="bi bi-download"></i> &nbsp; DOWNLOAD PDF';checkFields();},2500);
  }catch(e){
    btn.classList.remove('generating');btn.innerHTML='<i class="bi bi-download"></i> &nbsp; DOWNLOAD PDF';checkFields();
    showToast('error','Generation Failed','Could not create PDF. Try again or switch browser.',5000);
  }
}

/* ═══ MERGE LOGIC ═══ */
let mergeItems=[];let dragSrcIdx=null;
const mergeCardsEl=document.getElementById('mergeCards');
const mergeEmptyEl=document.getElementById('mergeEmpty');
const dz=document.getElementById('mergeDropzone');
['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('over');}));
dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
dz.addEventListener('drop',e=>{
  e.preventDefault();dz.classList.remove('over');
  const files=[...e.dataTransfer.files].filter(f=>f.type==='application/pdf');
  if(files.length)handleMergeFiles(files);
});
function fmtSize(bytes){if(bytes<1024)return bytes+'B';if(bytes<1024*1024)return(bytes/1024).toFixed(1)+'KB';return(bytes/(1024*1024)).toFixed(1)+'MB';}

// async function handleMergeFiles(files){
//   for(const f of files){
//     const bytes=new Uint8Array(await f.arrayBuffer());
//     const id='f'+Date.now()+Math.random();let pageCount=1,thumb=null;
//     try{
//       const pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise;pageCount=pdf.numPages;
//       const page=await pdf.getPage(1);const vp=page.getViewport({scale:0.42});
//       const canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;
//       await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;thumb=canvas;
//     }catch(e){}
//     mergeItems.push({id,name:f.name,bytes,pageCount,isCover:false,thumb,size:f.size});
//   }
//   document.getElementById('mergeFileInput').value='';
//   renderMergeCards();updateMergeSteps();
//   showToast('info','Files Added',`${files.length} PDF${files.length>1?'s':''} added to queue.`,3000);
// }
async function handleMergeFiles(files){

  // guard condition
  if(!files || files.length === 0){
    return;
  }

  // only allow PDF
  files = [...files].filter(f => f.type === "application/pdf");

  if(files.length === 0){
    showToast('warning','Invalid File','Only PDF files are allowed.');
    return;
  }

  for(const f of files){
    const bytes=new Uint8Array(await f.arrayBuffer());
    const id='f'+Date.now()+Math.random();
    let pageCount=1,thumb=null;

    try{
      const pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise;
      pageCount=pdf.numPages;

      const page=await pdf.getPage(1);
      const vp=page.getViewport({scale:0.42});

      const canvas=document.createElement('canvas');
      canvas.width=vp.width;
      canvas.height=vp.height;

      await page.render({
        canvasContext:canvas.getContext('2d'),
        viewport:vp
      }).promise;

      thumb=canvas;

    }catch(e){}

    mergeItems.push({
      id,
      name:f.name,
      bytes,
      pageCount,
      isCover:false,
      thumb,
      size:f.size
    });
  }

  document.getElementById('mergeFileInput').value='';
  renderMergeCards();
  updateMergeSteps();

  showToast(
    'info',
    'Files Added',
    `${files.length} PDF${files.length>1?'s':''} added to queue.`,
    3000
  );
}
function getCoverModeDecision(){
  const aC=countFilledFields('assignment');const lC=countFilledFields('lab');
  const aT=REQUIRED_FIELDS['assignment'].length;const lT=REQUIRED_FIELDS['lab'].length;
  if(aC===0&&lC===0)return null;if(aC>0&&lC===0)return'assignment';if(lC>0&&aC===0)return'lab';
  if(aC/aT>lC/lT)return'assignment';if(lC/lT>aC/aT)return'lab';return'equal';
}
function selectCoverChoice(choice){
  coverChoiceSelected=choice;
  document.getElementById('cco-assignment').classList.toggle('selected',choice==='assignment');
  document.getElementById('cco-lab').classList.toggle('selected',choice==='lab');
}
async function confirmCoverChoice(){closeModal('chooseCoverModal');await addCoverWithMode(coverChoiceSelected);}
async function addCoverToPile(){
  const decision=getCoverModeDecision();
  if(decision===null){showToast('warning','No Cover Data','Please fill in fields in the Assignment or Lab Report tab first.',5000);return;}
  if(decision==='equal'){
    const aC=countFilledFields('assignment');const lC=countFilledFields('lab');
    document.getElementById('cco-a-count').textContent=aC+' field'+(aC!==1?'s':'')+' filled';
    document.getElementById('cco-l-count').textContent=lC+' field'+(lC!==1?'s':'')+' filled';
    const aFields=REQUIRED_FIELDS['assignment'].filter(id=>{const e=document.getElementById(id);return e&&e.value.trim();}).map(id=>({a_topicName:'Topic',a_courseCode:'Code',a_courseTitle:'Title',a_tName:'Teacher',a_tDept:'Dept',a_sName:'Name',a_sId:'ID',a_sSec:'Section',a_sSem:'Semester',a_sDept:'S.Dept',a_subDate:'Date'}[id]||id)).join(', ');
    const lFields=REQUIRED_FIELDS['lab'].filter(id=>{const e=document.getElementById(id);return e&&e.value.trim();}).map(id=>({l_expName:'Exp Name',l_expNo:'Exp No',l_courseCode:'Code',l_courseTitle:'Title',l_tName:'Teacher',l_tDept:'Dept',l_sName:'Name',l_sId:'ID',l_sSec:'Section',l_sSem:'Semester',l_sDept:'S.Dept',l_subDate:'Date'}[id]||id)).join(', ');
    document.getElementById('cco-a-fields').textContent=aFields||'';document.getElementById('cco-l-fields').textContent=lFields||'';
    selectCoverChoice('assignment');openModal('chooseCoverModal');return;
  }
  await addCoverWithMode(decision);
}
async function addCoverWithMode(modeKey){
  mergeItems=mergeItems.filter(x=>!x.isCover);
  const btn=document.getElementById('addCoverBtn');btn.innerHTML='<i class="bi bi-hourglass-split" style="display:inline-block;animation:spin 1s linear infinite;"></i> Generating...';btn.disabled=true;
  try{
    const blob=await buildCoverPDFBlobForMode(modeKey);
    const bytes=new Uint8Array(await blob.arrayBuffer());let thumb=null;
    try{
      const pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise;const page=await pdf.getPage(1);
      const vp=page.getViewport({scale:0.42});const canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;
      await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;thumb=canvas;
    }catch(e){}
    const label=modeKey==='lab'?'Lab Cover (Generated)':'Assignment Cover (Generated)';
    mergeItems.unshift({id:'cover',name:label,bytes,pageCount:1,isCover:true,thumb,size:blob.size});
    document.getElementById('coverNoteWrap').style.display='block';
    renderMergeCards();updateMergeSteps();
    showToast('success','Cover Added','Your cover page is ready in the queue.',3000);
  }catch(e){showToast('error','Cover Generation Failed','Fill in cover details first then try again.',5000);}
  btn.innerHTML='<i class="bi bi-plus-circle"></i> ADD MY COVER PAGE';btn.disabled=false;
}

function renderMergeCards(){
  mergeCardsEl.innerHTML='';
  const total=mergeItems.reduce((a,x)=>a+x.pageCount,0);const totalSize=mergeItems.reduce((a,x)=>a+(x.size||0),0);
  const hasItems=mergeItems.length>0;
  document.getElementById('cardCount').textContent=mergeItems.length+' file'+(mergeItems.length!==1?'s':'');
  document.getElementById('mergeDlBtn').disabled=mergeItems.length<2;
  document.getElementById('clearBtn').style.display=hasItems?'':'none';
  document.getElementById('dragHint').style.display=mergeItems.length>1?'flex':'none';
  if(!hasItems){mergeCardsEl.appendChild(mergeEmptyEl);document.getElementById('coverNoteWrap').style.display='none';document.getElementById('mergeInfo').textContent='Add at least 2 PDFs to merge';return;}
  document.getElementById('mergeInfo').innerHTML=`<strong>${mergeItems.length} PDF${mergeItems.length!==1?'s':''}</strong> · ${total} page${total!==1?'s':''} · ${fmtSize(totalSize)}`;
  mergeItems.forEach((item,idx)=>{
    const card=document.createElement('div');card.className='pdf-card'+(item.isCover?' is-cover':'');card.draggable=true;card.dataset.idx=idx;
    const badge=document.createElement('div');badge.className='card-badge';badge.textContent=item.isCover?'COVER':'#'+(idx+1);card.appendChild(badge);
    const rm=document.createElement('button');rm.className='card-remove';rm.innerHTML='&times;';rm.title='Remove';
    rm.onclick=e=>{e.stopPropagation();mergeItems.splice(idx,1);if(item.isCover)document.getElementById('coverNoteWrap').style.display='none';renderMergeCards();updateMergeSteps();};card.appendChild(rm);
    const thumb=document.createElement('div');thumb.className='card-thumb';
    if(item.thumb){const c=item.thumb.cloneNode(true);c.style.cssText='width:100%;height:100%;object-fit:contain;display:block;';thumb.appendChild(c);}
    else{thumb.innerHTML='<div class="card-thumb-placeholder"><i class="bi bi-file-earmark-pdf" style="font-size:30px;color:#b0c2e8;"></i></div>';}card.appendChild(thumb);
    const info=document.createElement('div');info.className='card-info';
    info.innerHTML=`<div class="card-name" title="${item.name}">${item.name}</div><div class="card-meta"><span class="card-pages">${item.pageCount} pg${item.pageCount!==1?'s':''}</span><span class="card-size">${fmtSize(item.size||0)}</span></div>`;card.appendChild(info);
    const arrows=document.createElement('div');arrows.className='card-arrows';
    const lb=document.createElement('button');lb.className='arr-btn';lb.textContent='◀';lb.title='Move left';lb.disabled=idx===0;
    lb.onclick=e=>{e.stopPropagation();[mergeItems[idx-1],mergeItems[idx]]=[mergeItems[idx],mergeItems[idx-1]];renderMergeCards();updateMergeSteps();};
    const rb=document.createElement('button');rb.className='arr-btn';rb.textContent='▶';rb.title='Move right';rb.disabled=idx===mergeItems.length-1;
    rb.onclick=e=>{e.stopPropagation();[mergeItems[idx],mergeItems[idx+1]]=[mergeItems[idx+1],mergeItems[idx]];renderMergeCards();updateMergeSteps();};
    arrows.appendChild(lb);arrows.appendChild(rb);card.appendChild(arrows);
    card.addEventListener('dragstart',e=>{dragSrcIdx=idx;card.classList.add('dragging');e.dataTransfer.effectAllowed='move';});
    card.addEventListener('dragend',()=>card.classList.remove('dragging'));
    card.addEventListener('dragover',e=>{e.preventDefault();card.classList.add('drag-over');});
    card.addEventListener('dragleave',()=>card.classList.remove('drag-over'));
    card.addEventListener('drop',e=>{e.preventDefault();card.classList.remove('drag-over');if(dragSrcIdx===null||dragSrcIdx===idx)return;const moved=mergeItems.splice(dragSrcIdx,1)[0];mergeItems.splice(idx,0,moved);dragSrcIdx=null;renderMergeCards();updateMergeSteps();});
    mergeCardsEl.appendChild(card);
  });
}

function clearAll(){mergeItems=[];renderMergeCards();updateMergeSteps();showToast('info','Queue Cleared','All PDFs removed from the merge queue.',3000);}

async function doMerge(){
  if(mergeItems.length<2)return;
  const btn=document.getElementById('mergeDlBtn');
  btn.classList.add('generating');btn.innerHTML='<i class="bi bi-arrow-repeat" style="display:inline-block;animation:spin 1s linear infinite;margin-right:6px"></i> MERGING...';btn.disabled=true;
  const prog=document.getElementById('mergeProgress');const bar=document.getElementById('mergeProgressBar');
  prog.classList.add('show');bar.style.width='0%';
  try{
    const{PDFDocument}=PDFLib;const merged=await PDFDocument.create();
    for(let i=0;i<mergeItems.length;i++){
      bar.style.width=Math.round((i/mergeItems.length)*88)+'%';
      const src=await PDFDocument.load(mergeItems[i].bytes);
      const pages=await merged.copyPages(src,src.getPageIndices());pages.forEach(p=>merged.addPage(p));
    }
    bar.style.width='96%';const out=await merged.save();bar.style.width='100%';
    const blob=new Blob([out],{type:'application/pdf'});
    btn.classList.remove('generating');btn.classList.add('success');
    triggerParticleBurst(btn);universalDownload(blob,'DIU_Merged_Document-diucoverpoint.pdf');incrementDownloadCount();
    btn.innerHTML='<i class="bi bi-check-circle-fill"></i> DOWNLOADED!';
    setTimeout(()=>{btn.classList.remove('success');btn.innerHTML='<i class="bi bi-download"></i> &nbsp; DOWNLOAD MERGED PDF';btn.disabled=mergeItems.length<2;prog.classList.remove('show');bar.style.width='0%';},2500);
  }catch(err){
    btn.classList.remove('generating');
    showToast('error','Merge Failed','Make sure PDFs are valid and not password-protected.',6000);
    btn.innerHTML='<i class="bi bi-download"></i> &nbsp; DOWNLOAD MERGED PDF';btn.disabled=false;prog.classList.remove('show');
  }
}

// Initialize
render();
updateResetBarVisibility();

// Fix initial state of optional field toggles (ensure disabled fields look disabled)
(function(){
  Object.values(optGroupToField).forEach(fieldId=>{
    const inp=document.getElementById(fieldId);
    const fg=document.getElementById('fg-'+fieldId);
    const btn=document.getElementById('toggle-'+fieldId);

    if(inp && inp.disabled){
      if(fg){
        fg.classList.add('fg-optional');
        fg.classList.remove('enabled');
      }
      if(btn) btn.classList.remove('on');
    }
  });
})();
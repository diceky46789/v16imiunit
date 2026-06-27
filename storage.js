const $=id=>document.getElementById(id);
const ROOT_FOLDER_ID="root";
const UNFILED_FOLDER_ID="unfiled";

let baseProblems=[], customProblems=[], csvSets=[], problems=[], filtered=[], idx=0, voices=[];
let activeFolderId="all";

const state={
  ratings:loadJson("ratings_v160",{}),
  excluded:loadJson("excluded_v160",{}),
  settings:loadJson("settings_v160",{}),
  folders:loadJson("folders_v160",[]),
  folderOrders:loadJson("folderOrders_v160",{}),
  lastProgress:loadJson("lastProgress_v160",null)
};

function loadJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(e){return fallback;}}
function saveJson(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}}
function saveState(){
  saveJson("ratings_v160",state.ratings);
  saveJson("excluded_v160",state.excluded);
  saveJson("settings_v160",state.settings);
  saveJson("folders_v160",state.folders);
  saveJson("folderOrders_v160",state.folderOrders);
}
function saveCsvSets(){saveJson("csvSets_v160",csvSets);}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function attr(s){return esc(s).replace(/"/g,"&quot;");}
function current(){return filtered[idx];}
function hay(p){return [p.jp,p.en,p.category,p.explanation,p.csvSetName,...(p.slots||[]).flatMap(s=>[s.text,s.label])].join(" ").toLowerCase();}
function wait(ms){return new Promise(r=>setTimeout(r,ms));}
function showTab(id){
  document.querySelectorAll(".tabPage").forEach(p=>p.classList.remove("activePage"));
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  $(id).classList.add("activePage");
  const tab=document.querySelector(`.tab[data-tab="${id}"]`);
  if(tab)tab.classList.add("active");
}
function status(id,msg,kind=""){const el=$(id);if(el){el.className="customStatus "+kind;el.textContent=msg;}}
function saveProgress(){
  const p=current(); if(!p)return;
  state.lastProgress={id:p.id,idx,activeFolderId,category:$("categorySelect")?.value||"すべて",order:$("orderSelect")?.value||"sequential",search:$("searchInput")?.value||"",time:Date.now()};
  saveJson("lastProgress_v160",state.lastProgress);
}
function restoreProgress(){
  const s=state.lastProgress; if(!s)return false;
  activeFolderId=s.activeFolderId||"all";
  if($("categorySelect")&&s.category)$("categorySelect").value=s.category;
  if($("orderSelect")&&s.order)$("orderSelect").value=s.order;
  if($("searchInput")&&s.search)$("searchInput").value=s.search;
  rebuildProblems();
  applyFilters();
  const pos=filtered.findIndex(p=>p.id===s.id);
  if(pos>=0){idx=pos;return true;}
  if(Number.isFinite(s.idx)&&s.idx>=0&&s.idx<filtered.length){idx=s.idx;return true;}
  return false;
}

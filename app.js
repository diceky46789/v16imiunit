async function load(){
  const res=await fetch("problems.json",{cache:"no-store"});
  baseProblems=await res.json();
  customProblems=loadJson("customProblems_v160",[]);
  csvSets=loadJson("csvSets_v160",[]);
  migrateOldDataIfNeeded();
  rebuildProblems();setupCategories();applyFilters();setupVoices();restoreUiSettings();restoreProgress();
  renderAll();setupEvents();setupPracticeSwipe();setupAudioSwipe();
}
function migrateOldDataIfNeeded(){
  if(csvSets.length)return;
  const old=loadJson("csvSets_v154",[]);
  if(old&&old.length){csvSets=old.map(s=>({...s,createdAtMs:s.createdAtMs||Date.parse(s.createdAt)||Number(String(s.id||"").match(/\d{10,}/)?.[0]||Date.now())}));saveCsvSets();}
  const oldFolders=loadJson("folderState_v154",null);
  if(oldFolders&&Array.isArray(oldFolders.folders)&&!state.folders.length){state.folders=oldFolders.folders;saveState();}
}
function renderAll(){renderPractice();renderFolders();updateAudioSelectors();renderList();}
function restoreUiSettings(){
  if(state.settings.hint)$("hintLevel").value=state.settings.hint;
  if(state.settings.font)$("fontRange").value=state.settings.font;
  document.body.style.fontSize=($("fontRange").value||20)+"px";
  audioOrder=state.settings.audioOrder||"jp-en";
  $("audioOrderBtn").textContent=audioOrder==="en-jp"?"順番: 英語→日本語":"順番: 日本語→英語";
}
function persistSettings(){
  state.settings.hint=$("hintLevel").value;state.settings.font=$("fontRange").value;state.settings.jaVoice=$("jaVoice").value;state.settings.enVoice=$("enVoice").value;
  state.settings.audioOrder=audioOrder;state.settings.audioFolder=$("audioFolderSelect").value;state.settings.audioSet=$("audioSetSelect").value;
  document.body.style.fontSize=$("fontRange").value+"px";saveState();
}
function setupEvents(){
  document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>showTab(t.dataset.tab)));
  ["categorySelect","orderSelect"].forEach(id=>$(id).addEventListener("change",()=>{applyFilters();idx=0;renderPractice();renderList();}));
  $("searchInput").addEventListener("input",()=>{applyFilters();idx=0;renderPractice();renderList();});
  $("hintLevel").addEventListener("change",()=>{persistSettings();renderPractice();});
  $("fontRange").addEventListener("change",persistSettings);
  $("showAnswerBtn").addEventListener("click",showAnswer);
  $("clearBtn").addEventListener("click",clearSlots);
  $("practiceExplainBtn").addEventListener("click",togglePracticeExplanation);
  $("nextBtn").addEventListener("click",next);$("prevBtn").addEventListener("click",prev);
  $("speakJpBtn").addEventListener("click",()=>speakCurrent("jp"));$("speakEnBtn").addEventListener("click",()=>speakCurrent("en"));
  $("problemSlider").addEventListener("input",()=>{idx=Math.min(Math.max(Number($("problemSlider").value)-1,0),filtered.length-1);renderPractice();});
  $("excludeBtn").addEventListener("click",()=>{const p=current();if(!p)return;state.excluded[p.id]=!state.excluded[p.id];saveState();applyFilters();renderPractice();renderList();});
  document.querySelectorAll(".ratingRow button[data-rate]").forEach(b=>b.addEventListener("click",()=>{const p=current();if(!p)return;state.ratings[p.id]=Number(b.dataset.rate);saveState();next();}));
  $("resetBtn").addEventListener("click",()=>{if(confirm("履歴をリセットしますか？")){state.ratings={};state.excluded={};saveState();applyFilters();renderPractice();renderList();}});
  $("importCsvBtn").addEventListener("click",importCsv);$("templateBtn").addEventListener("click",templateCsv);
  $("addFolderBtn").addEventListener("click",addFolder);$("showAllBtn").addEventListener("click",()=>selectFolder(ROOT_FOLDER_ID));$("showUnfiledBtn").addEventListener("click",()=>selectFolder(UNFILED_FOLDER_ID));
  $("audioSpeakJpBtn").addEventListener("click",()=>speakCurrent("jp"));$("audioSpeakEnBtn").addEventListener("click",()=>speakCurrent("en"));
  $("audioPlayBtn").addEventListener("click",()=>audioMode?stopAudio():playAudio(false));$("audioContinuousBtn").addEventListener("click",()=>audioMode?stopAudio():playAudio(true));$("audioStopBtn").addEventListener("click",stopAudio);
  $("audioOrderBtn").addEventListener("click",()=>{audioOrder=audioOrder==="jp-en"?"en-jp":"jp-en";$("audioOrderBtn").textContent=audioOrder==="en-jp"?"順番: 英語→日本語":"順番: 日本語→英語";persistSettings();});
  $("audioFolderSelect").addEventListener("change",()=>{state.settings.audioFolder=$("audioFolderSelect").value;state.settings.audioSet="all";updateAudioSelectors();persistSettings();});
  $("audioSetSelect").addEventListener("change",persistSettings);
  ["jaVoice","enVoice","audioJaRate","audioEnRate","audioJaCount","audioEnCount","audioSentenceGapSec","audioNextGapSec","audioRepeatCheck","audioRandomCheck"].forEach(id=>$(id).addEventListener("change",persistSettings));
  $("listModeSelect").addEventListener("change",renderList);$("listLabelSelect").addEventListener("change",renderList);$("listSearch").addEventListener("input",renderList);
}
window.addEventListener("DOMContentLoaded",()=>load().catch(e=>{console.error(e);$("jpText").textContent="読み込みエラー: "+e.message;}));
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));

function csvSetCreatedTime(set){
  if(!set)return 0;
  if(Number.isFinite(set.createdAtMs))return set.createdAtMs;
  const parsed=Date.parse(set.createdAt||"");
  if(!Number.isNaN(parsed))return parsed;
  const idNum=String(set.id||"").match(/\d{10,}/);
  return idNum?Number(idNum[0]):0;
}
function baseOrderedSets(sets){
  return (sets||[]).slice().sort((a,b)=>{
    const ta=csvSetCreatedTime(a),tb=csvSetCreatedTime(b);
    if(ta!==tb)return ta-tb;
    return String(a.id||"").localeCompare(String(b.id||""));
  });
}
function folderOrderKey(folderId){return folderId||ROOT_FOLDER_ID;}
function addSetToFolderOrder(folderId,setId){
  const key=folderOrderKey(folderId);
  if(!state.folderOrders[key])state.folderOrders[key]=[];
  Object.keys(state.folderOrders).forEach(k=>state.folderOrders[k]=state.folderOrders[k].filter(id=>id!==setId));
  if(!state.folderOrders[key].includes(setId))state.folderOrders[key].push(setId);
}
function getSetsInFolder(folderId){
  if(folderId==="all"||folderId===ROOT_FOLDER_ID)return csvSets.slice();
  if(folderId===UNFILED_FOLDER_ID)return csvSets.filter(s=>!s.folderId);
  return csvSets.filter(s=>s.folderId===folderId);
}
function getOrderedCsvSets(folderId="all"){
  const sets=getSetsInFolder(folderId);
  const key=folderOrderKey(folderId==="all"?ROOT_FOLDER_ID:folderId);
  const manual=state.folderOrders[key]||[];
  const map=new Map(sets.map(s=>[s.id,s]));
  const used=new Set(),out=[];
  manual.forEach(id=>{if(map.has(id)){out.push(map.get(id));used.add(id);}});
  out.push(...baseOrderedSets(sets.filter(s=>!used.has(s.id))));
  return out;
}
function orderedProblemsFromSets(sets){
  return (sets||[]).flatMap(set=>(set.problems||[]).map((p,i)=>({...p,csvSetId:set.id,csvSetName:set.name,csvSetOrder:csvSetCreatedTime(set),csvProblemOrder:Number.isFinite(p.csvProblemOrder)?p.csvProblemOrder:i})));
}
function getPracticeProblemsForActiveFolder(){
  if(activeFolderId==="all")return [...baseProblems,...customProblems,...orderedProblemsFromSets(getOrderedCsvSets(ROOT_FOLDER_ID))];
  if(activeFolderId===UNFILED_FOLDER_ID||activeFolderId===ROOT_FOLDER_ID||state.folders.some(f=>f.id===activeFolderId))return orderedProblemsFromSets(getOrderedCsvSets(activeFolderId));
  return [...baseProblems,...customProblems,...orderedProblemsFromSets(getOrderedCsvSets(ROOT_FOLDER_ID))];
}
function rebuildProblems(){problems=getPracticeProblemsForActiveFolder();}
function applyFilters(){
  const cat=$("categorySelect")?.value||"すべて", q=($("searchInput")?.value||"").trim().toLowerCase(), order=$("orderSelect")?.value||"sequential";
  filtered=problems.filter(p=>{
    if(cat!="すべて"&&p.category!==cat)return false;
    if(order==="excluded"&&!state.excluded[p.id])return false;
    if(order!=="excluded"&&state.excluded[p.id])return false;
    if(q&&!hay(p).includes(q))return false;
    return true;
  });
  if(order==="random")filtered.sort(()=>Math.random()-.5);
  if(order==="weak")filtered.sort((a,b)=>(state.ratings[a.id]||99)-(state.ratings[b.id]||99));
  idx=Math.min(idx,Math.max(0,filtered.length-1));
}
function setupCategories(){
  const cur=$("categorySelect")?.value||"すべて";
  const cats=["すべて",...Array.from(new Set(problems.map(p=>p.category).filter(Boolean)))];
  $("categorySelect").innerHTML=cats.map(c=>`<option value="${attr(c)}">${esc(c)}</option>`).join("");
  if(cats.includes(cur))$("categorySelect").value=cur;
}
function moveSetInFolder(folderId,setId,delta){
  const key=folderOrderKey(folderId);
  const ids=getOrderedCsvSets(folderId).map(s=>s.id);
  const i=ids.indexOf(setId),j=i+delta;
  if(i<0||j<0||j>=ids.length)return;
  [ids[i],ids[j]]=[ids[j],ids[i]];
  state.folderOrders[key]=ids;
  saveState();
  rebuildProblems();applyFilters();renderAll();
}
function moveCsvSetToFolder(setId,newFolderId){
  const set=csvSets.find(s=>s.id===setId); if(!set)return;
  Object.keys(state.folderOrders).forEach(k=>state.folderOrders[k]=(state.folderOrders[k]||[]).filter(id=>id!==setId));
  set.folderId=(newFolderId===ROOT_FOLDER_ID||newFolderId==="all"||newFolderId===UNFILED_FOLDER_ID)?null:newFolderId;
  addSetToFolderOrder(set.folderId||ROOT_FOLDER_ID,setId);
  saveCsvSets();saveState();rebuildProblems();applyFilters();renderAll();status("folderStatus","CSVセットを移動しました。","ok");
}


function resetCurrentFolderOrder(){
  const folderId=activeFolderId==="all"?ROOT_FOLDER_ID:activeFolderId;
  const key=folderOrderKey(folderId);
  if(!confirm("このフォルダ内のCSVセット順を追加日時の古い順に戻しますか？"))return;
  delete state.folderOrders[key];
  saveState();
  rebuildProblems();applyFilters();renderAll();
  status("folderStatus","このフォルダの順番を追加順に戻しました。","ok");
}

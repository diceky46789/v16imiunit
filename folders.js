function getChildFolders(parentId){return state.folders.filter(f=>(f.parentId||ROOT_FOLDER_ID)===parentId);}
function getFolder(id){return state.folders.find(f=>f.id===id);}
function folderOptionsHtml(selected=ROOT_FOLDER_ID){
  const lines=[`<option value="${ROOT_FOLDER_ID}" ${selected===ROOT_FOLDER_ID?'selected':''}>最上位</option>`];
  function walk(parent,depth){
    getChildFolders(parent).forEach(f=>{
      lines.push(`<option value="${attr(f.id)}" ${selected===f.id?'selected':''}>${"　".repeat(depth)}${esc(f.name)}</option>`);
      walk(f.id,depth+1);
    });
  }
  walk(ROOT_FOLDER_ID,1);
  return lines.join("");
}
function renderFolderParentSelect(){const el=$("folderParentSelect");if(el)el.innerHTML=folderOptionsHtml(ROOT_FOLDER_ID);}
function renderFolderTree(){
  const el=$("folderTree");if(!el)return;
  function node(f){
    const children=getChildFolders(f.id).map(node).join("");
    return `<div class="folderNode ${activeFolderId===f.id?'activeFolder':''}">
      <div class="folderNodeTop">
        <button class="folderNameBtn" onclick="selectFolder('${attr(f.id)}')">${esc(f.name)}</button>
        <button class="folderSmallBtn" onclick="renameFolder('${attr(f.id)}')">名前変更</button>
        <button class="folderSmallBtn" onclick="changeFolderParent('${attr(f.id)}')">移動</button>
        <button class="folderSmallBtn" onclick="deleteFolder('${attr(f.id)}')">削除</button>
      </div>
      <div class="folderChildren">${children}</div>
    </div>`;
  }
  el.innerHTML=`<div class="folderNode ${activeFolderId===ROOT_FOLDER_ID?'activeFolder':''}"><div class="folderNodeTop"><button class="folderNameBtn" onclick="selectFolder('${ROOT_FOLDER_ID}')">全フォルダ内のCSV</button></div></div>
  <div class="folderNode ${activeFolderId===UNFILED_FOLDER_ID?'activeFolder':''}"><div class="folderNodeTop"><button class="folderNameBtn" onclick="selectFolder('${UNFILED_FOLDER_ID}')">未分類CSV</button></div></div>`+getChildFolders(ROOT_FOLDER_ID).map(node).join("");
}
function renderFolderSetList(){
  const el=$("folderSetList");if(!el)return;
  const folderId=activeFolderId==="all"?ROOT_FOLDER_ID:activeFolderId;
  const sets=getOrderedCsvSets(folderId);
  if(!sets.length){el.innerHTML="<div class='csvSetItem'>このフォルダ内にCSVセットはありません。</div>";return;}
  el.innerHTML=sets.map((set,i)=>`<div class="csvSetItem">
    <div class="csvSetTitle"><span>${esc(set.name)}</span><span>${(set.problems||[]).length}問</span></div>
    <div class="csvSetMeta">追加日時: ${esc(set.createdAt||"")}</div>
    <div class="csvOrderButtons"><button onclick="moveSetInFolder('${attr(folderId)}','${attr(set.id)}',-1)" ${i===0?'disabled':''}>▲ 上へ</button><button onclick="moveSetInFolder('${attr(folderId)}','${attr(set.id)}',1)" ${i===sets.length-1?'disabled':''}>▼ 下へ</button></div>
    <div class="folderSetMove"><label>移動先<select id="moveSelect_${attr(set.id)}">${folderOptionsHtml(set.folderId||ROOT_FOLDER_ID)}</select></label><button onclick="moveCsvSetToFolder('${attr(set.id)}',$('moveSelect_${attr(set.id)}').value)">移動</button></div>
  </div>`).join("");
}
function renderFolders(){renderFolderParentSelect();renderFolderTree();renderFolderSetList();}
function selectFolder(folderId){activeFolderId=folderId;rebuildProblems();setupCategories();applyFilters();idx=0;renderAll();showTab("practice");}
function addFolder(){
  const name=$("folderNameInput").value.trim();if(!name){status("folderStatus","フォルダ名を入力してください。","error");return;}
  const parentId=$("folderParentSelect").value||ROOT_FOLDER_ID;
  state.folders.push({id:"F"+Date.now(),name,parentId});
  $("folderNameInput").value="";saveState();renderAll();status("folderStatus","フォルダを作成しました。","ok");
}
function renameFolder(id){
  const f=getFolder(id);if(!f)return;
  const name=prompt("新しいフォルダ名を入力してください。",f.name||"");if(name===null)return;
  const t=name.trim();if(!t){status("folderStatus","フォルダ名を入力してください。","error");return;}
  f.name=t;saveState();renderAll();status("folderStatus","フォルダ名を変更しました。","ok");
}
function isDescendant(childId,parentId){
  let cur=getFolder(childId);
  while(cur&&cur.parentId){if(cur.parentId===parentId)return true;cur=getFolder(cur.parentId);}
  return false;
}
function changeFolderParent(id){
  const f=getFolder(id);if(!f)return;
  const candidates=[{id:ROOT_FOLDER_ID,name:"最上位"},...state.folders.filter(x=>x.id!==id&&!isDescendant(x.id,id)).map(x=>({id:x.id,name:x.name}))];
  const msg="移動先を番号で選んでください。\n"+candidates.map((x,i)=>(i+1)+". "+x.name).join("\n");
  const ans=prompt(msg,"1");if(ans===null)return;
  const n=Number(ans);if(!Number.isInteger(n)||n<1||n>candidates.length){status("folderStatus","番号が正しくありません。","error");return;}
  f.parentId=candidates[n-1].id;saveState();renderAll();status("folderStatus","フォルダを移動しました。","ok");
}
function deleteFolder(id){
  if(getChildFolders(id).length){status("folderStatus","中にフォルダがあるため削除できません。","error");return;}
  if(csvSets.some(s=>s.folderId===id)){status("folderStatus","中にCSVセットがあるため削除できません。先に移動してください。","error");return;}
  if(!confirm("このフォルダを削除しますか？"))return;
  state.folders=state.folders.filter(f=>f.id!==id);if(activeFolderId===id)activeFolderId="all";saveState();renderAll();
}

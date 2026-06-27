function parseCSVText(text){
  const rows=[];let row=[],cell="",q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(c=='"'&&q&&n=='"'){cell+='"';i++;}
    else if(c=='"'){q=!q;}
    else if(c===","&&!q){row.push(cell);cell="";}
    else if((c==="\n"||c==="\r")&&!q){if(c==="\r"&&n==="\n")i++;row.push(cell);if(row.some(x=>String(x).trim()!==""))rows.push(row);row=[];cell="";}
    else cell+=c;
  }
  if(cell||row.length){row.push(cell);rows.push(row);}
  if(!rows.length)return[];
  const headers=rows.shift().map(h=>h.trim().replace(/^\ufeff/,""));
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||""])));
}
function rowToProblem(r){
  const slots=[];
  for(let i=1;i<=30;i++){
    const text=(r["slot"+i]||"").trim();
    if(text)slots.push({text,label:r["slot"+i+"_label"]||"語順ユニット"});
  }
  return {id:r.id||("CSV"+Date.now()+Math.random().toString(36).slice(2)),category:r.category||"CSV追加",jp:r.jp||"",en:r.en||"",explanation:r.explanation||"CSVから追加した問題です。",slots};
}
async function importCsv(){
  const input=$("csvFileInput");
  if(!input.files||!input.files[0]){status("csvStatus","CSVファイルを選択してください。","error");return;}
  try{
    const file=input.files[0];
    const rows=parseCSVText(await file.text());
    const imported=rows.map(rowToProblem).filter(p=>p.jp&&p.en&&p.slots.length);
    if(!imported.length)throw new Error("jp, en, slot1 が必要です。");
    const setId="SET"+Date.now();
    const name=($("csvSetNameInput").value||"").trim()||file.name.replace(/\.csv$/i,"")||("CSVセット"+(csvSets.length+1));
    const createdAtMs=Date.now();
    const createdAt=new Date(createdAtMs).toLocaleString();
    const tagged=imported.map((p,i)=>({...p,id:setId+"_"+(i+1),category:p.category||name,csvProblemOrder:i}));
    const folderId=activeFolderId&&activeFolderId!=="all"&&activeFolderId!==ROOT_FOLDER_ID&&activeFolderId!==UNFILED_FOLDER_ID?activeFolderId:null;
    csvSets.push({id:setId,name,createdAt,createdAtMs,folderId,problems:tagged});
    addSetToFolderOrder(folderId||ROOT_FOLDER_ID,setId);
    saveCsvSets();saveState();
    rebuildProblems();setupCategories();applyFilters();idx=filtered.findIndex(p=>p.csvSetId===setId);if(idx<0)idx=0;
    renderAll();showTab("practice");status("csvStatus","CSVセット「"+name+"」として"+imported.length+"問を追加しました。","ok");
  }catch(e){status("csvStatus","CSV読み込みに失敗しました。\n"+e.message,"error");}
}
function csvEscape(v){v=String(v??"");return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
function downloadText(filename,text){
  const blob=new Blob(["\ufeff"+text],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function templateCsv(){
  const headers=["id","category","jp","en"];for(let i=1;i<=30;i++)headers.push("slot"+i,"slot"+i+"_label");headers.push("explanation");
  const make=()=>Object.fromEntries(headers.map(h=>[h,""]));
  const r=make();Object.assign(r,{id:"SAMPLE001",category:"サンプル",jp:"患者はまだ退院していない。",en:"The patient has not been discharged yet.",slot1:"The patient",slot1_label:"主語",slot2:"has",slot2_label:"意味ユニット",slot3:"not",slot3_label:"述語前副詞",slot4:"been discharged",slot4_label:"述語",slot5:"yet",slot5_label:"述語後副詞",explanation:"英語の出現順にslotを並べます。"});
  const csv=headers.join(",")+"\n"+headers.map(h=>csvEscape(r[h])).join(",");
  downloadText("word_order_slot_template_slot30.csv",csv);
  status("csvStatus","テンプレートCSVをダウンロードしました。","ok");
}

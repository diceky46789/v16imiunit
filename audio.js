let audioMode=false,audioToken=0,audioOrder="jp-en";
function setupVoices(){
  function fill(){
    voices=speechSynthesis.getVoices();
    const ja=voices.filter(v=>v.lang.startsWith("ja")),en=voices.filter(v=>v.lang.startsWith("en"));
    $("jaVoice").innerHTML=ja.map(v=>`<option value="${attr(v.name)}">${esc(v.name)} (${v.lang})</option>`).join("");
    $("enVoice").innerHTML=en.map(v=>`<option value="${attr(v.name)}">${esc(v.name)} (${v.lang})</option>`).join("");
    if(state.settings.jaVoice)$("jaVoice").value=state.settings.jaVoice;
    if(state.settings.enVoice)$("enVoice").value=state.settings.enVoice;
  }
  fill();speechSynthesis.onvoiceschanged=fill;
}
function chunkText(text,maxLen=80){
  const parts=[];let buf="";
  String(text).split(/([。．！？!?、，,])/).forEach(t=>{if((buf+t).length>maxLen&&buf){parts.push(buf);buf=t}else buf+=t});
  if(buf.trim())parts.push(buf);return parts;
}
function stopSpeech(){audioToken++;speechSynthesis.cancel();}
function speakSequence(text,lang,voiceName,token,rate){
  return new Promise(resolve=>{
    const chunks=chunkText(text,lang.startsWith("ja")?55:90);let i=0;
    const run=()=>{if(token!==audioToken){resolve(false);return;}if(i>=chunks.length){resolve(true);return;}
      const u=new SpeechSynthesisUtterance(chunks[i++]);u.lang=lang;u.rate=Number(rate||0.85);
      const v=voices.find(x=>x.name===voiceName)||voices.find(x=>x.lang.startsWith(lang.slice(0,2)));if(v)u.voice=v;
      u.onend=()=>setTimeout(run,80);u.onerror=()=>setTimeout(run,80);speechSynthesis.speak(u);
    };run();
  });
}
async function speakCurrent(kind){
  const p=current();if(!p)return;audioMode=false;stopSpeech();showTab("audio");
  status("audioStatus",(kind==="jp"?"日本語":"英語")+"を再生中です。","ok");
  await speakPart(kind,p,audioToken);
}
function audioProblems(){
  const folderId=$("audioFolderSelect").value||"all",setId=$("audioSetSelect").value||"all";
  if(setId!=="all")return orderedProblemsFromSets(csvSets.filter(s=>s.id===setId)).filter(p=>!state.excluded[p.id]);
  if(folderId==="all")return getPracticeProblemsForActiveFolder().filter(p=>!state.excluded[p.id]);
  return orderedProblemsFromSets(getOrderedCsvSets(folderId)).filter(p=>!state.excluded[p.id]);
}
function updateAudioSelectors(){
  const fs=$("audioFolderSelect"),ss=$("audioSetSelect");if(!fs||!ss)return;
  const folderOpts=[`<option value="all">現在の練習範囲</option>`,`<option value="${ROOT_FOLDER_ID}">全フォルダ内のCSV</option>`,`<option value="${UNFILED_FOLDER_ID}">未分類CSV</option>`];
  function walk(parent,depth){getChildFolders(parent).forEach(f=>{folderOpts.push(`<option value="${attr(f.id)}">${"　".repeat(depth)}${esc(f.name)}</option>`);walk(f.id,depth+1);});}
  walk(ROOT_FOLDER_ID,1);
  const cur=fs.value||state.settings.audioFolder||"all";fs.innerHTML=folderOpts.join("");if([...fs.options].some(o=>o.value===cur))fs.value=cur;
  const sets=fs.value==="all"?getOrderedCsvSets(ROOT_FOLDER_ID):getOrderedCsvSets(fs.value);
  const curSet=state.settings.audioSet||"all";
  ss.innerHTML=`<option value="all">フォルダ内すべて</option>`+sets.map(s=>`<option value="${attr(s.id)}">${esc(s.name)}（${(s.problems||[]).length}問）</option>`).join("");
  if([...ss.options].some(o=>o.value===curSet))ss.value=curSet;
}
function showAudioNow(kind,p){
  const el=$("audioNowText");if(!p)return;
  el.innerHTML=`<div class="readingLabel">${kind==="jp"?"日本語を再生中":"英語を再生中"}</div><div>${esc(kind==="jp"?p.jp:p.en)}</div>`;
}
async function speakPart(kind,p,token){
  const count=Math.max(1,Math.min(10,Number($(kind==="jp"?"audioJaCount":"audioEnCount").value||1)));
  const rate=Number($(kind==="jp"?"audioJaRate":"audioEnRate").value||0.85);
  const gap=Math.max(0,Number($("audioSentenceGapSec").value||1))*1000;
  for(let i=0;i<count;i++){
    showAudioNow(kind,p);
    const ok=await speakSequence(kind==="jp"?p.jp:p.en,kind==="jp"?"ja-JP":"en-US",$(kind==="jp"?"jaVoice":"enVoice").value,token,rate);
    if(!ok||token!==audioToken)return false;
    if(i<count-1)await wait(gap);
  }
  return true;
}
async function playAudio(continuous=false){
  const list=audioProblems();if(!list.length){status("audioStatus","再生対象がありません。","error");return;}
  audioMode=true;$("audioPlayBtn").textContent="再生中";$("audioContinuousBtn").textContent="連続再生中";showTab("audio");stopSpeech();const token=audioToken;
  let playIndex=$("audioRandomCheck").checked?Math.floor(Math.random()*list.length):Math.max(0,list.findIndex(p=>current()&&p.id===current().id));
  try{
    while(audioMode){
      const p=list[playIndex];if(!p)break;
      filtered=list;idx=playIndex;renderPractice();showTab("audio");status("audioStatus",(playIndex+1)+" / "+list.length+" を再生中です。","ok");
      const order=audioOrder==="en-jp"?["en","jp"]:["jp","en"];
      for(let i=0;i<order.length;i++){const ok=await speakPart(order[i],p,token);if(!ok||!audioMode)throw new Error("stopped");if(i<order.length-1)await wait(Math.max(0,Number($("audioSentenceGapSec").value||1))*1000);}
      await wait(Math.max(0,Number($("audioNextGapSec").value||2))*1000);
      if($("audioRandomCheck").checked)playIndex=Math.floor(Math.random()*list.length);else playIndex++;
      if(playIndex>=list.length){if($("audioRepeatCheck").checked||continuous)playIndex=0;else break;}
    }
  }catch(e){}
  audioMode=false;$("audioPlayBtn").textContent="選択範囲を再生";$("audioContinuousBtn").textContent="連続再生";
}
function stopAudio(){audioMode=false;stopSpeech();$("audioPlayBtn").textContent="選択範囲を再生";$("audioContinuousBtn").textContent="連続再生";status("audioStatus","停止しました。");}
function moveAudio(delta){
  const list=audioProblems();if(!list.length)return;
  const cur=current();let pos=cur?list.findIndex(p=>p.id===cur.id):-1;if(pos<0)pos=idx;pos=(pos+delta+list.length)%list.length;
  const was=audioMode;stopAudio();filtered=list;idx=pos;renderPractice();showTab("audio");$("audioNowText").innerHTML=`<div class="readingLabel">表示中</div><div>${esc(list[pos].jp)}</div><div style="margin-top:8px">${esc(list[pos].en)}</div>`;
  if(was)setTimeout(()=>playAudio(true),250);
}
function setupAudioSwipe(){const el=$("audioSwipeArea");let sx=null,sy=null;el.addEventListener("touchstart",e=>{sx=e.changedTouches[0].clientX;sy=e.changedTouches[0].clientY},{passive:true});el.addEventListener("touchend",e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.2){dx<0?moveAudio(1):moveAudio(-1);}sx=null;sy=null;},{passive:true});}

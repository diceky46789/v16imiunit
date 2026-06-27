function updateSlider(){
  const total=Math.max(filtered.length,1);
  $("problemSlider").max=String(total);$("problemSlider").value=String(Math.min(idx+1,total));$("sliderLabel").textContent=`${Math.min(idx+1,total)} / ${total}`;
}
function renderPractice(){
  const p=current();
  if(!p){$("counter").textContent="0 / 0";$("tagBadge").textContent="問題なし";$("jpText").textContent="条件に合う問題がありません。";$("slotArea").innerHTML="";updateSlider();return;}
  $("counter").textContent=`${idx+1} / ${filtered.length}`;$("tagBadge").textContent=p.csvSetName||p.category||"";$("jpText").textContent=p.jp;updateSlider();
  const hint=$("hintLevel").value;
  $("slotArea").innerHTML=(p.slots||[]).map((s,i)=>{
    const n=i+1;const show=hint==="all"||(Number(hint)>=n&&Number(hint)>0);
    return `<div class="slotBox ${show?'revealed':''}"><div class="slotHeader"><div><span class="slotNumber">slot${n}</span> <span class="slotLabel">${esc(s.label||"語順ユニット")}</span></div><span class="tapHint">${show?'表示中':'タップで表示'}</span></div><div class="slotAnswer" style="${show?'display:block':''}">${esc(s.text)}</div></div>`;
  }).join("");
  document.querySelectorAll("#slotArea .slotBox").forEach(box=>box.addEventListener("click",()=>revealSlot(box)));
  const structure=(p.slots||[]).map((s,i)=>`slot${i+1}（${s.label||"語順ユニット"}）: ${s.text}`).join("\n");
  $("practiceEnText").textContent=p.en;$("practiceStructureText").textContent=structure;$("practiceExText").textContent=p.explanation||"英語の出現順にslot1から順番に入力します。";
  $("practiceExplainBox").style.display="none";
  saveProgress();
}
function revealSlot(box){box.classList.add("revealed");box.querySelector(".slotAnswer").style.display="block";const h=box.querySelector(".tapHint");if(h)h.textContent="表示中";}
function showAnswer(){document.querySelectorAll("#slotArea .slotBox").forEach(revealSlot);}
function clearSlots(){document.querySelectorAll("#slotArea .slotBox").forEach(b=>{b.classList.remove("revealed");b.querySelector(".slotAnswer").style.display="none";const h=b.querySelector(".tapHint");if(h)h.textContent="タップで表示";});}
function next(){if(!filtered.length)return;idx=(idx+1)%filtered.length;renderPractice();}
function prev(){if(!filtered.length)return;idx=(idx-1+filtered.length)%filtered.length;renderPractice();}
function togglePracticeExplanation(){const b=$("practiceExplainBox");b.style.display=b.style.display==="none"||!b.style.display?"block":"none";}
function setupPracticeSwipe(){
  const card=$("practiceCard");let sx=null,sy=null;
  card.addEventListener("touchstart",e=>{sx=e.changedTouches[0].clientX;sy=e.changedTouches[0].clientY},{passive:true});
  card.addEventListener("touchend",e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.4){dx<0?next():prev();}sx=null;sy=null;},{passive:true});
}

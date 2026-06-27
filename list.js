function allSlots(){const out=[];problems.forEach(p=>(p.slots||[]).forEach((s,i)=>out.push({problem:p,slot:s,index:i})));return out;}
function renderList(){
  const labels=[...new Set(allSlots().map(x=>x.slot.label||"語順ユニット"))].sort((a,b)=>a.localeCompare(b));
  const cur=$("listLabelSelect").value||"all";
  $("listLabelSelect").innerHTML=['<option value="all">すべて</option>',...labels.map(l=>`<option value="${attr(l)}">${esc(l)}</option>`)].join("");
  if([...$("listLabelSelect").options].some(o=>o.value===cur))$("listLabelSelect").value=cur;
  const mode=$("listModeSelect").value,label=$("listLabelSelect").value,q=$("listSearch").value.trim().toLowerCase();
  if(mode==="labels"){
    const map=new Map();
    allSlots().forEach(x=>{const lab=x.slot.label||"語順ユニット";if(q&&!lab.toLowerCase().includes(q))return;if(!map.has(lab))map.set(lab,{count:0,terms:new Set()});map.get(lab).count++;map.get(lab).terms.add(x.slot.text);});
    const entries=[...map.entries()].sort((a,b)=>b[1].count-a[1].count);
    $("listStats").textContent=`${entries.length} 分類`;
    $("unitList").innerHTML=entries.map(([lab,r])=>`<div class="unitItem"><div class="unitTitle"><span>${esc(lab)}</span><span class="unitCount">${r.terms.size}種類 / ${r.count}例</span></div></div>`).join("")||"<div class='unitItem'>該当なし</div>";
    return;
  }
  const map=new Map();
  allSlots().forEach(x=>{const lab=x.slot.label||"語順ユニット",term=x.slot.text||"";if(label!=="all"&&lab!==label)return;if(q&&!term.toLowerCase().includes(q)&&!lab.toLowerCase().includes(q)&&!hay(x.problem).includes(q))return;const key=lab+"|||"+term;if(!map.has(key))map.set(key,{label:lab,term,items:[]});map.get(key).items.push(x.problem);});
  const entries=[...map.values()].sort((a,b)=>b.items.length-a.items.length||a.term.localeCompare(b.term));
  $("listStats").textContent=`${entries.length} 語句`;
  $("unitList").innerHTML=entries.map(e=>`<div class="unitItem"><div class="unitTitle"><span>${esc(e.term)}</span><span class="unitCount">${esc(e.label)} / ${e.items.length}例</span></div>${e.items.slice(0,5).map(p=>`<div class="exampleItem"><div class="exampleJp">${esc(p.jp)}</div><div class="exampleEn">${esc(p.en)}</div></div>`).join("")}</div>`).join("")||"<div class='unitItem'>該当なし</div>";
}

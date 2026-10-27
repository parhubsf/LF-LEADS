const STAGES = ["Novo lead","Pesquisado","Contato realizado","Interessado","Em cadastro","Conta aberta","Não convertido"];
const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const $ = id => document.getElementById(id);
const STORAGE_KEY = "lf-leads-v1";
let leads = [];
try { leads = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { leads = []; }

function uid(){ return "lead_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7); }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); renderAll(); }
function esc(v=""){ return String(v).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function initials(name=""){ return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase() || "LE"; }
function toast(msg){ const t=$("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove("show"),2600); }
function stageOptions(selected="Novo lead"){return STAGES.map(s=>`<option ${s===selected?"selected":""}>${esc(s)}</option>`).join("");}
function fillOptions(){
  $("stage").innerHTML=stageOptions();
  $("filter-stage").innerHTML='<option value="">Todas as etapas</option>'+STAGES.map(s=>`<option>${esc(s)}</option>`).join("");
  $("state").innerHTML='<option value="">Selecione</option>'+STATES.map(s=>`<option>${s}</option>`).join("");
  $("filter-state").innerHTML='<option value="">Todos os estados</option>'+STATES.map(s=>`<option>${s}</option>`).join("");
}
function filteredLeads(){
  const q=$("search").value.trim().toLowerCase(), stage=$("filter-stage").value, state=$("filter-state").value, seg=$("filter-segment").value;
  return leads.filter(l=>(!q||[l.company,l.cnpj,l.city,l.contact,l.email,l.phone].some(v=>(v||"").toLowerCase().includes(q)))&&(!stage||l.stage===stage)&&(!state||l.state===state)&&(!seg||l.segment===seg)).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
}
function renderFilters(){
  const current=$("filter-segment").value;
  const segments=[...new Set(leads.map(l=>l.segment).filter(Boolean))].sort();
  $("filter-segment").innerHTML='<option value="">Todos os segmentos</option>'+segments.map(s=>`<option ${s===current?"selected":""}>${esc(s)}</option>`).join("");
}
function renderDashboard(){
  $("stat-total").textContent=leads.length;
  $("stat-new").textContent=leads.filter(l=>l.stage==="Novo lead").length;
  $("stat-negotiation").textContent=leads.filter(l=>["Interessado","Em cadastro"].includes(l.stage)).length;
  $("stat-won").textContent=leads.filter(l=>l.stage==="Conta aberta").length;
  const recent=[...leads].sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||"")).slice(0,5);
  $("recent-leads").innerHTML=recent.length?recent.map(l=>`<div class="recent-item"><div class="company-icon">${esc(initials(l.company))}</div><div class="recent-info"><strong>${esc(l.company)}</strong><small>${esc([l.city,l.state].filter(Boolean).join(" / ")||l.segment||"Sem localização")} · ${esc(l.stage)}</small></div></div>`).join(""):'<div class="empty-inline">Ainda não há leads. Adicione uma empresa ou importe uma lista CSV.</div>';
  const counts=STAGES.map(s=>({stage:s,n:leads.filter(l=>l.stage===s).length})).filter(x=>x.n||["Novo lead","Contato realizado","Interessado","Conta aberta"].includes(x.stage));
  $("stage-summary").innerHTML=counts.map(x=>`<div><div class="stage-row-head"><span>${esc(x.stage)}</span><span>${x.n}</span></div><div class="bar"><span style="width:${leads.length?Math.max(2,x.n/leads.length*100):0}%"></span></div></div>`).join("");
}
function renderTable(){
  const list=filteredLeads(); $("lead-count-label").textContent=`${list.length} ${list.length===1?"empresa encontrada":"empresas encontradas"}`;
  $("lead-table").innerHTML=list.map(l=>`<tr><td><div class="company-cell"><div class="company-icon">${esc(initials(l.company))}</div><div><strong>${esc(l.company)}</strong><small>${esc(l.cnpj||"CNPJ não informado")}</small></div></div></td><td>${esc([l.city,l.state].filter(Boolean).join(" / ")||"—")}</td><td>${esc(l.segment||"—")}</td><td>${esc(l.contact||l.phone||l.email||"—")}</td><td><span class="stage-pill">${esc(l.stage)}</span></td><td><div class="row-actions"><button class="mini-btn" data-edit="${esc(l.id)}">Editar</button><button class="mini-btn" data-delete="${esc(l.id)}" aria-label="Excluir lead">Excluir</button></div></td></tr>`).join("");
  $("empty-state").classList.toggle("hidden",list.length>0);
  $("lead-table").closest("table").classList.toggle("hidden",list.length===0);
}
function renderPipeline(){
  const stages=["Novo lead","Contato realizado","Interessado","Em cadastro","Conta aberta"];
  $("pipeline-board").innerHTML=stages.map(s=>{const items=leads.filter(l=>l.stage===s);return `<div class="pipeline-column"><div class="pipeline-col-head">${esc(s)} <span>${items.length}</span></div>${items.length?items.map(l=>`<div class="pipeline-card"><strong>${esc(l.company)}</strong><small>${esc([l.city,l.state].filter(Boolean).join(" / ")||l.segment||"Empresa")}</small><select data-move="${esc(l.id)}">${stageOptions(l.stage)}</select></div>`).join(""):'<div class="empty-inline">Nenhuma oportunidade</div>'}</div>`}).join("");
}
function renderAll(){renderFilters();renderDashboard();renderTable();renderPipeline();}
function showView(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
  $("view-"+view).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(a=>a.classList.toggle("active",a.dataset.view===view));
  $("page-title").textContent=({dashboard:"Visão geral",leads:"Base de empresas",pipeline:"Funil comercial"})[view]||"Visão geral";
}
function openForm(l=null){
  $("lead-form").reset(); $("lead-id").value=l?.id||""; $("dialog-title").textContent=l?"Editar lead":"Novo lead";
  $("company").value=l?.company||"";$("cnpj").value=l?.cnpj||"";$("segment").value=l?.segment||"";$("state").value=l?.state||"";$("city").value=l?.city||"";$("phone").value=l?.phone||"";$("email").value=l?.email||"";$("contact").value=l?.contact||"";$("source").value=l?.source||"Pesquisa pública";$("stage").innerHTML=stageOptions(l?.stage||"Novo lead");$("notes").value=l?.notes||"";
  $("lead-dialog").showModal();
}
function saveForm(e){
  e.preventDefault();const id=$("lead-id").value;const old=leads.find(l=>l.id===id);
  const item={id:id||uid(),company:$("company").value.trim(),cnpj:$("cnpj").value.trim(),segment:$("segment").value,state:$("state").value,city:$("city").value.trim(),phone:$("phone").value.trim(),email:$("email").value.trim(),contact:$("contact").value.trim(),source:$("source").value,stage:$("stage").value,notes:$("notes").value.trim(),createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  if(!item.company){toast("Informe o nome da empresa.");return;}
  const duplicate=leads.find(l=>l.id!==item.id&&item.cnpj&&normalizeCnpj(l.cnpj)===normalizeCnpj(item.cnpj));
  if(duplicate&&!confirm(`Já existe um lead com esse CNPJ (${duplicate.company}). Deseja salvar mesmo assim?`))return;
  if(old)leads=leads.map(l=>l.id===id?item:l);else leads.push(item);
  $("lead-dialog").close();save();toast(old?"Lead atualizado com sucesso.":"Lead cadastrado com sucesso.");
}
function normalizeCnpj(s=""){return s.replace(/\D/g,"");}
function parseCSV(text){
  const rows=[];let row=[],field="",quoted=false;
  text=text.replace(/^\uFEFF/,"");
  for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&quoted&&n==='"'){field+='"';i++;}else if(c==='"'){quoted=!quoted;}else if(c===","&&!quoted||c===";"&&!quoted||c==="\t"&&!quoted){row.push(field.trim());field="";}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&n==="\n")i++;row.push(field.trim());if(row.some(Boolean))rows.push(row);row=[];field="";}else field+=c;}
  row.push(field.trim());if(row.some(Boolean))rows.push(row);return rows;
}
function headerKey(s){return (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");}
const aliases={company:["razaosocial","empresa","nomeempresa","nome","company","businessname"],cnpj:["cnpj","documento"],segment:["segmento","atividade","ramo","segment"],state:["estado","uf","state"],city:["cidade","municipio","city"],phone:["telefone","telefonecomercial","fone","phone"],email:["email","emailcomercial","e-mail"],contact:["contato","responsavel","nomecontato","contact"],source:["origem","source"],stage:["etapa","status","stage"],notes:["observacoes","observacao","notas","notes"]};
function importCSV(file){
  const reader=new FileReader();reader.onload=()=>{
    const rows=parseCSV(String(reader.result||""));if(rows.length<2){toast("CSV vazio ou sem linhas de dados.");return;}
    const headers=rows.shift().map(headerKey);const map={};for(const [field,names] of Object.entries(aliases))map[field]=headers.findIndex(h=>names.includes(h));
    if(map.company<0){toast("Não encontrei a coluna de empresa. Use o cabeçalho 'empresa' ou 'razao_social'.");return;}
    let added=0,skipped=0;
    rows.forEach(r=>{const get=k=>map[k]>=0?(r[map[k]]||"").trim():"";const company=get("company");if(!company){skipped++;return;}const cnpj=get("cnpj");if(cnpj&&leads.some(l=>normalizeCnpj(l.cnpj)===normalizeCnpj(cnpj))){skipped++;return;}
      const stage=STAGES.includes(get("stage"))?get("stage"):"Novo lead";
      leads.push({id:uid(),company,cnpj,segment:get("segment"),state:get("state").toUpperCase(),city:get("city"),phone:get("phone"),email:get("email"),contact:get("contact"),source:get("source")||"Importação CSV",stage,notes:get("notes"),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});added++;});
    save();toast(`Importação concluída: ${added} adicionados, ${skipped} ignorados.`);$("csv-file").value="";
  };reader.readAsText(file,"UTF-8");
}
function exportCSV(){
  const headers=["empresa","cnpj","segmento","estado","cidade","telefone","email","contato","origem","etapa","observacoes"];
  const csv=[headers,...leads.map(l=>[l.company,l.cnpj,l.segment,l.state,l.city,l.phone,l.email,l.contact,l.source,l.stage,l.notes])].map(row=>row.map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(";")).join("\r\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="lf-leads.csv";a.click();URL.revokeObjectURL(url);toast("Arquivo CSV exportado.");
}
function requestImport(){ $("csv-file").click(); }
fillOptions();renderAll();
document.querySelectorAll(".nav-item").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();showView(a.dataset.view)}));
document.querySelectorAll("[data-goto]").forEach(a=>a.addEventListener("click",()=>showView(a.dataset.goto)));
["add-top","add-main","empty-add"].forEach(id=>$(id).addEventListener("click",()=>openForm()));
["import-top","import-main"].forEach(id=>$(id).addEventListener("click",requestImport));
$("export-main").addEventListener("click",exportCSV);$("csv-file").addEventListener("change",e=>{if(e.target.files[0])importCSV(e.target.files[0])});
$("close-dialog").addEventListener("click",()=>$("lead-dialog").close());$("cancel-dialog").addEventListener("click",()=>$("lead-dialog").close());$("lead-form").addEventListener("submit",saveForm);
["search","filter-stage","filter-state","filter-segment"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",renderTable));
$("lead-table").addEventListener("click",e=>{const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(edit){const l=leads.find(x=>x.id===edit.dataset.edit);if(l)openForm(l);}if(del){const l=leads.find(x=>x.id===del.dataset.delete);if(l&&confirm(`Excluir o lead "${l.company}"?`)){leads=leads.filter(x=>x.id!==l.id);save();toast("Lead excluído.");}}});
$("pipeline-board").addEventListener("change",e=>{const id=e.target.dataset.move;if(!id)return;const l=leads.find(x=>x.id===id);if(l){l.stage=e.target.value;l.updatedAt=new Date().toISOString();save();toast("Etapa comercial atualizada.");}});

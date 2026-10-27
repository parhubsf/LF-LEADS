(() => {
  const STAGES = ["Novo lead", "Contato realizado", "Em negociação", "Em cadastro", "Conta aberta", "Sem interesse"];
  const $ = (id) => document.getElementById(id);
  let supabaseClient = null;
  let leads = [];
  let activeView = "overview";

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const notice = (msg, type = "") => { $("app-message").textContent = msg; $("app-message").className = "message " + type; };
  const authNotice = (msg, type = "") => { $("auth-message").textContent = msg; $("auth-message").className = "message " + type; };

  function initConfig() {
    const cfg = window.LF_LEADS_CONFIG || {};
    if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes("COLE_AQUI") ||
        !cfg.SUPABASE_PUBLISHABLE_KEY || cfg.SUPABASE_PUBLISHABLE_KEY.includes("COLE_AQUI")) {
      authNotice("Falta configurar a URL e a Publishable key no arquivo config.js.", "error");
      $("login-form").querySelector("button[type=submit]").disabled = true;
      return false;
    }
    if (!window.supabase || !window.supabase.createClient) {
      authNotice("Não foi possível carregar a biblioteca de conexão. Atualize a página e tente novamente.", "error");
      return false;
    }
    supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
    return true;
  }

  function showApp(user) {
    $("auth-screen").classList.add("hidden");
    $("app-shell").classList.remove("hidden");
    $("logout-btn").title = user?.email || "";
  }
  function showLogin() {
    $("app-shell").classList.add("hidden");
    $("auth-screen").classList.remove("hidden");
  }

  async function loadLeads() {
    notice("Carregando empresas…");
    const { data, error } = await supabaseClient.from("leads").select("*").order("created_at", { ascending: false });
    if (error) {
      notice("Não foi possível carregar os leads: " + error.message, "error");
      return;
    }
    leads = data || [];
    renderAll();
    notice("");
  }

  function renderAll() {
    $("stat-total").textContent = leads.length;
    $("stat-new").textContent = leads.filter(x => x.stage === "Novo lead").length;
    $("stat-negotiation").textContent = leads.filter(x => ["Em negociação", "Em cadastro"].includes(x.stage)).length;
    $("stat-opened").textContent = leads.filter(x => x.stage === "Conta aberta").length;
    $("recent-list").className = "recent-list" + (leads.length ? "" : " empty-state");
    $("recent-list").innerHTML = leads.length ? leads.slice(0,5).map(x => `<div class="recent-row"><div><strong>${esc(x.company_name)}</strong><small>${esc([x.city,x.state].filter(Boolean).join(" / ") || x.segment || "Sem localização informada")}</small></div><span class="badge">${esc(x.stage)}</span></div>`).join("") : "Ainda não há leads. Adicione uma empresa ou importe uma lista CSV.";
    renderFilters();
    renderTable();
    renderPipeline();
  }

  function renderFilters() {
    const currentStage = $("stage-filter").value, currentState = $("state-filter").value, currentSegment = $("segment-filter").value;
    $("stage-filter").innerHTML = `<option value="">Todas as etapas</option>` + STAGES.map(s=>`<option>${esc(s)}</option>`).join("");
    $("state-filter").innerHTML = `<option value="">Todos os estados</option>` + [...new Set(leads.map(x=>x.state).filter(Boolean))].sort().map(s=>`<option>${esc(s)}</option>`).join("");
    $("segment-filter").innerHTML = `<option value="">Todos os segmentos</option>` + [...new Set(leads.map(x=>x.segment).filter(Boolean))].sort().map(s=>`<option>${esc(s)}</option>`).join("");
    $("stage-filter").value = currentStage; $("state-filter").value = currentState; $("segment-filter").value = currentSegment;
    $("stage").innerHTML = STAGES.map(s=>`<option>${esc(s)}</option>`).join("");
  }

  function filteredLeads() {
    const q = $("search-input").value.trim().toLowerCase();
    return leads.filter(x => {
      const haystack = [x.company_name,x.cnpj,x.city,x.state,x.contact,x.email,x.segment].join(" ").toLowerCase();
      return (!q || haystack.includes(q)) && (!$("stage-filter").value || x.stage === $("stage-filter").value) &&
        (!$("state-filter").value || x.state === $("state-filter").value) && (!$("segment-filter").value || x.segment === $("segment-filter").value);
    });
  }

  function renderTable() {
    const rows = filteredLeads();
    $("leads-table").innerHTML = rows.map(x => `<tr>
      <td><strong>${esc(x.company_name)}</strong><small>${esc(x.contact || x.email || "")}</small></td>
      <td>${esc(x.cnpj || "—")}</td><td>${esc(x.segment || "—")}</td>
      <td>${esc([x.city,x.state].filter(Boolean).join(" / ") || "—")}</td>
      <td><span class="badge">${esc(x.stage)}</span></td>
      <td class="actions"><button class="table-btn" data-edit="${x.id}">Editar</button><button class="table-btn danger" data-delete="${x.id}">Excluir</button></td>
    </tr>`).join("");
    $("table-empty").classList.toggle("hidden", rows.length > 0);
  }

  function renderPipeline() {
    $("pipeline-board").innerHTML = STAGES.map(stage => {
      const items = leads.filter(x=>x.stage===stage);
      return `<section class="pipeline-column"><header><strong>${esc(stage)}</strong><span>${items.length}</span></header>${items.map(x=>`<article class="pipeline-card"><strong>${esc(x.company_name)}</strong><small>${esc([x.city,x.state].filter(Boolean).join(" / "))}</small><select data-stage-id="${x.id}" aria-label="Alterar etapa de ${esc(x.company_name)}">${STAGES.map(s=>`<option ${s===x.stage?"selected":""}>${esc(s)}</option>`).join("")}</select></article>`).join("") || `<p class="muted small">Nenhum lead</p>`}</section>`;
    }).join("");
  }

  function setView(view) {
    activeView = view;
    document.querySelectorAll(".view").forEach(el => el.classList.add("hidden"));
    $(view + "-view").classList.remove("hidden");
    document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.view === view));
    $("page-title").textContent = ({overview:"Visão geral",database:"Base de empresas",pipeline:"Funil comercial"})[view];
  }

  function resetLeadForm() {
    $("lead-form").reset(); $("lead-id").value = ""; $("dialog-title").textContent = "Novo lead";
    $("stage").value = STAGES[0];
  }
  function openLead(id = null) {
    resetLeadForm();
    if (id) {
      const x = leads.find(l=>l.id===id);
      if (!x) return;
      $("dialog-title").textContent = "Editar lead";
      $("lead-id").value = x.id;
      for (const field of ["company_name","cnpj","segment","state","city","phone","contact","source","stage","notes"]) $(field).value = x[field] || "";
      $("lead-email").value = x.email || "";
    }
    $("lead-dialog").showModal();
  }
  async function saveLead(event) {
    event.preventDefault();
    const id = $("lead-id").value;
    const payload = {
      company_name: $("company_name").value.trim(),
      cnpj: $("cnpj").value.trim() || null, segment: $("segment").value.trim() || null,
      state: $("state").value.trim().toUpperCase() || null, city: $("city").value.trim() || null,
      phone: $("phone").value.trim() || null, email: $("lead-email").value.trim() || null,
      contact: $("contact").value.trim() || null, source: $("source").value.trim() || null,
      stage: $("stage").value, notes: $("notes").value.trim() || null,
      updated_at: new Date().toISOString()
    };
    const result = id
      ? await supabaseClient.from("leads").update(payload).eq("id", id).select().single()
      : await supabaseClient.from("leads").insert(payload).select().single();
    if (result.error) { notice("Não foi possível salvar: " + result.error.message, "error"); return; }
    $("lead-dialog").close(); await loadLeads();
  }

  async function deleteLead(id) {
    const x = leads.find(l=>l.id===id);
    if (!x || !confirm(`Excluir o lead "${x.company_name}"? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabaseClient.from("leads").delete().eq("id", id);
    if (error) { notice("Não foi possível excluir: " + error.message, "error"); return; }
    await loadLeads();
  }

  async function changeStage(id, stage) {
    const { error } = await supabaseClient.from("leads").update({stage, updated_at:new Date().toISOString()}).eq("id", id);
    if (error) { notice("Não foi possível alterar a etapa: " + error.message, "error"); return; }
    await loadLeads();
  }

  function parseCSV(text) {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l=>l.trim());
    if (lines.length < 2) return [];
    const parseLine = (line) => {
      const out=[]; let cur="", quoted=false;
      for(let i=0;i<line.length;i++){const c=line[i]; if(c==='"' && line[i+1]==='"' && quoted){cur+='"';i++} else if(c==='"'){quoted=!quoted} else if(c==="," && !quoted){out.push(cur.trim());cur=""} else {cur+=c}}
      out.push(cur.trim()); return out;
    };
    const headers=parseLine(lines[0]).map(h=>h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,""));
    const aliases={company_name:["empresa","razaosocial","nome","companyname","company"],cnpj:["cnpj"],segment:["segmento","ramo","segment"],state:["uf","estado","state"],city:["cidade","city"],phone:["telefone","phone"],email:["email","emailcontato"],contact:["contato","responsavel","contact"],source:["origem","source"],stage:["etapa","stage"],notes:["observacoes","observacao","notes"]};
    return lines.slice(1).map(line=>{
      const cells=parseLine(line), row={};
      for(const [field, names] of Object.entries(aliases)){const idx=headers.findIndex(h=>names.includes(h)); if(idx>=0) row[field]=(cells[idx]||"").trim()}
      if(!row.company_name) row.company_name = row.razao_social || "";
      return row;
    }).filter(r=>r.company_name).map(r=>({...r, stage: STAGES.includes(r.stage)?r.stage:"Novo lead"}));
  }

  async function importCSV(file) {
    const text = await file.text();
    const records = parseCSV(text);
    if (!records.length) { notice("Não encontrei empresas no CSV. Confira o cabeçalho e se o separador é vírgula.", "error"); return; }
    const { error } = await supabaseClient.from("leads").insert(records);
    if (error) { notice("Importação não concluída: " + error.message, "error"); return; }
    notice(`${records.length} lead(s) importado(s) com sucesso.`, "success");
    await loadLeads();
  }

  async function start() {
    if (!initConfig()) return;
    $("login-form").addEventListener("submit", async (e) => {
      e.preventDefault(); authNotice("Validando acesso…");
      const {data,error} = await supabaseClient.auth.signInWithPassword({email:$("email").value.trim(), password:$("password").value});
      if(error){authNotice("Não foi possível entrar. Confira o e-mail e a senha. " + error.message,"error");return}
      authNotice(""); showApp(data.user); await loadLeads();
    });
    $("logout-btn").addEventListener("click", async()=>{await supabaseClient.auth.signOut(); leads=[]; showLogin();});
    $("new-lead-btn").addEventListener("click",()=>openLead());
    $("import-btn").addEventListener("click",()=>$("csv-input").click());
    $("csv-input").addEventListener("change",async e=>{if(e.target.files[0]) await importCSV(e.target.files[0]);e.target.value=""});
    $("lead-form").addEventListener("submit",saveLead);
    $("close-dialog").addEventListener("click",()=>$("lead-dialog").close());
    $("cancel-dialog").addEventListener("click",()=>$("lead-dialog").close());
    $("leads-table").addEventListener("click",e=>{const edit=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]");if(edit)openLead(edit.dataset.edit);if(del)deleteLead(del.dataset.delete)});
    $("pipeline-board").addEventListener("change",e=>{if(e.target.matches("[data-stage-id]"))changeStage(e.target.dataset.stageId,e.target.value)});
    ["search-input","stage-filter","state-filter","segment-filter"].forEach(id=>$(id).addEventListener(id==="search-input"?"input":"change",renderTable));
    document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
    document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.go)));
    const {data:{session}} = await supabaseClient.auth.getSession();
    if(session?.user){showApp(session.user); await loadLeads()} else showLogin();
    supabaseClient.auth.onAuthStateChange((_event,session)=>{if(!session)showLogin()});
  }
  document.addEventListener("DOMContentLoaded", start);
})();
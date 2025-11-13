/* Sistema Revenda — v3 adjustments */

/* CONFIG */
const REVENDA_WHATS = '+5547996052316';
const ADMIN_USER = 'admin', ADMIN_PASS = '1234';
const LS_VENDEDOR = 'sr_vendedor_v3';
const LS_CARS = 'sr_carros_v3';

/* THEME (default: light) */
(function initTheme(){
  const saved = localStorage.getItem('sr_theme');
  if(saved==='dark') document.documentElement.classList.add('dark');
  document.querySelectorAll('#themeToggle').forEach(btn=>{
    btn.textContent = document.documentElement.classList.contains('dark') ? '🌞' : '🌙';
    btn.addEventListener('click', ()=>{
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('sr_theme', isDark?'dark':'light');
      document.querySelectorAll('#themeToggle').forEach(b=> b.textContent = isDark ? '🌞' : '🌙');
    });
  });
  // set dealership WhatsApp button behavior on all pages
  document.querySelectorAll('#dealWhats').forEach(b=>{
    if(!b) return;
    b.addEventListener('click', ()=>{
      const text = encodeURIComponent('Olá, tenho interesse em informações sobre seus veículos.');
      window.open(`https://wa.me/${REVENDA_WHATS.replace(/\D/g,'')}?text=${text}`,'_blank');
    });
  });
})();

/* UTILS */
const uid = ()=>Math.random().toString(36).slice(2,9);
const readFileAsDataURL = file => new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(file); });
function normalizePhone(s){
  if(!s) return '';
  const d = s.replace(/\D/g,'');
  if(d.length <= 11) return '55'+d; // try prefix BR
  return d;
}
function copyToClipboard(txt){
  if(!navigator.clipboard) { alert('Seu navegador não suporta copiar automaticamente. Número: '+txt); return; }
  navigator.clipboard.writeText(txt).then(()=> alert('Número copiado: ' + txt));
}
/* play ping via WebAudio */
function playPing(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.0025;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(()=>{ o.frequency.value = 660; g.gain.value = 0.0018; }, 80);
    setTimeout(()=>{ o.stop(); ctx.close(); }, 220);
  }catch(e){ /* ignore */ }
}

/* ---------- ADMIN LOGIN ---------- */
(function adminLogin(){
  const f = document.getElementById('adminForm');
  if(!f) return;
  f.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const u = document.getElementById('admin_user').value.trim();
    const p = document.getElementById('admin_pass').value.trim();
    if(u===ADMIN_USER && p===ADMIN_PASS){
      window.location.href = 'revenda.html';
    } else {
      alert('Usuário ou senha incorretos.');
    }
  });
})();

/* ---------- VENDEDOR ---------- */
(function vendedorLogin(){
  const f = document.getElementById('vendedorForm');
  if(!f) return;
  f.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const vendedor = {
      id: uid(),
      nome: document.getElementById('v_nome').value.trim(),
      email: document.getElementById('v_email').value.trim(),
      cpf: document.getElementById('v_cpf').value.trim(),
      endereco: document.getElementById('v_endereco').value.trim(),
      telefone: document.getElementById('v_telefone').value.trim()
    };
    localStorage.setItem(LS_VENDEDOR, JSON.stringify(vendedor));
    window.location.href = 'cadastro.html';
  });
})();

/* ---------- CADASTRO ---------- */
(function cadastroPage(){
  const f = document.getElementById('cadastroForm'); if(!f) return;
  const fotosDefeitos = document.getElementById('c_fotos_defeitos');
  const thumbs = document.getElementById('thumbs');
  if(fotosDefeitos){
    fotosDefeitos.addEventListener('change', async (e)=>{
      thumbs.innerHTML = '';
      for (const file of e.target.files){
        try{
          const data = await readFileAsDataURL(file);
          const img = document.createElement('img'); img.src = data; thumbs.appendChild(img);
        }catch(err){ console.error(err); }
      }
    });
  }
  const contactBtn = document.getElementById('contactRevenda');
  if(contactBtn){
    contactBtn.addEventListener('click', ()=>{
      const text = encodeURIComponent('Olá, sou vendedor e quero registrar um contato com a revenda.');
      window.open(`https://wa.me/${REVENDA_WHATS.replace(/\D/g,'')}?text=${text}`, '_blank');
    });
  }

  f.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const vendedor = JSON.parse(localStorage.getItem(LS_VENDEDOR) || 'null');
    if(!vendedor){ alert('Faça login como vendedor antes de publicar.'); window.location.href='login-vendedor.html'; return; }

    const marca = document.getElementById('c_marca').value.trim();
    const modelo = document.getElementById('c_modelo').value.trim();
    const ano = document.getElementById('c_ano').value.trim();
    const km = document.getElementById('c_km').value.trim();
    const preco = document.getElementById('c_preco').value.trim();
    const inspecao = document.getElementById('c_inspecao').value.trim();
    const obs = document.getElementById('c_obs').value.trim();

    const principalFile = document.getElementById('c_foto_principal').files[0];
    if(!principalFile){ alert('Adicione foto principal.'); return; }
    const principalData = await readFileAsDataURL(principalFile);

    const defectFiles = Array.from(document.getElementById('c_fotos_defeitos').files || []);
    const defectData = [];
    for(const ffile of defectFiles){
      const d = await readFileAsDataURL(ffile);
      defectData.push(d);
    }

    const item = {
      id: uid(),
      ownerId: vendedor.id,
      ownerName: vendedor.nome,
      ownerPhone: vendedor.telefone,
      ownerEmail: vendedor.email,
      vehicle: { marca, modelo, ano, km, preco },
      mainImage: principalData,
      defectImages: defectData,
      inspection: inspecao,
      obs,
      status: 'available',
      createdAt: new Date().toISOString()
    };

    const list = JSON.parse(localStorage.getItem(LS_CARS) || '[]');
    list.unshift(item);
    localStorage.setItem(LS_CARS, JSON.stringify(list));
    alert('Anúncio publicado com sucesso!');
    window.location.href = 'login-vendedor.html';
  });
})();

/* ---------- REVENDA / PAINEL ---------- */
(function revendaPanel(){
  const grid = document.getElementById('grid'); if(!grid) return;
  const search = document.getElementById('search');
  const filterStatus = document.getElementById('filterStatus');

  function loadAndRender(){
    const all = JSON.parse(localStorage.getItem(LS_CARS) || '[]');
    const q = (search && search.value||'').toLowerCase();
    const f = (filterStatus && filterStatus.value) || 'all';
    const filtered = all.filter(it=>{
      if(f==='available' && it.status!=='available') return false;
      if(f==='interested' && it.status!=='interested') return false;
      if(f==='bought' && it.status!=='bought') return false;
      if(q){
        const s = `${it.vehicle.marca} ${it.vehicle.modelo} ${it.vehicle.ano}`.toLowerCase();
        return s.includes(q);
      }
      return true;
    });

    grid.innerHTML = '';
    if(filtered.length===0){
      grid.innerHTML = `<div class="muted">Nenhum veículo encontrado.</div>`;
      return;
    }

    filtered.forEach(item=>{
      const card = document.createElement('div'); card.className='card-item';
      card.innerHTML = `
        <div class="card-thumb"><img src="${item.mainImage}" alt=""></div>
        <div class="card-body">
          <div class="card-title">${item.vehicle.marca} ${item.vehicle.modelo} <span class="muted">(${item.vehicle.ano})</span></div>
          <div class="card-meta">${item.vehicle.km||'—'} km • Pedido: R$ ${Number(item.vehicle.preco||0).toLocaleString()}</div>
          <div class="card-chips">
            <div class="chip">Status: ${item.status}</div>
            <div class="chip">Publicado: ${new Date(item.createdAt).toLocaleDateString()}</div>
            <div class="chip">Vendedor: ${item.ownerName}</div>
          </div>
        </div>
      `;
      card.addEventListener('click', ()=> openModal(item));
      grid.appendChild(card);
    });
  }

  loadAndRender();
  if(search) search.addEventListener('input', loadAndRender);
  if(filterStatus) filterStatus.addEventListener('change', loadAndRender);

  /* Modal */
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modalClose');
  const modalMain = document.getElementById('modalMain');
  const modalThumbs = document.getElementById('modalThumbs');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const modalInspection = document.getElementById('modalInspection');
  const modalObs = document.getElementById('modalObs');
  const waSeller = document.getElementById('waSeller');
  const markInterested = document.getElementById('markInterested');
  const markBought = document.getElementById('markBought');

  let currentItem = null;
  function openModal(item){
    currentItem = item;
    modalMain.src = item.mainImage || '';
    modalThumbs.innerHTML = '';
    // main + defects (thumbs horizontal scroll)
    const mainThumb = document.createElement('img'); mainThumb.src = item.mainImage; modalThumbs.appendChild(mainThumb);
    (item.defectImages||[]).forEach(src=>{
      const im = document.createElement('img'); im.src = src; modalThumbs.appendChild(im);
    });
    // thumbs click
    modalThumbs.querySelectorAll('img').forEach(img=>{
      img.addEventListener('click', ()=>{ modalMain.src = img.src; });
    });

    modalTitle.textContent = `${item.vehicle.marca} ${item.vehicle.modelo} (${item.vehicle.ano})`;
    modalMeta.innerHTML = `Km: ${item.vehicle.km||'—'} • Pedido: R$ ${Number(item.vehicle.preco||0).toLocaleString()}<br>Vendedor: ${item.ownerName}`;
    modalInspection.textContent = 'Inspeção: ' + (item.inspection||'—');
    modalObs.textContent = 'Observações: ' + (item.obs||'—');

    // seller phone: do NOT open WA automatically — only copy/show
    waSeller.onclick = ()=>{
      const phone = item.ownerPhone || '';
      if(!phone){ alert('Telefone do vendedor não disponível.'); return; }
      copyToClipboard(phone);
    };

    markInterested.onclick = ()=>{ updateStatus(item.id,'interested'); };
    markBought.onclick = ()=>{ if(confirm('Marcar como comprado?')) updateStatus(item.id,'bought'); };

    modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  modalClose.addEventListener('click', ()=>{ closeModal(); });
  modal.addEventListener('click', (ev)=>{ if(ev.target===modal) closeModal(); });
  function closeModal(){ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

  function updateStatus(id, status){
    const all = JSON.parse(localStorage.getItem(LS_CARS) || '[]');
    const idx = all.findIndex(x=>x.id===id);
    if(idx===-1) return;
    all[idx].status = status;
    localStorage.setItem(LS_CARS, JSON.stringify(all));
    playPing();
    alert('Status atualizado: ' + status);
    loadAndRender();
    closeModal();
  }
})();

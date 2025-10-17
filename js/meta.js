// Estado local de metas                 DEUS ME ABENÇOE
let metas = [];
let editId = null;
let pendingDeleteId = null;

// Elementos de pages (agora overlays full)
const pages = {
  1: document.getElementById('page1'),
  2: document.getElementById('page2'),
  3: document.getElementById('page3'),
  4: document.getElementById('page4')
};

function showPage(n){
  // fecha todas e abre apenas a solicitada
  Object.values(pages).forEach(p=>{
    p.classList.remove('active');
    p.setAttribute('aria-hidden','true');
  });
  pages[n].classList.add('active');
  pages[n].setAttribute('aria-hidden','false');

  // foco quando abrir form
  if(n===2){
    setTimeout(()=> document.getElementById('nomeMeta').focus(), 120);
  }
}

// Função para voltar sempre para a tela principal (page1)
function closeOverlay(){
  showPage(1);
}

showPage(1);

// utilidades
function formatCurrency(v){
  if(v==null || v==='' ) return '0,00';
  return parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function daysBetween(d1,d2){
  const a=new Date(d1);
  const b=new Date(d2);
  if(isNaN(a)||isNaN(b)) return '-';
  const diff = Math.ceil((b - a) / (1000*60*60*24));
  return diff;
}

// render lista de metas (usada na página principal - page1)
function renderLista(){
  const container = document.getElementById('listaMetas');
  container.innerHTML = '';
  if(metas.length===0){
    const el = document.createElement('div');
    el.className='muted';
    el.textContent='Nenhuma meta criada ainda. Clique em + Nova meta para começar.';
    container.appendChild(el);
    return;
  }

  metas.forEach(meta=>{                            //Vou cometer altovascamento a qualquer momento
    const card = document.createElement('div');
    card.className='card';
    card.dataset.id = meta.id;

    const thumb = document.createElement('div');
    thumb.className='thumb';
    if(meta.foto){
      const img = document.createElement('img'); img.src = meta.foto; thumb.appendChild(img);
    } else {
      thumb.textContent = meta.nome ? meta.nome.slice(0,2).toUpperCase() : 'IM';
    }

    const info = document.createElement('div'); 
    info.className='meta-info';

    const name = document.createElement('div'); 
    name.className='meta-name'; name.textContent = meta.nome || 'Sem nome';

    const tempo = document.createElement('div'); 
    tempo.className='meta-time'; 
    tempo.textContent = `De ${meta.tempoInicial||'--'} até ${meta.tempoFinal||'--'}`;

    const faltaVal = (meta.valorDesejado - (meta.valorObtido||0));
    const falta = document.createElement('div'); falta.className='meta-remaining'; falta.textContent = `Falta R$ ${formatCurrency(faltaVal)}`;

    // barra de progresso e porcentagem
    const progressWrap = document.createElement('div'); progressWrap.className = 'progress-wrap';
    const progress = document.createElement('div'); progress.className = 'progress';
    const bar = document.createElement('i');
    const percent = meta.valorDesejado > 0 ? Math.min(100, Math.round(((meta.valorObtido||0) / meta.valorDesejado) * 100)) : 0;
    bar.style.width = percent + '%';
    progress.appendChild(bar);

    const label = document.createElement('div'); label.className = 'progress-label'; label.textContent = percent + '%';
    progressWrap.appendChild(progress); progressWrap.appendChild(label);

    info.appendChild(name); info.appendChild(tempo); info.appendChild(progressWrap); info.appendChild(falta);
    card.appendChild(thumb); card.appendChild(info);

    card.addEventListener('click', ()=> openDetail(meta.id));
    container.appendChild(card);
  });
}

// lidar com input de foto na página 2 pq ta dando erro SE ESSA MERDA N FUNCIONAR EU ME MATO
const fotoInput = document.getElementById('fotoMeta');
const fotoPreview = document.getElementById('fotoPreview');
if(fotoInput){
  fotoInput.addEventListener('change', (e)=>{
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = function(ev){
      fotoPreview.innerHTML = '';
      const img = document.createElement('img');
      img.src = ev.target.result;
      fotoPreview.appendChild(img);
      fotoPreview.dataset.src = ev.target.result;
    };
    reader.readAsDataURL(f);
  });
}

document.getElementById('btnMudarFoto').addEventListener('click', ()=>{
  document.getElementById('fotoMeta').click();
});

// abrir detalhe (page4)
function openDetail(id){
  const meta = metas.find(m=>m.id===id);
  if(!meta) return;
  const area = document.getElementById('onlyDetailArea');
  area.innerHTML = '';

  const thumb = document.createElement('div'); thumb.className='big-thumb';
  if(meta.foto){ 
    const img = document.createElement('img'); 
    img.src = meta.foto; thumb.appendChild(img); 
  } 
  else { 
    thumb.textContent = meta.nome ? meta.nome.slice(0,2).toUpperCase() : 'IM'; 
  }

  const info = document.createElement('div'); info.className='info';
  const h = document.createElement('h2'); h.textContent = meta.nome || 'Sem nome';
  const pTipo = document.createElement('p'); pTipo.innerHTML = `<strong>Tipo de meta:</strong> ${meta.tipo || '-'}`;
  const restante = meta.tempoFinal ? daysBetween(new Date().toISOString().slice(0,10), meta.tempoFinal) : '-';
  const pTempo = document.createElement('p'); pTempo.innerHTML = `<strong>Tempo restante da meta:</strong> ${restante} dias`;
  const pValor = document.createElement('p'); pValor.innerHTML = `<strong>Valor da meta:</strong> R$ ${formatCurrency(meta.valorDesejado)}`;
  const pObtido = document.createElement('p'); pObtido.innerHTML = `<strong>Valor obtido:</strong> R$ ${formatCurrency(meta.valorObtido || 0)}`;
  const faltaVal = (meta.valorDesejado - (meta.valorObtido||0));
  const pFalta = document.createElement('p'); pFalta.innerHTML = `<strong>Falta:</strong> R$ ${formatCurrency(faltaVal)}`;

  const actions = document.createElement('div'); actions.className='row-actions';
  const btnEditar = document.createElement('button'); 
  btnEditar.className='btn'; 
  btnEditar.textContent='Editar';                                         //tamo editando os trem
  btnEditar.addEventListener('click', ()=> startEdit(meta.id));

  const btnExcluir = document.createElement('button'); 
  btnExcluir.className='btn secondary'; 
  btnExcluir.textContent='Excluir'; 
  btnExcluir.addEventListener('click', ()=> confirmDelete(meta.id));
  actions.appendChild(btnEditar); actions.appendChild(btnExcluir);

  // mexe no valorObtido
  const quickRow = document.createElement('div'); quickRow.style.marginTop='10px';         
  quickRow.innerHTML = `
    <label style="font-weight:700;">Atualizar valor obtido (R$)</label>
    <div style="display:flex;gap:8px;margin-top:6px;">
      <input id="quickObtido" type="number" step="0.01" style="padding:10px;border-radius:8px;border:1px solid #e6e6ea;flex:1;" value="${meta.valorObtido||0}">
      <button id="quickSalvar" class="btn">Salvar</button>
    </div>
  `;

  info.appendChild(h); info.appendChild(pTipo); info.appendChild(pTempo); info.appendChild(pValor); info.appendChild(pObtido); info.appendChild(pFalta);
  info.appendChild(quickRow); info.appendChild(actions);

  area.appendChild(thumb); area.appendChild(info);

  showPage(4);

  // click de salvar  ODEIO MINHA VIDA
  document.getElementById('quickSalvar').addEventListener('click', ()=>{
    const val = parseFloat(document.getElementById('quickObtido').value) || 0;
    meta.valorObtido = val;
    renderLista();
    showResumo(meta);
    openDetail(meta.id);
  });
}

// resumo (page3) resumo = sofrimento
function showResumo(meta){
  const area = document.getElementById('metaResumoArea');
  area.innerHTML='';

  const wrapper = document.createElement('div'); wrapper.className='detail-card';
  const topRow = document.createElement('div'); topRow.style.display='flex'; topRow.style.justifyContent='space-between'; topRow.style.alignItems='center';
  const name = document.createElement('div'); name.style.fontWeight='700'; name.textContent = meta.nome || 'Sem nome';
  topRow.appendChild(name);

  const thumbSmall = document.createElement('div'); thumbSmall.style.width='56px'; thumbSmall.style.height='40px'; thumbSmall.style.borderRadius='8px'; thumbSmall.style.overflow='hidden';
  if(meta.foto){ 
    const im = document.createElement('img'); 
    im.src = meta.foto; 
    im.style.width='100%'; 
    im.style.height='100%'; 
    im.style.objectFit='cover';                        //Eu acho q era aqui o erro, mas confere
    thumbSmall.appendChild(im); 
  }
  else { 
    thumbSmall.style.background='linear-gradient(135deg,#fff4fb,#ffdff3)'; 
    thumbSmall.style.display='flex'; 
    thumbSmall.style.alignItems='center'; 
    thumbSmall.style.justifyContent='center'; 
    thumbSmall.textContent='IM'; 
  }
  topRow.appendChild(thumbSmall);

  const grid = document.createElement('div'); grid.className='detail-grid';
  function mk(key, value){ const d = document.createElement('div'); d.className='line'; d.innerHTML = `<strong>${key}:</strong> ${value}`; grid.appendChild(d); }

  mk('Tipo de meta (em dias)', meta.tipo === 'dias' ? daysBetween(meta.tempoInicial, meta.tempoFinal) + ' dias' : meta.tipo);
  mk('Tempo restante da meta', meta.tempoFinal ? daysBetween(new Date().toISOString().slice(0,10), meta.tempoFinal) + ' dias' : '-');
  mk('Valor da meta', `R$ ${formatCurrency(meta.valorDesejado)}`);
  mk('Valor obtido', `R$ ${formatCurrency(meta.valorObtido||0)}`);
  mk('Falta', `R$ ${formatCurrency(meta.valorDesejado - (meta.valorObtido||0))}`);

  wrapper.appendChild(topRow); wrapper.appendChild(grid);

  const actions = document.createElement('div'); actions.className='row-actions';
  const btnEditar = document.createElement('button'); btnEditar.className='btn'; btnEditar.textContent='Editar'; btnEditar.addEventListener('click', ()=> startEdit(meta.id));
  const btnExcluir = document.createElement('button'); btnExcluir.className='btn secondary'; btnExcluir.textContent='Excluir'; btnExcluir.addEventListener('click', ()=> confirmDelete(meta.id));
  actions.appendChild(btnEditar); actions.appendChild(btnExcluir);
  wrapper.appendChild(actions);
  area.appendChild(wrapper);

  showPage(3);
}

// botões principais e handlers
document.getElementById('btnNovaMetaTop').addEventListener('click', ()=>{
  editId = null; resetForm(); showPage(2);
});
document.getElementById('btnNovaMetaFrom3').addEventListener('click', ()=>{
  editId = null; resetForm(); showPage(2);
});
document.getElementById('btnCancelar').addEventListener('click', ()=> { resetForm(); closeOverlay(); });
document.getElementById('btnVoltarList').addEventListener('click', ()=> closeOverlay() );
document.getElementById('btnFecharPage2').addEventListener('click', ()=> closeOverlay() );
document.getElementById('btnFecharPage3').addEventListener('click', ()=> closeOverlay() );
document.getElementById('btnFecharDetail').addEventListener('click', ()=> closeOverlay() );

// salvar (criar ou atualizar) se der separa, se n der fds
document.getElementById('btnSalvar').addEventListener('click', ()=>{
  const nome = document.getElementById('nomeMeta').value.trim();
  const valor = parseFloat(document.getElementById('valorMeta').value) || 0;
  const obtido = parseFloat(document.getElementById('valorObtido').value) || 0;
  const tipo = document.getElementById('tipoMeta').value;
  const inic = document.getElementById('tempoInicial').value;
  const fim = document.getElementById('tempoFinal').value;
  const fotoSrc = document.getElementById('fotoPreview').dataset.src || null;

  if(!nome){ alert('Por favor insira o nome da meta.'); document.getElementById('nomeMeta').focus(); return; }

  if(editId){
    const meta = metas.find(m=>m.id===editId);
    if(!meta) return;
    meta.nome = nome; meta.valorDesejado = valor; meta.valorObtido = obtido; meta.tipo = tipo; meta.tempoInicial = inic; meta.tempoFinal = fim;
    if(fotoSrc) meta.foto = fotoSrc;
    editId = null; renderLista(); showResumo(meta);
  } else {
    const id = Date.now() + Math.floor(Math.random()*999);
    const meta = { id, nome, valorDesejado: valor, valorObtido: obtido, tipo, tempoInicial: inic, tempoFinal: fim, foto: fotoSrc };
    metas.push(meta); renderLista(); showResumo(meta);
  }
  resetForm();
});

// iniciar edição
function startEdit(id){
  const meta = metas.find(m=>m.id===id);
  if(!meta) return;
  editId = id;
  document.getElementById('nomeMeta').value = meta.nome || '';
  document.getElementById('valorMeta').value = meta.valorDesejado || '';
  document.getElementById('valorObtido').value = meta.valorObtido || '';
  document.getElementById('tipoMeta').value = meta.tipo || 'dinheiro';
  document.getElementById('tempoInicial').value = meta.tempoInicial || '';
  document.getElementById('tempoFinal').value = meta.tempoFinal || '';
  if(meta.foto){
    document.getElementById('fotoPreview').innerHTML = '';
    const im = document.createElement('img'); im.src = meta.foto; document.getElementById('fotoPreview').appendChild(im);
    document.getElementById('fotoPreview').dataset.src = meta.foto;
  } else {
    document.getElementById('fotoPreview').innerHTML = 'IMAGEM';
    delete document.getElementById('fotoPreview').dataset.src;
  }
  showPage(2);
}

// apagar com modal                     eu to inventando MODAL LKKKKKKKKKKKKKKKKKKK
function confirmDelete(id){
  pendingDeleteId = id;
  const modal = document.getElementById('modalBackdrop');
  modal.style.display='flex';
  modal.setAttribute('aria-hidden','false');
}
document.getElementById('modalCancelar').addEventListener('click', ()=>{
  pendingDeleteId = null;
  const modal = document.getElementById('modalBackdrop');
  modal.style.display='none';
  modal.setAttribute('aria-hidden','true');
});
document.getElementById('modalConfirmar').addEventListener('click', ()=>{
  if(pendingDeleteId==null) return;
  metas = metas.filter(m=>m.id !== pendingDeleteId);
  pendingDeleteId = null;
  document.getElementById('modalBackdrop').style.display='none';
  document.getElementById('modalBackdrop').setAttribute('aria-hidden','true');
  renderLista();
  closeOverlay();
});

// reset form                                        pq tá em inglÊs? tem trdutor n?
function resetForm(){
  document.getElementById('nomeMeta').value = '';
  document.getElementById('valorMeta').value = '';
  document.getElementById('valorObtido').value = '';
  document.getElementById('tipoMeta').value = 'dinheiro';
  document.getElementById('tempoInicial').value = '';
  document.getElementById('tempoFinal').value = '';
  document.getElementById('fotoPreview').innerHTML = 'IMAGEM';
  delete document.getElementById('fotoPreview').dataset.src;
  document.getElementById('fotoMeta').value = '';
  editId = null;
}

// inicializa lista
renderLista();

// segurança: garantir bindings se DOM carregar tarde                     PQP CECOTE, Q POHA É ESSA???????? -> burra pra caralhojjkkkkkkkkkkk
window.addEventListener('load', ()=>{ /* nada extra necessário */ });
const dadosIniciais = {
  "pessoal": [
    { "name": "Alimentação", "tipo": "Despesa", "date": "2025-10-01" },
    { "name": "Salário", "tipo": "Receita", "date": "2025-10-01" }
  ],
  "comercial": [
    { "name": "Aluguel loja", "tipo": "Despesa", "date": "2025-10-01" }
  ]
};

const CHAVE_ARMAZENAMENTO = 'catfinanceiras:dados';

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatarDataParaExibir(yyyyMmDd) {
  if (!yyyyMmDd) return '';
  const [y, m, d] = yyyyMmDd.split('-');
  return d + '/' + m + '/' + y;
}

function criarItemCategoria(nome, tipo, dataStr, id = null) {
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex justify-content-between align-items-start';
  li.dataset.id = id || gerarId();

  const esquerda = document.createElement('div');
  const titulo = document.createElement('div');
  titulo.className = 'fw-semibold category-name';
  titulo.textContent = nome || '(sem nome)';
  const pequenoData = document.createElement('small');
  pequenoData.className = 'text-muted category-date';
  pequenoData.textContent = formatarDataParaExibir(dataStr);

  esquerda.appendChild(titulo);
  esquerda.appendChild(pequenoData);

  const direita = document.createElement('div');
  direita.className = 'd-flex align-items-center';

  const badge = document.createElement('span');
  badge.className = 'badge me-2 category-tipo';
  badge.textContent = tipo;
  badge.classList.add(tipo && tipo.toLowerCase().includes('receita') ? 'bg-success' : 'bg-secondary');

  const acoes = document.createElement('div');
  acoes.className = 'btn-group category-actions';
  acoes.role = 'group';

  const btnEditar = document.createElement('button');
  btnEditar.type = 'button';
  btnEditar.className = 'btn btn-sm btn-outline-secondary btn-edit';
  btnEditar.textContent = 'Editar';

  const btnExcluir = document.createElement('button');
  btnExcluir.type = 'button';
  btnExcluir.className = 'btn btn-sm btn-outline-danger btn-delete';
  btnExcluir.textContent = 'Excluir';

  acoes.appendChild(btnEditar);
  acoes.appendChild(btnExcluir);

  direita.appendChild(badge);
  direita.appendChild(acoes);

  li.appendChild(esquerda);
  li.appendChild(direita);

  btnExcluir.addEventListener('click', () => {
    if (confirm('Excluir esta categoria?')) {
      li.remove();
      salvarEstado();
    }
  });

  btnEditar.addEventListener('click', () => abrirEdicaoInline(li));

  return li;
}

function abrirEdicaoInline(li) {
  const tituloEl = li.querySelector('.category-name');
  const badgeEl = li.querySelector('.category-tipo');
  const dataEl = li.querySelector('.category-date');

  const nomeAtual = tituloEl.textContent;
  const tipoAtual = badgeEl.textContent;
  const dataTexto = dataEl.textContent;
  const partes = (dataTexto && dataTexto.split('/')) || [];
  const isoData = partes.length === 3 ? `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')}` : '';

  const form = document.createElement('div');
  form.className = 'w-100 d-flex gap-2 align-items-center';

  const inputNome = document.createElement('input');
  inputNome.type = 'text';
  inputNome.className = 'form-control form-control-sm';
  inputNome.value = nomeAtual;

  const selectTipo = document.createElement('select');
  selectTipo.className = 'form-select form-select-sm';
  ['Despesa','Receita'].forEach(t => {
    const o = document.createElement('option'); o.text = t; o.value = t; selectTipo.add(o);
  });
  selectTipo.value = tipoAtual;

  const inputData = document.createElement('input');
  inputData.type = 'date';
  inputData.className = 'form-control form-control-sm';
  inputData.value = isoData;

  const btnSalvar = document.createElement('button');
  btnSalvar.type = 'button';
  btnSalvar.className = 'btn btn-sm btn-success';
  btnSalvar.textContent = 'Salvar';

  const btnCancelar = document.createElement('button');
  btnCancelar.type = 'button';
  btnCancelar.className = 'btn btn-sm btn-secondary';
  btnCancelar.textContent = 'Cancelar';

  form.appendChild(inputNome);
  form.appendChild(selectTipo);
  form.appendChild(inputData);
  form.appendChild(btnSalvar);
  form.appendChild(btnCancelar);

  const esquerda = li.firstChild;
  const direita = li.lastChild;
  li.insertBefore(form, direita);
  esquerda.style.display = 'none';

  btnCancelar.addEventListener('click', () => {
    form.remove();
    esquerda.style.display = '';
  });

  btnSalvar.addEventListener('click', () => {
    tituloEl.textContent = inputNome.value || '(sem nome)';
    badgeEl.textContent = selectTipo.value;
    badgeEl.classList.remove('bg-success','bg-secondary');
    badgeEl.classList.add(selectTipo.value.toLowerCase().includes('receita') ? 'bg-success' : 'bg-secondary');
    dataEl.textContent = formatarDataParaExibir(inputData.value);
    form.remove();
    esquerda.style.display = '';
    salvarEstado();
  });
}

function adicionarCategoria(idLista, idNome, idTipo, idData) {
  const nome = document.getElementById(idNome).value.trim();
  const tipo = document.getElementById(idTipo).value;
  const data = document.getElementById(idData).value;
  if (!nome) {
    alert('Informe o nome da categoria.');
    return;
  }
  const li = criarItemCategoria(nome, tipo, data);
  document.getElementById(idLista).appendChild(li);

  document.getElementById(idNome).value = '';
  document.getElementById(idTipo).value = 'Despesa';
  document.getElementById(idData).value = '';
  salvarEstado();
}

function serializarListas() {
  const obj = { pessoal: [], comercial: [] };
  const mapear = (listaEl, arr) => {
    listaEl.querySelectorAll('li').forEach(li => {
      const id = li.dataset.id || gerarId();
      const nome = (li.querySelector('.category-name') || {}).textContent || '';
      const tipo = (li.querySelector('.category-tipo') || {}).textContent || '';
      const dataTexto = (li.querySelector('.category-date') || {}).textContent || '';
      let iso = '';
      if (dataTexto) {
        const partes = dataTexto.split('/');
        if (partes.length === 3) iso = `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')}`;
      }
      arr.push({ id, name: nome, tipo, date: iso });
    });
  };
  const listaPessoal = document.getElementById('pessoal-list');
  const listaComercial = document.getElementById('comercial-list');
  if (listaPessoal) mapear(listaPessoal, obj.pessoal);
  if (listaComercial) mapear(listaComercial, obj.comercial);
  return obj;
}

function salvarEstado() {
  try {
    const estado = serializarListas();
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(estado));
  } catch (e) {
    console.error('Erro ao salvar estado:', e);
  }
}

function carregarEstadoDoLocalStorage() {
  try {
    const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!bruto) return null;
    return JSON.parse(bruto);
  } catch (e) {
    console.error('Erro ao ler localStorage:', e);
    return null;
  }
}

function limparListas() {
  const pl = document.getElementById('pessoal-list');
  const cl = document.getElementById('comercial-list');
  if (pl) pl.innerHTML = '';
  if (cl) cl.innerHTML = '';
}

function popularAPartirDosDados(dados) {
  if (!dados) return;
  limparListas();
  if (dados.pessoal && Array.isArray(dados.pessoal)) {
    dados.pessoal.forEach(item => {
      const id = item.id || item._id || null;
      document.getElementById('pessoal-list').appendChild(criarItemCategoria(item.name, item.tipo, item.date, id));
    });
  }
  if (dados.comercial && Array.isArray(dados.comercial)) {
    dados.comercial.forEach(item => {
      const id = item.id || item._id || null;
      document.getElementById('comercial-list').appendChild(criarItemCategoria(item.name, item.tipo, item.date, id));
    });
  }
}

async function carregarDadosIniciais() {
  const armazenado = carregarEstadoDoLocalStorage();
  if (armazenado) {
    popularAPartirDosDados(armazenado);
    return;
  }

  try {
    const resp = await fetch('data/categories.json', { cache: 'no-cache' });
    if (resp.ok) {
      const json = await resp.json();
      popularAPartirDosDados(json);
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(json));
      return;
    }
  } catch (e) {
    console.info('Arquivo JSON inicial não encontrado ou falhou fetch:', e);
  }

  popularAPartirDosDados(dadosIniciais);
  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(dadosIniciais));
}

document.addEventListener('DOMContentLoaded', () => {
  carregarDadosIniciais().then(() => {
    document.getElementById('catpessoal').addEventListener('click', () => adicionarCategoria('pessoal-list','categoria-pessoal','tipo-pessoal','data-pessoal'));
    document.getElementById('catcomercial').addEventListener('click', () => adicionarCategoria('comercial-list','categoria-comercial','tipo-comercial','data-comercial'));
  });
});
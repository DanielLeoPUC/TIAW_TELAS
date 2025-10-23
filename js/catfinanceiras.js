// ...existing code...
const dadosIniciais = {
  "pessoal": [
    { 
        "name": "Alimentação",
        "tipo": "Despesa",
        "date": "2025-10-01" },
    {
         "name": "Salário",
         "tipo": "Receita", 
         "date": "2025-10-01" }
  ],
  "comercial": [
    { 
        "name": "Aluguel loja",
        "tipo": "Despesa", 
        "date": "2025-10-01" }
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

  direita.appendChild(badge);

  li.appendChild(esquerda);
  li.appendChild(direita);

  return li;
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
  const lista = document.getElementById(idLista);
  if (lista) lista.appendChild(li);

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

    const estado = serializarListas();
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(estado));
 
}

function carregarEstadoDoLocalStorage() {
 
    const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!bruto) return null;
    return JSON.parse(bruto);
 
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

    const resp = await fetch('data/categories.json', { cache: 'no-cache' });
    if (resp.ok) {
      const json = await resp.json();
      popularAPartirDosDados(json);
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(json));
      return;
 
  }

  popularAPartirDosDados(dadosIniciais);
  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(dadosIniciais));
}

document.addEventListener('DOMContentLoaded', () => {
  carregarDadosIniciais().then(() => {
    const btnP = document.getElementById('catpessoal');
    const btnC = document.getElementById('catcomercial');
    if (btnP) btnP.addEventListener('click', () => adicionarCategoria('pessoal-list','categoria-pessoal','tipo-pessoal','data-pessoal'));
    if (btnC) btnC.addEventListener('click', () => adicionarCategoria('comercial-list','categoria-comercial','tipo-comercial','data-comercial'));
  });
});
// ...existing code...
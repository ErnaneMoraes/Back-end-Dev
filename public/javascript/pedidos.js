import { API_URL } from './api.js';
let produtosDisponiveis = [];
let clientesDisponiveis = [];

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        inicializarAplicacao();
    }, 100); 

    const selectClienteElement = document.getElementById('select-cliente');
    if (selectClienteElement) {
        selectClienteElement.addEventListener('change', function () {
            const clienteSelecionadoOption = this.options[this.selectedIndex];
            
            const numCelularInput = document.querySelector('input[name="num_celular"]');
            const cpfCnpjInput = document.querySelector('input[name="cpf_ou_cnpj"]');
            const nomeRuaInput = document.querySelector('input[name="nome_rua"]');
            const numeroCasaInput = document.querySelector('input[name="numero_casa"]');
            const cepInput = document.querySelector('input[name="CEP"]');
            const cidadeInput = document.querySelector('input[name="cidade"]');
            const ufInput = document.querySelector('input[name="UF"]');

            if (!clienteSelecionadoOption || !clienteSelecionadoOption.dataset.cliente) {
                if (numCelularInput) numCelularInput.value = '';
                if (cpfCnpjInput) cpfCnpjInput.value = '';
                if (nomeRuaInput) nomeRuaInput.value = '';
                if (numeroCasaInput) numeroCasaInput.value = '';
                if (cepInput) cepInput.value = '';
                if (cidadeInput) cidadeInput.value = '';
                if (ufInput) ufInput.value = '';
                return;
            }

            const cliente = JSON.parse(clienteSelecionadoOption.dataset.cliente);

            if (numCelularInput) numCelularInput.value = formatarTelefone(cliente.CELULAR || '');
            if (cpfCnpjInput) cpfCnpjInput.value = formatarDocumento(cliente.CPF_CNPJ || '');
            if (nomeRuaInput) nomeRuaInput.value = cliente.RUA || '';
            if (numeroCasaInput) numeroCasaInput.value = cliente.NUMERO || '';
            if (cepInput) cepInput.value = cliente.CEP || '';
            if (cidadeInput) cidadeInput.value = cliente.CIDADE || '';
            if (ufInput) ufInput.value = cliente.UF || '';
        });
    }
});

async function inicializarAplicacao() {
    try {
        await Promise.all([
            carregarClientes(),
            carregarProdutos(),
            carregarEExibirPedidos()
        ]);
        inicializarEventosGlobais();
    } catch (error) {
        console.error('Erro crítico na inicialização da aplicação:', error);
        mostrarErro('Erro ao carregar dados iniciais da aplicação. Tente recarregar a página.');
    }
}

function inicializarEventosGlobais() {
    document.querySelector('.add_produto')?.addEventListener('click', adicionarProduto);
    document.addEventListener('input', function (e) {
        if (e.target.matches('.quantidade-produto, .desconto-produto, .select-produto')) {
            calcularSubtotal(e.target);
        }
    });

    const inputBuscaPedidos = document.getElementById('buscar_pedidos');
    if (inputBuscaPedidos) {
        inputBuscaPedidos.addEventListener('input', filtrarPedidosNaTabela);
    }
    const selectColunaFiltro = document.getElementById('coluna-filtro');
    if (selectColunaFiltro) {
        selectColunaFiltro.addEventListener('change', filtrarPedidosNaTabela);
    }
}

async function carregarClientes() {
    try {
        const response = await fetch(`${API_URL}/api/pessoas`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) {
            console.error(`Erro HTTP ${response.status} ao carregar clientes.`);
            throw new Error('Falha ao buscar dados dos clientes do servidor.');
        }
        const data = await response.json();
        clientesDisponiveis = data.data || [];
        atualizarSelectClientes();
    } catch (error) {
        console.error('Erro detalhado ao carregar clientes:', error);
        mostrarErro('Não foi possível carregar a lista de clientes.');
    }
}

function atualizarSelectClientes() {
    const select = document.getElementById('select-cliente');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    clientesDisponiveis.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.ID_PESSOA_PK;
        option.textContent = cliente.NOME;
        option.dataset.cliente = JSON.stringify(cliente);
        select.appendChild(option);
    });
}

async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/api/itens`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) {
            console.error(`Erro HTTP ${response.status} ao carregar produtos.`);
            throw new Error('Falha ao buscar dados dos produtos do servidor.');
        }
        const data = await response.json();
        produtosDisponiveis = data.data || [];
        atualizarSelectProdutos();
    } catch (error) {
        console.error('Erro detalhado ao carregar produtos:', error);
        mostrarErro('Não foi possível carregar a lista de produtos.');
    }
}

function atualizarSelectProdutos(container = document) {
    container.querySelectorAll('.select-produto').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Selecione um produto</option>';
        produtosDisponiveis.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.idProduto; 
            option.textContent = `${produto.nome} (${formatarMoeda(produto.precoVenda)})`; 
            option.dataset.preco = produto.precoVenda;
            select.appendChild(option);
        });
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

function adicionarProduto() {
    const container = document.getElementById('produtos-container');
    if (!container) {
        console.error("Container de produtos ('produtos-container') não encontrado.");
        return;
    }
    const novoProdutoDiv = document.createElement('div');
    novoProdutoDiv.className = 'info-produtos';
    novoProdutoDiv.innerHTML = `
        <div class="campo-cad">
            <label>Produto</label>
            <select name="produto[]" class="select-produto" required>
                <option value="">Selecione um produto</option>
                ${produtosDisponiveis.map(produto => `
                    <option value="${produto.idProduto}" data-preco="${produto.precoVenda}">
                        ${produto.nome} (${formatarMoeda(produto.precoVenda)})
                    </option>
                `).join('')}
            </select>
        </div>
        <div class="campo-cad">
            <label>Quantidade</label>
            <input type="number" name="quantidade[]" placeholder="Ex.: 1" min="1" value="1" class="quantidade-produto">
        </div>
        <div class="campo-cad">
            <label>Desconto</label>
            <input type="text" name="desconto[]" placeholder="R$ 0,00" class="desconto-produto">
        </div>
        <div class="campo-cad">
            <label>Subtotal</label>
            <input type="text" name="subtotal[]" placeholder="R$ 0,00" readonly class="subtotal-produto">
        </div>
        <div class="container_novo_produto">
            <button type="button" class="remover_produto">
                <img src="assets/remover_produto.png" alt="Remover produto" />
            </button>
        </div>
    `;
    container.appendChild(novoProdutoDiv);
    novoProdutoDiv.querySelector('.remover_produto').addEventListener('click', function() {
        removerProduto(this);
    });
}

function removerProduto(botaoRemover) {
    botaoRemover.closest('.info-produtos')?.remove();
    calcularTotalPedido();
}

function calcularSubtotal(elementoInput) {
    const linhaProduto = elementoInput.closest('.info-produtos');
    if (!linhaProduto) return;
    const selectProduto = linhaProduto.querySelector('.select-produto');
    const quantidadeInput = linhaProduto.querySelector('.quantidade-produto');
    const descontoInput = linhaProduto.querySelector('.desconto-produto');
    const subtotalInput = linhaProduto.querySelector('.subtotal-produto');
    if (!selectProduto || !quantidadeInput || !descontoInput || !subtotalInput) return;

    const quantidade = parseFloat(quantidadeInput.value) || 0;
    const precoUnitario = parseFloat(selectProduto.selectedOptions[0]?.dataset.preco) || 0;
    let descontoValor = 0;
    if (descontoInput.value) {
        const strDesconto = String(descontoInput.value).replace(/[^\d,]/g, '').replace(',', '.');
        descontoValor = parseFloat(strDesconto) || 0;
    }
    const subtotal = (quantidade * precoUnitario) - descontoValor;
    subtotalInput.value = formatarMoeda(subtotal);
    calcularTotalPedido();
}

function calcularTotalPedido() {
    let totalGeral = 0;
    document.querySelectorAll('#produtos-container .subtotal-produto').forEach(inputSubtotal => {
        const strValor = String(inputSubtotal.value).replace(/[^\d,]/g, '').replace(',', '.');
        totalGeral += parseFloat(strValor) || 0;
    });
    const totalInput = document.querySelector('input[name="total"]');
    if (totalInput) {
        totalInput.value = formatarMoeda(totalGeral);
    }
}

function validarPedido() {
    const selectCliente = document.getElementById('select-cliente');
    if (!selectCliente || !selectCliente.value) {
        mostrarErro('Selecione um cliente para o pedido.');
        return false;
    }
    const produtosAdicionados = document.querySelectorAll('#produtos-container .info-produtos');
    if (produtosAdicionados.length === 0) {
        mostrarErro('Adicione pelo menos um produto ao pedido.');
        return false;
    }
    let temProdutosValidos = false;
    for (const linhaProduto of produtosAdicionados) {
        const select = linhaProduto.querySelector('.select-produto');
        const quantidadeInput = linhaProduto.querySelector('.quantidade-produto');
        if (select && select.value && quantidadeInput && parseFloat(quantidadeInput.value) > 0) {
            temProdutosValidos = true;
            break; 
        }
    }
    if (!temProdutosValidos) {
        mostrarErro('Verifique os produtos. Pelo menos um produto com quantidade válida deve ser selecionado.');
        return false;
    }
    abrirPopup('confirmacaoPedido');
    return true;
}

function abrirPopup(tipoPopup) {
    console.log("Função abrirPopup chamada com tipo:", tipoPopup); 
    let popupElement;

    if (!tipoPopup) {
        console.warn("abrirPopup foi chamada sem um 'tipoPopup'. Verifique a chamada no HTML (ex: onclick=\"abrirPopup('exportar')\") ou no JavaScript.");
        return; 
    }

    if (tipoPopup === 'exportar') {
        popupElement = document.getElementById('exportPopup');
    } else if (tipoPopup === 'confirmacaoPedido') {
        popupElement = document.getElementById('popUp'); 
    } else {
        popupElement = document.getElementById(tipoPopup); 
    }

    if (popupElement) {
        popupElement.style.display = 'flex';
    } else {
        console.warn(`Popup com tipo/ID '${tipoPopup}' não encontrado no DOM.`);
    }
}

// CORRIGIDO: Nome da função para 'fecharPopup' (minúsculo 'p')
function fecharPopup() {
    console.log("Função fecharPopup chamada");
    const exportPopUp = document.getElementById('exportPopup');
    if (exportPopUp) exportPopUp.style.display = 'none';

    const confirmacaoPedidoPopUp = document.getElementById('popUp');
    if (confirmacaoPedidoPopUp) confirmacaoPedidoPopUp.style.display = 'none';
}

async function confirmarPedido() {
    const popUpConfirmacao = document.getElementById('popUp');
    const btnConfirmar = popUpConfirmacao?.querySelector('.btn_salvar');
    if (btnConfirmar) {
        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    }
    try {
        const resultado = await emitirPedido();
        mostrarSucesso(`Pedido ${resultado.idPedido || ''} criado com sucesso!`);
        const formPedido = document.getElementById('formPedido');
        if (formPedido) {
            formPedido.reset();
            document.getElementById('select-cliente').value = '';
            document.getElementById('select-cliente').dispatchEvent(new Event('change'));
            const produtosContainer = document.getElementById('produtos-container');
            if (produtosContainer) produtosContainer.innerHTML = '';
            adicionarProduto(); 
            calcularTotalPedido();
        }
        await carregarEExibirPedidos();
    } catch (error) {
        console.error('Erro ao confirmar e registrar pedido:', error);
        mostrarErro(error.message || 'Ocorreu um erro ao registrar o pedido.');
    } finally {
        if (btnConfirmar) {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = 'Confirmar';
        }
        if (popUpConfirmacao) popUpConfirmacao.style.display = 'none';
    }
}

async function emitirPedido() {
    const token = localStorage.getItem('token');
    const form = document.getElementById('formPedido');
    if (!form) throw new Error('Formulário de criação de pedido (`formPedido`) não encontrado.');
    const selectCliente = document.getElementById('select-cliente');
    if (!selectCliente || !selectCliente.value) throw new Error('Cliente não selecionado.');
    const clienteData = JSON.parse(selectCliente.options[selectCliente.selectedIndex].dataset.cliente);

    const itens = Array.from(document.querySelectorAll('#produtos-container .info-produtos'))
        .map(linha => {
            const select = linha.querySelector('.select-produto');
            const quantidadeInput = linha.querySelector('.quantidade-produto');
            if (!select || !select.value || !quantidadeInput || !select.selectedOptions[0]?.dataset.preco) return null;
            const quantidade = parseFloat(quantidadeInput.value);
            if (isNaN(quantidade) || quantidade <= 0) return null;
            return {
                idProduto: parseInt(select.value),
                quantidade: quantidade,
                precoUnitario: parseFloat(select.selectedOptions[0].dataset.preco)
            };
        })
        .filter(item => item !== null);

    if (itens.length === 0) throw new Error('Nenhum produto válido adicionado ao pedido.');

    const formaPagamentoSelect = form.querySelector('select[name="forma_pagamento"]');
    const parcelasInput = form.querySelector('input[name="parcelas"]');
    const dadosPedido = {
        idPessoa: clienteData.ID_PESSOA_PK,
        listaItens: itens,
        formaPgto: formaPagamentoSelect ? formaPagamentoSelect.value : 'Não informado',
        parcelas: parcelasInput ? (parseInt(parcelasInput.value, 10) || 1) : 1
    };

    const response = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dadosPedido)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status} ao registrar pedido.` }));
        throw new Error(errorData.message || `Erro desconhecido (${response.status}) ao registrar pedido.`);
    }
    return await response.json();
}

function formatarDocumento(doc) {
    if (!doc) return '';
    const numeros = String(doc).replace(/\D/g, '');
    if (numeros.length === 11) return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (numeros.length === 14) return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    return doc;
}

function formatarTelefone(telefone) {
    if (!telefone) return '';
    const numeros = String(telefone).replace(/\D/g, '');
    if (numeros.length === 11) return numeros.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
    if (numeros.length === 10) return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return telefone;
}

function formatarMoeda(valor) {
    const numero = parseFloat(String(valor).replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (isNaN(numero)) return (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarErro(mensagem) {
    console.error("ERRO:", mensagem);
    alert(mensagem);
}

function mostrarSucesso(mensagem) {
    console.log("SUCESSO:", mensagem);
    alert(mensagem);
}

async function carregarEExibirPedidos() {
    const tabelaBody = document.getElementById('tabela-pedidos');
    if (!tabelaBody) {
        console.error('Elemento tbody da tabela de pedidos (`tabela-pedidos`) não encontrado.');
        return;
    }
    tabelaBody.innerHTML = `<tr><td colspan="17">Carregando pedidos...</td></tr>`;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/pedidos`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({message: `Erro HTTP ${response.status} ao buscar pedidos.`}));
            throw new Error(errorData.message || `Falha ao buscar pedidos: ${response.statusText}`);
        }
        const resultado = await response.json();
        const pedidos = resultado.data; 

        if (!Array.isArray(pedidos)) {
            console.error('Formato de dados de pedidos inesperado:', pedidos);
            throw new Error('Não foi possível processar os dados dos pedidos recebidos.');
        }
        if (pedidos.length === 0) {
            tabelaBody.innerHTML = '<tr><td colspan="17">Nenhum pedido encontrado.</td></tr>';
            return;
        }
        tabelaBody.innerHTML = '';
        pedidos.forEach(pedido => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="checkbox-check"><input type="checkbox" class="checkbox" data-pedido-id="${pedido.ID_PEDIDO_PK}"></td>
                <td>${pedido.ID_PEDIDO_PK || 'N/D'}</td>
                <td>${pedido.NOME_CLIENTE || `ID Pessoa: ${pedido.ID_PESSOA_FK}` || 'N/D'}</td>
                <td>${pedido.CPF_CNPJ_CLIENTE ? formatarDocumento(pedido.CPF_CNPJ_CLIENTE) : 'N/D'}</td>
                <td>${pedido.CELULAR_CLIENTE ? formatarTelefone(pedido.CELULAR_CLIENTE) : 'N/D'}</td>
                <td>${pedido.RUA_CLIENTE || 'N/D'}</td>
                <td>${pedido.NUMERO_CLIENTE || 'N/D'}</td>
                <td>${pedido.UF_CLIENTE || 'N/D'}</td>
                <td>${pedido.CIDADE_CLIENTE || 'N/D'}</td>
                <td>${pedido.NOME_PRODUTO || `ID Produto: ${pedido.ID_PRODUTO_FK}` || 'N/D'}</td>
                <td>${pedido.QUANTIDADE !== undefined ? pedido.QUANTIDADE : 'N/D'}</td>
                <td>${formatarMoeda(pedido.DESCONTO_TOTAL || 0)}</td>
                <td>${formatarMoeda(pedido.SUBTOTAL !== undefined ? pedido.SUBTOTAL : 0)}</td>
                <td>${pedido.FORMA_PGTO || 'N/D'}</td>
                <td>${pedido.PARCELAS !== undefined ? pedido.PARCELAS : 'N/D'}</td>
                <td>${formatarMoeda(pedido.TOTAL !== undefined ? pedido.TOTAL : 0)}</td>
                <td>${pedido.VENCIMENTO ? new Date(pedido.VENCIMENTO).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/D'}</td>
            `;
            tabelaBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro detalhado ao carregar e exibir pedidos:', error);
        if (tabelaBody) {
             tabelaBody.innerHTML = `<tr><td colspan="17">Erro ao carregar pedidos: ${error.message}. Verifique o console.</td></tr>`;
        }
        mostrarErro(`Falha ao carregar lista de pedidos: ${error.message}`);
    }
}

function filtrarPedidosNaTabela() {
    const termoBuscaInput = document.getElementById('buscar_pedidos');
    const colunaFiltroSelect = document.getElementById('coluna-filtro');
    if (!termoBuscaInput || !colunaFiltroSelect) {
        console.warn("Elementos de filtro não encontrados.");
        return;
    }
    const termoBusca = termoBuscaInput.value.toLowerCase().trim();
    const colunaFiltro = colunaFiltroSelect.value;
    const linhas = document.querySelectorAll('#tabela-pedidos tr');

    linhas.forEach(linha => {
        if (linha.cells.length === 0) return;
        let textoCelulaParaComparar = '';
        let indiceColuna;
        switch (colunaFiltro) {
            case 'id':       indiceColuna = 1; break;
            case 'nome':     indiceColuna = 2; break;
            case 'cpf_cnpj': indiceColuna = 3; break;
            case 'UF':       indiceColuna = 7; break;
            case 'cidade':   indiceColuna = 8; break;
            default:         indiceColuna = 2; 
        }
        const celula = linha.cells[indiceColuna];
        if (celula) {
            textoCelulaParaComparar = celula.textContent.toLowerCase();
        }
        linha.style.display = textoCelulaParaComparar.includes(termoBusca) ? '' : 'none';
    });
}

function exportarTabela(formato) {
    const tabela = document.getElementById('tabelaPrincipal');
    if (!tabela) {
        mostrarErro('Tabela de pedidos não encontrada para exportação.');
        return;
    }

    const headers = [];
    tabela.querySelectorAll('thead th:not(.checkbox-check)').forEach(th => {
        headers.push(th.querySelector('h3')?.textContent.trim() || th.textContent.trim());
    });
    
    const dadosParaExportar = [headers];
    const linhasVisiveis = tabela.querySelectorAll('tbody tr:not([style*="display: none"])'); 

    linhasVisiveis.forEach(linha => {
        const linhaDeDados = [];
        linha.querySelectorAll('td:not(.checkbox-check)').forEach(td => {
            linhaDeDados.push(td.textContent.trim());
        });
        dadosParaExportar.push(linhaDeDados);
    });

    if (dadosParaExportar.length <= 1) { 
        mostrarErro('Não há dados visíveis para exportar.');
        return;
    }

    const nomeArquivo = `relatorio_pedidos_${new Date().toISOString().slice(0,10)}`;

    if (formato === 'xlsx') {
        try {
            const ws = XLSX.utils.aoa_to_sheet(dadosParaExportar);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
            XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
            mostrarSucesso('Relatório XLSX gerado com sucesso!');
        } catch (e) {
            console.error("Erro ao gerar XLSX:", e);
            mostrarErro("Erro ao gerar relatório XLSX.");
        }
    } else if (formato === 'pdf') {
        const elementoParaPdf = document.getElementById('exportarPDF');
        const tabelaExportar = document.getElementById('tabela-exportar');

        if (!elementoParaPdf || !tabelaExportar) {
            mostrarErro('Elementos para exportação PDF não encontrados.');
            return;
        }

        tabelaExportar.innerHTML = ''; 
        const thead = tabelaExportar.createTHead();
        const tbody = tabelaExportar.createTBody();
        let tr = thead.insertRow();
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.style.border = "1px solid black"; 
            th.style.padding = "5px";
            th.style.textAlign = "left";
            th.style.backgroundColor = "#f2f2f2";
            tr.appendChild(th);
        });

        const dadosPdfSemCheckbox = dadosParaExportar.slice(1).map(linha => linha.slice(0)); 

        dadosPdfSemCheckbox.forEach(linhaDeDados => {
            tr = tbody.insertRow();
            linhaDeDados.forEach(dado => {
                const td = tr.insertCell();
                td.textContent = dado;
                td.style.border = "1px solid black"; 
                td.style.padding = "5px";
            });
        });
        
        elementoParaPdf.style.display = 'block'; 

        try {
            html2pdf().from(elementoParaPdf).set({
                margin: [10, 10, 10, 10], 
                filename: `${nomeArquivo}.pdf`,
                html2canvas: { scale: 2, useCORS: true }, 
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } 
            }).save().then(() => {
                elementoParaPdf.style.display = 'none'; 
                mostrarSucesso('Relatório PDF gerado com sucesso!');
            }).catch(err => {
                elementoParaPdf.style.display = 'none';
                console.error("Erro ao gerar PDF:", err);
                mostrarErro("Erro ao gerar relatório PDF.");
            });
        } catch(e) {
            elementoParaPdf.style.display = 'none';
            console.error("Erro ao gerar PDF:", e);
            mostrarErro("Erro ao gerar relatório PDF.");
        }
    }
    fecharPopup(); 
}

window.removerProduto = removerProduto;
window.validarPedido = validarPedido;
window.confirmarPedido = confirmarPedido;
window.abrirPopup = abrirPopup;
window.fecharPopup = fecharPopup; 
window.exportarTabela = exportarTabela;

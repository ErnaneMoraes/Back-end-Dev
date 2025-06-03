import { API_URL } from './api.js';

console.log("API_URL utilizada em frontProdutos.js:", API_URL);

document.addEventListener("DOMContentLoaded", () => {
    const tabelaEstoque = document.getElementById('tabela-estoqueProdutos');
    const btnBuscar = document.getElementById('btnBuscar');
    const btnRemover = document.getElementById('remover');
    const btnAtualizar = document.querySelector('.btn_editar');

    const editProductPopup = document.getElementById('editProductPopup');
    const closeEditPopupBtn = document.getElementById('closeEditPopupBtn');
    const editProductForm = document.getElementById('editProductForm');

    const editIdProduto = document.getElementById('edit_id_produto');
    const editTagProduto = document.getElementById('edit_tag_produto');
    const editNomeProduto = document.getElementById('edit_nome_produto');
    const editDescProduto = document.getElementById('edit_desc_produto');
    const editMedicaoProduto = document.getElementById('edit_medicao_produto');
    const editValorProduto = document.getElementById('edit_valor_produto');
    const editPrecoCusto = document.getElementById('edit_preco_custo');
    const editQuantidade = document.getElementById('edit_quantidade');

    function getToken() {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
            alert("Sessão expirada ou token não encontrado. Faça login novamente.");
        }
        return token;
    }

    async function carregarItens(filtro = '', valor = '') {
        const token = getToken();
        if (!token) {
            tabelaEstoque.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Usuário não autenticado. Faça o login.</td></tr>`;
            return;
        }
        if (!API_URL) {
            console.error("API_URL não está definida. Verifique api.js");
            tabelaEstoque.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Configuração da API não encontrada.</td></tr>`;
            return;
        }

        try {
            let url = `${API_URL}/api/itens`;
            if (filtro && valor) {
                url += `?${encodeURIComponent(filtro)}=${encodeURIComponent(valor)}`;
            }
            const response = await fetch(url, { headers: { 'x-access-token': token } });
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ mensagem: "Não foi possível obter detalhes do erro do servidor." }));
                 throw new Error(`Erro ao carregar itens: ${response.status} ${response.statusText}. ${errorData.mensagem}`);
            }
            const resultado = await response.json();
            preencherTabela(resultado.data || []);
        } catch (error) {
            console.error('Erro detalhado ao carregar itens:', error.message, error.stack, error);
            tabelaEstoque.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Erro ao carregar itens: ${error.message}. Verifique o console.</td></tr>`;
        }
    }

    function preencherTabela(itens) {
        tabelaEstoque.innerHTML = '';
        if (!itens || itens.length === 0) {
            tabelaEstoque.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum item encontrado.</td></tr>';
            return;
        }
        itens.forEach(item => {
            const precoVenda = item.precoVenda != null ? Number(item.precoVenda) : 0;
            const quantidade = item.quantidade != null ? item.quantidade : 0;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="checkbox-item" data-id="${item.idProduto}"></td>
                <td>${item.idProduto || '-'}</td>
                <td>${item.tag || '-'}</td>
                <td>${item.nome || '-'}</td>
                <td>${item.descricao || '-'}</td>
                <td>${item.medida || 'un'}</td>
                <td>R$ ${precoVenda.toFixed(2).replace('.',',')}</td>
                <td>${quantidade}</td>
            `;
            tabelaEstoque.appendChild(row);
        });
    }

    if (btnBuscar) {
        btnBuscar.addEventListener('click', function () {
            const filtro = document.getElementById('coluna-filtro').value;
            const valorBusca = document.getElementById('buscar_pedidos').value;
            carregarItens(filtro, valorBusca);
        });
    }

    if (btnRemover) {
        btnRemover.addEventListener('click', async function() {
            const checkboxes = document.querySelectorAll('.checkbox-item:checked');
            if (checkboxes.length === 0) {
                alert('Selecione pelo menos um item para remover.'); return;
            }
            if (!confirm(`Deseja realmente remover ${checkboxes.length} item(ns) selecionado(s)?`)) return;
            
            const token = getToken();
            if (!token) return;
            try {
                const idsParaRemover = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
                let erros = 0; 
                let mensagensDeErroParaAlert = []; 

                for (const id of idsParaRemover) {
                    const response = await fetch(`${API_URL}/api/itens/${id}`, { method: 'DELETE', headers: { 'x-access-token': token } });
                    
                    if (!response.ok) {
                        erros++;
                        let mensagemDetalhadaParaLista = `Item ${id}: Erro ${response.status} (${response.statusText || 'Status Desconhecido'})`;
                        let mensagemEspecificaDaApi = null; 
                        let errorDetailsFromServer = {}; 

                        try {
                            errorDetailsFromServer = await response.json();
                            if (errorDetailsFromServer.mensagem) {
                                mensagemEspecificaDaApi = errorDetailsFromServer.mensagem;
                                mensagemDetalhadaParaLista += ` - ${mensagemEspecificaDaApi}`;
                            } else if (errorDetailsFromServer.message) { // Verifica também por 'message'
                                mensagemEspecificaDaApi = errorDetailsFromServer.message;
                                mensagemDetalhadaParaLista += ` - ${mensagemEspecificaDaApi}`;
                            } else {
                                const jsonString = JSON.stringify(errorDetailsFromServer);
                                if (jsonString !== '{}') { 
                                    mensagemDetalhadaParaLista += ` - Corpo: ${jsonString}`;
                                }
                            }
                        } catch (e) {
                            try {
                                const textError = await response.text();
                                if (textError) {
                                    mensagemDetalhadaParaLista += ` - Resposta: ${textError}`;
                                }
                            } catch (textEx) { /* Ignora */ }
                        }
                        
                        mensagensDeErroParaAlert.push({
                            id: id,
                            detalhada: mensagemDetalhadaParaLista, 
                            especificaAPI: mensagemEspecificaDaApi 
                        });
                        
                        console.error(`--- Erro ao remover item ${id} ---`);
                        console.error(`Status HTTP: ${response.status} (${response.statusText})`);
                        console.error("Corpo da Resposta da API (se JSON):", errorDetailsFromServer);
                        console.error("Mensagem Detalhada Construída:", mensagemDetalhadaParaLista);
                        console.error(`----------------------------------`);
                    }
                }

                if (erros > 0) {
                    if (erros === 1 && mensagensDeErroParaAlert.length === 1 && mensagensDeErroParaAlert[0].especificaAPI) {
                        alert(mensagensDeErroParaAlert[0].especificaAPI);
                    } else {
                        const listaMensagensDetalhadas = mensagensDeErroParaAlert.map(err => err.detalhada);
                        alert(`${erros} item(ns) não puderam ser removidos.\nFalhas:\n${listaMensagensDetalhadas.join('\n')}`);
                    }
                } else {
                    alert('Item(ns) removido(s) com sucesso!');
                }
                carregarItens();
            } catch (error) {
                console.error('Erro na operação de remoção (ex: falha de rede):', error.message, error.stack, error);
                alert('Erro ao tentar remover itens (possível falha de rede). Verifique o console.');
            }
        });
    }

    async function abrirPopUpParaEdicao(idProduto) {
        console.log(`Abrindo popup para edição com ID: ${idProduto}`);
        const token = getToken();
        if (!token) { alert("Ação requer autenticação. Faça o login."); return; }
        if (!idProduto) { console.error("ID do produto não fornecido para edição."); return; }

        try {
            const response = await fetch(`${API_URL}/api/itens/${idProduto}`, { headers: { 'x-access-token': token } });
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ mensagem: "Não foi possível obter detalhes do erro do servidor." }));
                 throw new Error(`Falha ao buscar dados do produto: ${response.status} ${response.statusText}. Detalhe: ${errorData.mensagem}`);
            }
            const produtoDetalhe = await response.json();
            if (produtoDetalhe && produtoDetalhe.data) {
                const item = produtoDetalhe.data;
                editIdProduto.value = item.idProduto;
                editTagProduto.value = item.tag || '';
                editNomeProduto.value = item.nome || '';
                editDescProduto.value = item.descricao || '';
                editMedicaoProduto.value = item.medida || 'un';
                editValorProduto.value = item.precoVenda != null ? Number(item.precoVenda).toFixed(2) : '0.00';
                editPrecoCusto.value = item.precoCusto != null ? Number(item.precoCusto).toFixed(2) : '0.00';
                editQuantidade.value = item.quantidade != null ? item.quantidade : '0';
                if (editProductPopup) editProductPopup.style.display = 'flex';
            } else {
                alert("Produto não encontrado ou formato de resposta inesperado da API (esperava propriedade 'data').");
                console.warn("Resposta da API ao buscar produto para edição:", produtoDetalhe);
            }
        } catch (error) {
            console.error("-------------------------------------------------------------");
            console.error("ERRO DETALHADO AO BUSCAR PRODUTO PARA EDIÇÃO (ID: " + idProduto + "):");
            console.error("Mensagem:", error.message);
            console.error("Stack Trace:", error.stack);
            console.error("Objeto do Erro Completo:", error);
            console.error("-------------------------------------------------------------");
            alert(`Erro ao carregar dados do produto: ${error.message}. Verifique o console.`);
        }
    }

    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.checkbox-item:checked');
            if (checkboxes.length !== 1) { alert('Selecione um único item para atualizar.'); return; }
            const idProduto = checkboxes[0].getAttribute('data-id');
            abrirPopUpParaEdicao(idProduto);
        });
    }

    if (closeEditPopupBtn && editProductPopup) {
        closeEditPopupBtn.addEventListener('click', () => {
            editProductPopup.style.display = 'none';
        });
    }

    if (editProductForm && editProductPopup) {
        editProductForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const token = getToken();
            if (!token) return;

            const idProduto = editIdProduto.value;
            const dadosProduto = {
                nome: editNomeProduto.value.trim(),
                tag: editTagProduto.value.trim(),
                descricao: editDescProduto.value.trim(),
                medida: editMedicaoProduto.value.trim(),
                precoVenda: parseFloat(editValorProduto.value),
                precoCusto: parseFloat(editPrecoCusto.value),
                quantidade: parseInt(editQuantidade.value)
            };

            if (!dadosProduto.nome || !dadosProduto.tag || !dadosProduto.medida || isNaN(dadosProduto.precoVenda) || isNaN(dadosProduto.precoCusto) || isNaN(dadosProduto.quantidade)) {
                alert("Preencha todos os campos obrigatórios corretamente com valores válidos.");
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/itens/${idProduto}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'x-access-token': token },
                    body: JSON.stringify(dadosProduto)
                });
                const data = await response.json();
                
                if (response.ok && data?.success) {
                    alert(data.message || 'Produto atualizado com sucesso!');
                    editProductPopup.style.display = 'none';
                    carregarItens();
                } else {
                    alert(`Erro ao atualizar o produto: ${data?.message || response.statusText || 'Erro desconhecido.'}`);
                    console.error("Erro ao atualizar produto - Resposta da API:", data);
                }
            } catch (error) {
                console.error('Erro na requisição de atualização do produto:', error.message, error.stack, error);
                alert('Falha na conexão com o servidor ao tentar atualizar. Verifique o console.');
            }
        });
    }
    
    const selecionarTodosCheckbox = document.getElementById('selecionar-todos');
    if (selecionarTodosCheckbox) {
        selecionarTodosCheckbox.addEventListener('change', function() {
            const checkboxesItens = document.querySelectorAll('.checkbox-item');
            checkboxesItens.forEach(checkbox => { checkbox.checked = selecionarTodosCheckbox.checked; });
        });
    }

    if (API_URL) carregarItens();
});
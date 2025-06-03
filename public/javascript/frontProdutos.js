import { API_URL } from './api.js'; // Certifique-se que este caminho está correto

// Adicione este log para verificar se a API_URL está sendo carregada corretamente
console.log("API_URL utilizada em frontProdutos.js:", API_URL);

document.addEventListener("DOMContentLoaded", () => {
    const tabelaEstoque = document.getElementById('tabela-estoqueProdutos');
    const btnBuscar = document.getElementById('btnBuscar');
    const btnRemover = document.getElementById('remover');
    const btnAtualizar = document.querySelector('.btn_editar');

    // Elementos do Popup de Edição
    const editProductPopup = document.getElementById('editProductPopup');
    const closeEditPopupBtn = document.getElementById('closeEditPopupBtn');
    const editProductForm = document.getElementById('editProductForm');

    // Inputs do formulário de edição
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
            // Considere redirecionar para a página de login:
            // window.location.href = '/login.html';
        }
        return token;
    }

    async function carregarItens(filtro = '', valor = '') {
        const token = getToken();
        if (!token) {
            // Se não houver token, não prosseguir ou exibir mensagem na tabela
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

            const response = await fetch(url, {
                headers: { 'x-access-token': token }
            });

            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ mensagem: "Não foi possível obter detalhes do erro do servidor." }));
                 throw new Error(`Erro ao carregar itens: ${response.status} ${response.statusText}. ${errorData.mensagem}`);
            }
            const resultado = await response.json();
            preencherTabela(resultado.data || []);
        } catch (error) {
            console.error('Erro detalhado ao carregar itens:', error.message, error.stack, error);
            tabelaEstoque.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Erro ao carregar itens: ${error.message}. Verifique o console para mais detalhes.</td></tr>`;
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
                alert('Selecione pelo menos um item para remover.');
                return;
            }
            if (!confirm(`Deseja realmente remover ${checkboxes.length} item(ns) selecionado(s)?`)) {
                return;
            }
            
            const token = getToken();
            if (!token) return;

            try {
                const idsParaRemover = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
                let erros = 0;
                let mensagensErro = [];

                for (const id of idsParaRemover) {
                    const response = await fetch(`${API_URL}/api/itens/${id}`, {
                        method: 'DELETE',
                        headers: { 'x-access-token': token }
                    });
                    if (!response.ok) {
                        erros++;
                        const errorData = await response.json().catch(() => ({ mensagem: "Não foi possível obter detalhes do erro." }));
                        mensagensErro.push(`Item ${id}: ${response.status} - ${errorData.mensagem || response.statusText}`);
                        console.error(`Erro ao remover item ${id}: ${response.statusText}`, errorData);
                    }
                }
                
                if (erros > 0) {
                    alert(`${erros} item(ns) não puderam ser removidos.\nDetalhes:\n${mensagensErro.join('\n')}`);
                } else {
                    alert('Item(ns) removido(s) com sucesso!');
                }
                carregarItens();
            } catch (error) {
                console.error('Erro na operação de remoção:', error.message, error.stack, error);
                alert('Erro ao tentar remover itens. Verifique o console para mais detalhes.');
            }
        });
    }

    async function abrirPopUpParaEdicao(idProduto) {
        console.log(`Abrindo popup para edição com ID: ${idProduto}`);
        const token = getToken();
        if (!token) {
            alert("Ação requer autenticação. Faça o login.");
            return;
        }
        if (!idProduto) {
            console.error("ID do produto não fornecido para edição.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/itens/${idProduto}`, {
                headers: { 'x-access-token': token }
            });

            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ mensagem: "Não foi possível obter detalhes do erro do servidor." }));
                 // Lança um erro que será capturado pelo bloco catch abaixo
                 throw new Error(`Falha ao buscar dados do produto: ${response.status} ${response.statusText}. Detalhe: ${errorData.mensagem}`);
            }

            const produtoDetalhe = await response.json();
            if (produtoDetalhe && produtoDetalhe.data) { // Assumindo que a API encapsula o item em 'data'
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
                // Se a API retorna o item diretamente (sem estar encapsulado em 'data')
                // E se produtoDetalhe for o próprio item e não tiver a propriedade 'data'
                // você pode precisar ajustar esta lógica. Por exemplo:
                // const item = produtoDetalhe; (se produtoDetalhe for o objeto do item diretamente)
                // ... e então preencher os campos ...
                // Ou, se a estrutura 'data' é esperada e não veio:
                alert("Produto não encontrado ou formato de resposta inesperado da API (esperava propriedade 'data').");
                console.warn("Resposta da API ao buscar produto para edição:", produtoDetalhe);
            }
        } catch (error) {
            // Log de erro mais detalhado:
            console.error("-------------------------------------------------------------");
            console.error("ERRO DETALHADO AO BUSCAR PRODUTO PARA EDIÇÃO (ID: " + idProduto + "):");
            console.error("Mensagem:", error.message);
            console.error("Stack Trace:", error.stack);
            console.error("Objeto do Erro Completo:", error);
            console.error("-------------------------------------------------------------");
            alert(`Erro ao carregar dados do produto para edição: ${error.message}. Verifique o console para mais detalhes técnicos.`);
        }
    }

    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.checkbox-item:checked');
            if (checkboxes.length !== 1) {
                alert('Selecione um único item para atualizar.');
                return;
            }
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
                alert("Por favor, preencha todos os campos obrigatórios corretamente com valores válidos.");
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/itens/${idProduto}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': token
                    },
                    body: JSON.stringify(dadosProduto)
                });

                const data = await response.json(); 
                if (response.ok && data?.success) {  
                    alert('Produto atualizado com sucesso!');
                    editProductPopup.style.display = 'none';
                    carregarItens();
                } else {
                    alert(`Erro ao atualizar o produto: ${data?.mensagem || response.statusText || 'Erro desconhecido.'}`);
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
            checkboxesItens.forEach(checkbox => {
                checkbox.checked = selecionarTodosCheckbox.checked;
            });
        });
    }

    // Carregamento inicial dos itens (somente se API_URL estiver definida)
    if (API_URL) {
       carregarItens();
    } else {
        // Mensagem já é exibida dentro de carregarItens se API_URL estiver faltando.
        // Ou pode-se adicionar uma mensagem mais genérica aqui se preferir.
    }
});
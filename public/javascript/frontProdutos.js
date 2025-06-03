import { API_URL } from './api.js';

document.addEventListener("DOMContentLoaded", () => {
    // Elementos do DOM para o pop-up de edição
    const popUpElement = document.getElementById("popUp");
    const formAtualizarProduto = document.getElementById('formAtualizarProduto');
    const produtoIdParaAtualizarSpan = document.getElementById("produtoIdParaAtualizar");
    const popupIdProdutoHiddenInput = document.getElementById('popupIdProdutoHidden');
    const popupNomeProdutoInput = document.getElementById('popupNomeProduto');
    const popupDescricaoProdutoTextarea = document.getElementById('popupDescricaoProduto');
    const popupPrecoCustoInput = document.getElementById('popupPrecoCusto');
    const popupPrecoVendaInput = document.getElementById('popupPrecoVenda');
    const popupQuantidadeInput = document.getElementById('popupQuantidade');
    const btnSalvarAtualizacaoProduto = document.getElementById('btnSalvarAtualizacaoProduto');
    const popupCloseBtn = popUpElement ? popUpElement.querySelector('.popup-close-btn') : null;

    // Botão de cadastro (se for um pop-up/modal diferente do de edição)
    const btnCadastrarOriginal = document.getElementById("cad_produtos"); // Renomeado para evitar conflito de nome
    const btnFecharPopupOriginal = document.getElementById("close_popUp"); // Para o pop-up de cadastro original

    if (btnCadastrarOriginal) {
        btnCadastrarOriginal.addEventListener("click", async function (event) {
            event.preventDefault();
            const token = getToken();
            if (!token) return;

            const nome_produto = document.querySelector("input[name='nome_produto']").value.trim();
            const tag_produto = document.querySelector("input[name='tag_produto']").value.trim();
            const desc_produto = document.querySelector("input[name='desc_produto']").value.trim();
            const medicao_produto = document.querySelector("select[name='medicao']").value.trim();
            const valor_produto = document.querySelector("input[name='valor_unitario']").value.trim();
            const preco_custo = document.querySelector("input[name='preco_custo']").value.trim();
            const quantidade = document.querySelector("input[name='quantidade']").value.trim();

            if (!nome_produto || !desc_produto || !tag_produto || !medicao_produto || !valor_produto || !preco_custo || !quantidade) {
                alert("Por favor, preencha todos os campos para cadastrar.");
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/itens`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-access-token": token
                    },
                    body: JSON.stringify({
                        nome: nome_produto,
                        tag: tag_produto,
                        descricao: desc_produto,
                        medida: medicao_produto,
                        precoVenda: parseFloat(valor_produto),
                        precoCusto: parseFloat(preco_custo),
                        quantidade: parseInt(quantidade)
                    })
                });

                const data = await response.json();
                console.log("Resposta do servidor (cadastro):", data);

                if (response.ok && data?.sucesso) {
                    alert("Produto cadastrado com sucesso!");
                    // Se o cadastro usa um pop-up diferente, feche-o aqui
                    // document.getElementById("ID_DO_POPUP_DE_CADASTRO").style.display = "none";
                    carregarItens();
                } else {
                    alert(data?.mensagem || "Erro ao cadastrar o produto.");
                }
            } catch (error) {
                console.error("Erro ao enviar cadastro:", error);
                alert("Falha na conexão com o servidor ao cadastrar.");
            }
        });
    }

    if (btnFecharPopupOriginal) { // Para o pop-up de cadastro original, se houver
        btnFecharPopupOriginal.addEventListener("click", function () {
            // document.getElementById("ID_DO_POPUP_DE_CADASTRO").style.display = "none";
            console.log("Botão fechar pop-up de cadastro clicado (se aplicável)");
        });
    }

    // ===================== LÓGICA DO POP-UP DE EDIÇÃO ======================

    async function abrirPopUpEdicao(idProduto) {
        const token = getToken();
        if (!token) return;

        if (popUpElement && formAtualizarProduto) {
            formAtualizarProduto.reset();
            popUpElement.style.display = "flex";

            if (produtoIdParaAtualizarSpan) produtoIdParaAtualizarSpan.textContent = idProduto;
            if (popupIdProdutoHiddenInput) popupIdProdutoHiddenInput.value = idProduto;
            
            try {
                // Ajuste o endpoint se for /produtos/:id em vez de /api/itens/:id
                const response = await fetch(`${API_URL}/api/itens/${idProduto}`, { 
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': token
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status}` }));
                    console.error(`Erro ao buscar item ${idProduto}: ${response.status}`, errorData);
                    alert(`Não foi possível carregar os dados do item: ${errorData.message || response.statusText}`);
                    if (popupNomeProdutoInput) popupNomeProdutoInput.value = "Erro ao carregar dados";
                    return;
                }

                const dadosDoItem = await response.json();
                const itemData = dadosDoItem.data; // Assumindo que os dados do item estão em response.data

                if (popupNomeProdutoInput) popupNomeProdutoInput.value = itemData.nome || '';
                if (popupDescricaoProdutoTextarea) popupDescricaoProdutoTextarea.value = itemData.descricao || '';
                if (popupPrecoCustoInput) popupPrecoCustoInput.value = itemData.precoCusto !== undefined ? itemData.precoCusto : '';
                if (popupPrecoVendaInput) popupPrecoVendaInput.value = itemData.precoVenda !== undefined ? itemData.precoVenda : '';
                if (popupQuantidadeInput) popupQuantidadeInput.value = itemData.quantidade !== undefined ? itemData.quantidade : '';
                
                console.log("Dados do item carregados no formulário de edição:", itemData);

            } catch (error) {
                console.error("Erro na requisição para buscar item:", error);
                alert("Ocorreu um erro de rede ou script ao tentar carregar os dados do item. Verifique o console.");
            }
        } else {
            if (!popUpElement) console.error("Elemento do pop-up de edição (ID 'popUp') não foi encontrado.");
            if (!formAtualizarProduto) console.error("Formulário de atualização (ID 'formAtualizarProduto') não foi encontrado.");
        }
    }

    function fecharPopUpEdicao() {
        if (popUpElement) {
            popUpElement.style.display = "none";
        }
    }

    if (popupCloseBtn) {
        popupCloseBtn.addEventListener('click', fecharPopUpEdicao);
    }
    // Adicionar listener para fechar ao clicar fora, se o popUpElement existir
    if (popUpElement) {
        popUpElement.addEventListener('click', function(event) {
            if (event.target === popUpElement) {
                fecharPopUpEdicao();
            }
        });
    }


    if (btnSalvarAtualizacaoProduto) {
        btnSalvarAtualizacaoProduto.addEventListener('click', async function() {
            const idProduto = popupIdProdutoHiddenInput ? popupIdProdutoHiddenInput.value : null;
            const token = getToken();

            if (!idProduto) {
                alert("ID do produto não encontrado para atualização.");
                return;
            }
            if (!token) return;

            const nome = popupNomeProdutoInput ? popupNomeProdutoInput.value : '';
            const descricao = popupDescricaoProdutoTextarea ? popupDescricaoProdutoTextarea.value : '';
            const precoCustoInputVal = popupPrecoCustoInput ? popupPrecoCustoInput.value : '';
            const precoVendaInputVal = popupPrecoVendaInput ? popupPrecoVendaInput.value : '';
            const quantidadeInputVal = popupQuantidadeInput ? popupQuantidadeInput.value : '';

            const dadosAtualizados = {
                nome: nome,
                descricao: descricao,
                // A API espera precoCusto, precoVenda, quantidade.
                // Assegure que os nomes das chaves correspondem ao esperado pela API.
                precoCusto: precoCustoInputVal !== '' ? parseFloat(precoCustoInputVal) : null,
                precoVenda: precoVendaInputVal !== '' ? parseFloat(precoVendaInputVal) : null,
                quantidade: quantidadeInputVal !== '' ? parseInt(quantidadeInputVal, 10) : null
            };

            // Remove chaves nulas ou vazias se a API não as aceitar
            Object.keys(dadosAtualizados).forEach(key => {
                if (dadosAtualizados[key] === null || dadosAtualizados[key] === '') {
                    // delete dadosAtualizados[key]; // Descomente se a API não aceitar null/empty
                }
                if ((key === 'precoCusto' || key === 'precoVenda' || key === 'quantidade') && isNaN(dadosAtualizados[key])) {
                     dadosAtualizados[key] = null; // Ou delete, dependendo da API
                }
            });

            try {
                // Ajuste o endpoint se for /produtos/:id em vez de /api/itens/:id
                const response = await fetch(`${API_URL}/api/itens/${idProduto}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': token
                    },
                    body: JSON.stringify(dadosAtualizados)
                });

                if (response.ok) {
                    const data = await response.json();
                    alert(data.mensagem || "Produto atualizado com sucesso!");
                    fecharPopUpEdicao();
                    carregarItens(); 
                } else {
                    const errorData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status}` }));
                    console.error("Erro ao atualizar produto:", response.status, errorData);
                    alert(`Falha ao atualizar produto: ${errorData.message || response.statusText}`);
                }
            } catch (error) {
                console.error("Erro na requisição PUT:", error);
                alert("Ocorreu um erro de rede ou script ao tentar atualizar o produto.");
            }
        });
    }


    // ===================== CARREGAMENTO DA TABELA (EXISTENTE) ======================
    const tabelaEstoque = document.getElementById('tabela-estoqueProdutos'); // tbody
    const btnBuscar = document.getElementById('btnBuscar');
    const btnRemover = document.getElementById('remover');
    const btnAtualizarTabela = document.querySelector('.btn_editar'); // Botão principal "Atualizar" da página
    const btnNovoTabela = document.querySelector('.btn_salvar'); // Botão principal "Novo" da página

    async function carregarItens(filtro = '', valor = '') {
        const token = getToken();
        if (!token || !tabelaEstoque) return;

        try {
            let url = `${API_URL}/api/itens`;
            if (filtro && valor) {
                url += `?${filtro}=${encodeURIComponent(valor)}`;
            }

            const response = await fetch(url, {
                headers: { 'x-access-token': token }
            });

            if (!response.ok) throw new Error(`Erro ao carregar itens: ${response.statusText}`);
            const resultado = await response.json();
            
            if (resultado && resultado.data) {
                preencherTabela(resultado.data);
            } else {
                 preencherTabela([]); // Limpa a tabela se não houver dados
                 console.warn("Nenhum dado retornado pela API ou formato inesperado:", resultado);
            }
        } catch (error) {
            console.error('Erro em carregarItens:', error);
            // alert('Erro ao carregar itens do estoque. Verifique o console.');
            if (tabelaEstoque) tabelaEstoque.innerHTML = '<tr><td colspan="8">Erro ao carregar dados.</td></tr>';
        }
    }

    function preencherTabela(itens) {
        if (!tabelaEstoque) return;
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
                <td>R$ ${precoVenda.toFixed(2)}</td>
                <td>${quantidade}</td>
            `;
            tabelaEstoque.appendChild(row);
        });
    }

    if (btnBuscar) {
        btnBuscar.addEventListener('click', function () {
            const filtroSelect = document.getElementById('coluna-filtro');
            const valorBuscaInput = document.getElementById('buscar_pedidos');
            if (filtroSelect && valorBuscaInput) {
                const filtro = filtroSelect.value;
                const valorBusca = valorBuscaInput.value;
                carregarItens(filtro, valorBusca);
            }
        });
    }

    if (btnRemover) {
        btnRemover.addEventListener('click', async function() {
            const checkboxes = document.querySelectorAll('.checkbox-item:checked');
            if (checkboxes.length === 0) {
                alert('Selecione pelo menos um item para remover');
                return;
            }
            if (!confirm(`Deseja realmente remover ${checkboxes.length} item(ns)?`)) {
                return;
            }
            
            const token = getToken();
            if(!token) return;

            try {
                const ids = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
                let todosRemovidos = true;
                for (const id of ids) {
                    const response = await fetch(`${API_URL}/api/itens/${id}`, {
                        method: 'DELETE',
                        headers: { 'x-access-token': token }
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(()=>({mensagem: `Erro ao remover item ${id}`}));
                        alert(errorData.mensagem || `Erro ao remover item ${id}`);
                        todosRemovidos = false; // Marca que pelo menos um falhou
                        // break; // Pode optar por parar na primeira falha
                    }
                }
                if (todosRemovidos && ids.length > 0) {
                     alert('Item excluído com sucesso!');
                } else if (ids.length === 0) {
                     alert('Nenhum item foi excluído.');
                }
                carregarItens();
            } catch (error) {
                console.error('Erro ao remover itens:', error);
                alert('Erro geral ao tentar remover itens.');
            }
        });
    }

    if (btnAtualizarTabela) { // Botão "Atualizar" da página de listagem
        btnAtualizarTabela.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.checkbox-item:checked');
            if (checkboxes.length !== 1) {
                alert('Selecione um único item para atualizar.');
                return;
            }
            const idProduto = checkboxes[0].getAttribute('data-id');
            abrirPopUpEdicao(idProduto); // Chama a função local de edição
        });
    }

    if (btnNovoTabela) { // Botão "Novo" da página de listagem
        btnNovoTabela.addEventListener('click', function() {
            // Se o botão "Novo" deve abrir o mesmo pop-up, mas para cadastro:
            // abrirPopUpEdicao(null); // Passa null como idProduto, e a função abrirPopUpEdicao precisaria tratar isso
            // Ou, se ele redireciona para cad_produto.html, o <a> já faz isso.
            // Se for para abrir um pop-up de cadastro diferente, essa lógica já está no início do arquivo.
            // Por ora, o <a> no HTML já redireciona. Se for para abrir um pop-up,
            // você precisaria de um pop-up de CADASTRO e uma função para abri-lo.
            // O código original para btnCadastrarOriginal parece ser para um formulário em outra página ou um pop-up diferente.
            // Se o pop-up com id="popUp" também for usado para NOVO, a função abrirPopUpEdicao
            // precisaria de uma lógica para limpar os campos e mudar o título/botão de salvar.
            console.log("Botão Novo da tabela clicado. Redirecionamento via <a> no HTML.");
        });
    }

    carregarItens(); // Carrega os itens ao iniciar a página
});

function getToken() {
    const token = localStorage.getItem("jwtToken"); // Certifique-se que a chave é "jwtToken"
    if (!token) {
        console.warn("Token JWT não encontrado no localStorage.");
        // alert("Sessão expirada ou não autenticado. Faça login novamente.");
        // window.location.href = 'index.html'; // Redireciona para login se não houver token
    }
    return token;
}

// Para que o onclick="logout()" no HTML funcione se script.js for removido ou não tornar logout global
window.logout = function() {
    localStorage.removeItem('jwtToken'); // Use a mesma chave do token
    localStorage.removeItem('token'); // Limpa também a chave antiga, se houver
    window.location.href = 'index.html';
};

// Para que o onclick="adicionarEventosSidebar()" no HTML (dentro do fetch da sidebar) funcione
window.adicionarEventosSidebar = function() {
    const openBtn = document.getElementById('open_btn');
    if (openBtn) {
        openBtn.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.toggle('open-sidebar');
            }
        });
    }
};

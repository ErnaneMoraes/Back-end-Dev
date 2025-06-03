// Desconectando do site
function logout() {
    localStorage.removeItem('jwtToken'); // Alterado de 'token' para 'jwtToken' para consistência
    window.location.href = 'index.html';
}

// Função para adicionar eventos ao botão da sidebar
function adicionarEventosSidebar() {
    const openBtn = document.getElementById('open_btn');
    const sidebar = document.getElementById('sidebar');
    if (openBtn && sidebar) {
        openBtn.addEventListener('click', function() {
            sidebar.classList.toggle('open-sidebar');
        });
    } else {
        console.warn("Botão de abrir sidebar ou a própria sidebar não encontrados para adicionar eventos.");
    }
}

// As funções abaixo (abrirPopUp, fecharPopUp, window.onclick para #popUp)
// referem-se a um popup genérico com id="popUp".
// Se este popup não existe ou não é mais usado, estas funções podem ser removidas
// para evitar confusão com a lógica em popUp.js que lida com #popUpProduto.

// Exibindo pop up genérico (NÃO usado por cad_produto.html diretamente)
function abrirPopUp() {
    const genericPopUp = document.getElementById("popUp");
    if (genericPopUp) {
        genericPopUp.style.display = "block";
    } else {
        console.warn("Tentativa de abrir popUp genérico (id='popUp'), mas não foi encontrado.");
    }
}

function fecharPopUp() {
    const genericPopUp = document.getElementById("popUp");
    if (genericPopUp) {
        genericPopUp.style.display = "none";
    }
}

// Fechar popUp genérico ao clicar fora do modal
window.addEventListener('click', function(event) {
    let genericPopUp = document.getElementById("popUp");
    if (genericPopUp && event.target === genericPopUp) {
        genericPopUp.style.display = "none";
    }
});


// ---- INÍCIO DO CÓDIGO PROVAVELMENTE PARA OUTRAS PÁGINAS (EX: CONSULTA DE PEDIDOS/PRODUTOS) ----
// O código abaixo parece ser para tabelas com checkboxes e filtros,
// não diretamente relacionado ao formulário de cadastro de produto.

document.addEventListener("DOMContentLoaded", function () {
    const checkboxes = document.querySelectorAll("#tabela-pedidos .checkbox, #tabela-estoqueProdutos .checkbox"); // Generalizado para tabelas comuns
    const selecionarTodos = document.getElementById("selecionar-todos");

    if (checkboxes.length > 0) { // Só adiciona listeners se houver checkboxes de item
        document.addEventListener("change", function(event) {
            const target = event.target;
            if (target.matches(".checkbox") && target.id !== "selecionar-todos") {
                let linha = target.closest("tr");
                if (linha && linhaHasData(linha)) { // Verifica se linha não é null
                    linha.classList.toggle("selecionado", target.checked);
                } else if (linha) { // Se linha existe mas está vazia
                    target.checked = false;
                }
                if (selecionarTodos) atualizarSelecionarTodos(selecionarTodos, checkboxes); // Passa referências
            }
        });
    }

    if (selecionarTodos) {
        selecionarTodos.addEventListener("change", function () {
            const isChecked = this.checked;
            checkboxes.forEach(checkbox => {
                let linha = checkbox.closest("tr");
                if (linha && linhaHasData(linha)) { // Verifica se linha não é null
                    checkbox.checked = isChecked;
                    linha.classList.toggle("selecionado", isChecked);
                } else if (linha) { // Linha vazia, não deve ser selecionada por "selecionar todos"
                    checkbox.checked = false; 
                    linha.classList.remove("selecionado");
                }
            });
        });
    }
});

// Função para verificar se uma linha tem dados preenchidos
function linhaHasData(linha) {
    if (!linha) return false; // Checagem de segurança
    const celulas = linha.querySelectorAll("td:not(.checkbox-check)");
    return Array.from(celulas).some(td => td.textContent.trim() !== "");
}

// Atualizar "Selecionar Todos" com base na seleção manual
function atualizarSelecionarTodos(selecionarTodosCheckbox, checkboxesItens) {
    if (!selecionarTodosCheckbox) return; // Checagem de segurança
    const linhasPreenchidasComCheckbox = Array.from(checkboxesItens).filter(cb => {
        const linha = cb.closest("tr");
        return linha && linhaHasData(linha) && !cb.disabled; // Considera apenas checkboxes habilitados
    });
    const checkboxesMarcadosEmLinhasPreenchidas = linhasPreenchidasComCheckbox.filter(cb => cb.checked);
    
    if (linhasPreenchidasComCheckbox.length > 0) {
        selecionarTodosCheckbox.checked = checkboxesMarcadosEmLinhasPreenchidas.length === linhasPreenchidasComCheckbox.length;
    } else {
        selecionarTodosCheckbox.checked = false; // Nenhuma linha preenchida para selecionar
    }
}


// Adicionar a função de filtragem no JavaScript
document.addEventListener("DOMContentLoaded", function () {
    const inputFiltro = document.getElementById("buscar_pedidos");
    const selectColuna = document.getElementById("coluna-filtro");
    // Generalizar para qualquer tabela que use este filtro, se necessário.
    // Por enquanto, assume que #tabela-pedidos ou #tabela-estoqueProdutos existe.
    const tabelaAlvo = document.getElementById("tabela-pedidos") || document.getElementById("tabela-estoqueProdutos")?.querySelector("tbody");


    // Mapeamento dos índices para diferentes tabelas/contextos
    // Este mapeamento pode precisar ser ajustado ou tornado mais dinâmico
    // se usado em várias tabelas com estruturas diferentes.
    const indiceColunasProduto = { // Para frontProdutos.js
        "tag": 2, // TAG na 3ª coluna (índice 2)
        "nome": 3, // Nome produto na 4ª coluna (índice 3)
        // "UF": indefinido para produtos
        // "cidade": indefinido para produtos
    };
    const indiceColunasPedido = { // Para uma hipotética tabela de pedidos
        "nome": 2, 
        "cpf_cnpj": 3,
        "UF": 7, 
        "cidade": 8 
    };

    if (inputFiltro && selectColuna && tabelaAlvo) {
        inputFiltro.addEventListener("input", function () {
            const termo = inputFiltro.value.toLowerCase().trim();
            const colunaSelecionada = selectColuna.value;
            
            // Determinar qual mapeamento de índice usar (exemplo simples)
            // Você pode precisar de uma lógica melhor se o filtro for genérico
            let indiceColunasUsado = {};
            if (document.title.includes("Cadastro de Produto") || document.title.includes("Estoque")) { // Exemplo de condição
                indiceColunasUsado = indiceColunasProduto;
            } else if (document.title.includes("Pedidos")) {
                indiceColunasUsado = indiceColunasPedido;
            } else { // Fallback ou lógica padrão
                 // Se for a tabela de produtos de frontProdutos.js
                if (tabelaAlvo.id === "tabela-estoqueProdutos" || tabelaAlvo.parentElement.id === "tabela-estoqueProdutos" ) {
                    indiceColunasUsado = indiceColunasProduto;
                } else {
                    indiceColunasUsado = indiceColunasPedido; // Ou um default
                }
            }

            const colunaIndex = indiceColunasUsado[colunaSelecionada];
            const linhas = tabelaAlvo.querySelectorAll("tr");

            linhas.forEach(linha => {
                const celulas = linha.querySelectorAll("td");
                const checkbox = linha.querySelector(".checkbox");
                
                if (colunaIndex !== undefined && celulas.length > colunaIndex && celulas[colunaIndex]) {
                    const textoCelula = celulas[colunaIndex].textContent.toLowerCase();
                    if (textoCelula.includes(termo)) {
                        linha.style.display = "";
                        if (checkbox) checkbox.disabled = false;
                    } else {
                        linha.style.display = "none";
                        if (checkbox) checkbox.disabled = true; 
                    }
                } else if (colunaIndex === undefined && termo === "") { // Mostrar tudo se filtro limpo e coluna não específica
                    linha.style.display = "";
                    if (checkbox) checkbox.disabled = false;
                } else if (colunaIndex === undefined && termo !== "") { // Esconder se filtro tem termo mas coluna não é específica
                     // Este comportamento pode precisar de ajuste: se filtrar por "todos os campos"
                }
            });
        });
    }
});


// Código para adicionar dinamicamente produtos a um formulário (ex: formulário de Pedido)
// Não parece ser para a tela de CADASTRO DE PRODUTO individual.
document.addEventListener("DOMContentLoaded", function () {
    const addProdutoBtn = document.querySelector(".add_produto");
    if (addProdutoBtn) {
        addProdutoBtn.addEventListener("click", function () {
            adicionarProdutoParaPedido(); // Renomeado para clareza
        });
    }
});

function adicionarProdutoParaPedido() { // Renomeado para clareza
    let produtosContainer = document.getElementById("produtos-container"); // Este ID deve existir no HTML do formulário de pedido
    if (!produtosContainer) {
        console.warn("#produtos-container não encontrado para adicionar produto ao pedido.");
        return;
    }

    let novoProduto = document.createElement("div");
    novoProduto.classList.add("info-produtos"); // Reutiliza a classe, mas pode precisar de CSS específico
    novoProduto.innerHTML = `
        <div class="campo-cad">
            <label>Produto</label>
            <select name="nome_produto_pedido[]" required> <option value="">Selecione...</option>
                <option value="telha">Telha</option>
                <option value="tijolo">Tijolo</option>
                <option value="ferragem">Ferragem</option>
                </select>
        </div>
        <div class="campo-cad">
            <label>Quantidade</label>
            <input type="number" name="quantidade_produto_pedido[]" placeholder="Ex.: 10" required> </div>
        <div class="campo-cad">
            <label>Desconto (R$)</label>
            <input type="number" step="0.01" name="desconto_pedido[]" placeholder="Ex.: 5.00"> </div>
        <div class="campo-cad">
            <label>Subtotal (R$)</label>
            <input type="number" step="0.01" name="subtotal_pedido[]" placeholder="Ex.: 10.00" readonly> </div>
        <div class="container_novo_produto">
            <button class="remove_produto_pedido" type="button"> <img src="assets/excluir.png" alt="Remover produto">
            </button>
        </div>
    `;
    produtosContainer.appendChild(novoProduto);
    novoProduto.querySelector(".remove_produto_pedido").addEventListener("click", function () {
        produtosContainer.removeChild(novoProduto);
    });
}

// Funções de edição/exclusão de linha e toggle de senha para tabelas (ex: tabela de usuários)
// Não diretamente relacionadas ao cadastro de produto.
function editarLinha(botao) {
    let linha = botao.closest('tr');
    if (!linha) return;
    let editando = linha.dataset.editando === "true";
    if (!editando) {
        linha.querySelectorAll('td[data-original]').forEach(td => { // Assume que o conteúdo original está em data-original
            td.contentEditable = "true";
            td.focus(); // Foca no primeiro campo editável
        });
        botao.innerHTML = '<i class="fa fa-save"></i> Salvar';
        linha.dataset.editando = "true";
    } else {
        linha.querySelectorAll('td[contenteditable="true"]').forEach(td => {
            td.contentEditable = "false";
            // Aqui você coletaria os dados e enviaria para a API
            console.log(`Dado salvo da célula ${td.cellIndex}: ${td.textContent}`);
        });
        botao.innerHTML = '<i class="fa fa-edit"></i> Editar';
        linha.dataset.editando = "false";
        // Adicione aqui a lógica para salvar as alterações no banco de dados
        alert("Alterações salvas (simulação). Implemente o envio para API.");
    }
}

function excluirLinha(botao) {
    let linha = botao.closest('tr');
    if (!linha) return;
    if (confirm("Tem certeza que deseja excluir esta linha/usuário?")) {
        linha.remove();
        // Adicione aqui a lógica para remover o usuário do banco de dados via API
        alert("Linha excluída (simulação). Implemente a chamada à API.");
    }
}

function toggleSenha(botao) {
    let linha = botao.closest('tr');
    if (!linha) return;
    let senhaTd = linha.querySelector('.senha-cell'); // Use uma classe específica para a célula da senha
    if (!senhaTd) return;

    const senhaVisivel = senhaTd.dataset.senhaVisivel === "true";
    if (senhaVisivel) {
        senhaTd.textContent = "****"; // Ou o que quer que seja o placeholder
        botao.innerHTML = '<i class="fa fa-eye"></i>';
        // botao.setAttribute("data-tooltip", "Mostrar senha"); // Se usar tooltips
        senhaTd.dataset.senhaVisivel = "false";
    } else {
        // Supondo que a senha real está armazenada em um data attribute na célula ou obtida de outra forma
        senhaTd.textContent = senhaTd.dataset.senhaReal || "senha123"; // Exemplo: pegue de data-senha-real
        botao.innerHTML = '<i class="fa fa-eye-slash"></i>';
        // botao.setAttribute("data-tooltip", "Ocultar senha");
        senhaTd.dataset.senhaVisivel = "true";
    }
}

// ----- FIM DO CÓDIGO PROVAVELMENTE PARA OUTRAS PÁGINAS -----


// O código de recuperação de senha e logout_btn parece ser para uma tela de login.
// Se esta tela (cad_produto.html) não tiver esses elementos, estes listeners não farão nada.
document.addEventListener("DOMContentLoaded", function() {
    const linkRecuperacao = document.querySelector(".esqueceu-senha a");
    const formRecuperacao = document.getElementById("form-recuperacao");
    const formLogin = document.getElementById("loginForm"); // Assumindo que este é o ID do formulário de login
    const btnCancelarRecuperacao = document.querySelector("#form-recuperacao button[type='button']"); // Botão Cancelar no form de recuperação
    
    if (linkRecuperacao && formLogin && formRecuperacao) {
        linkRecuperacao.addEventListener("click", function(event) {
            event.preventDefault();
            formLogin.style.display = "none";
            formRecuperacao.style.display = "block";
        });
    }
    
    if (btnCancelarRecuperacao && formLogin && formRecuperacao) {
        btnCancelarRecuperacao.addEventListener("click", function() {
            formRecuperacao.style.display = "none";
            formLogin.style.display = "block";
        });
    }

    const logoutButton = document.getElementById("logout_btn"); // Botão de logout geral
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            if (confirm("Tem certeza que deseja sair?")) {
                localStorage.removeItem('jwtToken'); // Limpa token
                window.location.href = "index.html"; // Redireciona para a tela de login
            }
        });
    }
});
import { API_URL } from './api.js';

function getTokenPopUp() { // Renomeado para evitar conflito se getToken existir globalmente
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        alert("Sessão expirada ou token não encontrado. Faça login novamente.");
    }
    return token;
}

// Função auxiliar para normalizar e converter valores monetários
function parseCurrencyValue(valueString) {
    if (typeof valueString !== 'string') {
        valueString = String(valueString);
    }
    // Remove "R$", espaços, substitui milhar por nada, e vírgula decimal por ponto
    const normalized = valueString.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
    const value = parseFloat(normalized);
    return isNaN(value) ? 0 : value; // Retorna 0 se não for um número válido
}


/* Lógica para o popUp da tela de cadastro de produtos */
document.addEventListener("DOMContentLoaded", function () {
    const popUpProduto = document.getElementById("popUpProduto");
    const btnAbrirPopUpProduto = document.getElementById("abrirPopUp"); // Botão principal "Salvar" do formulário
    const btnFecharPopUpProduto = document.getElementById("close_popUp"); // Botão "Cancelar" DENTRO do popUpProduto
    const btnConfirmarCadastro = document.getElementById("cad_produtos"); // Botão "Confirmar Cadastro" DENTRO do popUpProduto
    const formCadastroProduto = document.getElementById("formCadastroProduto");

    // Função para abrir o pop-up de confirmação de cadastro de produto
    function abrirPopUpConfirmacaoProduto(event) {
        if(event) event.preventDefault(); // Evita o envio do formulário antes da confirmação
        
        // Validação básica antes de abrir o popup (opcional, mas bom UX)
        let camposValidos = true;
        if (formCadastroProduto) {
            const inputsObrigatorios = formCadastroProduto.querySelectorAll('input[required], select[required], textarea[required]');
            for (let input of inputsObrigatorios) {
                if (!input.value.trim()) {
                    camposValidos = false;
                    input.reportValidity ? input.reportValidity() : alert(`Campo "${input.labels?.[0]?.textContent || input.name}" é obrigatório.`);
                    break; 
                }
            }
        }
        if (!camposValidos) {
            alert("Por favor, preencha todos os campos obrigatórios antes de salvar.");
            return;
        }

        if (popUpProduto) {
            popUpProduto.style.display = "flex";
        } else {
            console.error("Elemento do PopUp de Produto (popUpProduto) não encontrado.");
        }
    }

    // Função para fechar o pop-up
    function fecharPopUpConfirmacaoProduto() {
        if (popUpProduto) {
            popUpProduto.style.display = "none";
        }
    }

    if (btnAbrirPopUpProduto) {
        btnAbrirPopUpProduto.addEventListener("click", abrirPopUpConfirmacaoProduto);
    } else {
        console.error("Botão para abrir o pop-up de produto (abrirPopUp) não encontrado.");
    }

    if (btnFecharPopUpProduto) {
        btnFecharPopUpProduto.addEventListener("click", fecharPopUpConfirmacaoProduto);
    }

    // Evento para confirmar o cadastro e enviar os dados para a API
    if (btnConfirmarCadastro && formCadastroProduto) {
        btnConfirmarCadastro.addEventListener("click", async function () {
            fecharPopUpConfirmacaoProduto(); // Fecha o pop-up

            const token = getTokenPopUp();
            if (!token) return; // Se não houver token, getTokenPopUp já deve ter alertado.

            // Coleta de dados do formulário (usando os IDs definidos no HTML)
            const nome_produto = document.getElementById("nome_produto")?.value.trim();
            const tag_produto = document.getElementById("tag_produto")?.value.trim();
            const desc_produto = document.getElementById("desc_produto")?.value.trim();
            const medicao_produto = document.getElementById("medicao")?.value;
            const quantidade_str = document.getElementById("quantidade")?.value.trim();
            const valor_unitario_str = document.getElementById("valor_unitario")?.value.trim(); // Vem como string
            const preco_custo_str = document.getElementById("preco_custo")?.value.trim(); // Vem como string

            // Validação mais robusta (exemplo)
            if (!nome_produto || !tag_produto || !medicao_produto || !quantidade_str || !valor_unitario_str || !preco_custo_str) {
                alert("Todos os campos são obrigatórios para o cadastro do produto.");
                return;
            }

            const quantidade = parseInt(quantidade_str, 10);
            // Para type="number", o .value já é uma string numérica, parseFloat é suficiente.
            const valor_unitario = parseFloat(valor_unitario_str);
            const preco_custo = parseFloat(preco_custo_str);


            if (isNaN(quantidade) || quantidade < 0) {
                alert("Quantidade inválida."); return;
            }
            if (isNaN(valor_unitario) || valor_unitario < 0) {
                alert("Valor unitário inválido."); return;
            }
            if (isNaN(preco_custo) || preco_custo < 0) {
                alert("Preço de custo inválido."); return;
            }

            const dadosProduto = {
                nome: nome_produto,
                tag: tag_produto,
                descricao: desc_produto,
                medida: medicao_produto,   // Nome do campo na API
                quantidade: quantidade,
                precoVenda: valor_unitario, // Nome do campo na API
                precoCusto: preco_custo    // Nome do campo na API
            };

            //console.log("Enviando dados do produto:", JSON.stringify(dadosProduto, null, 2));

            try {
                const response = await fetch(`${API_URL}/api/itens`, { // Endpoint de criação de itens
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-access-token": token
                    },
                    body: JSON.stringify(dadosProduto)
                });

                const data = await response.json();
                console.log("Resposta do servidor:", data);

                if (response.ok && (data?.success || data?.sucesso)) { // Verifica 'success' (inglês) ou 'sucesso' (português)
                    alert(data.message || data.mensagem || "Produto cadastrado com sucesso!");
                    formCadastroProduto.reset(); // Limpa o formulário
                    // Opcional: Redirecionar ou atualizar algo na página
                    // window.location.href = 'alguma-pagina-de-produtos.html';
                } else {
                    alert(`Erro ao cadastrar produto: ${data.message || data.mensagem || response.statusText || 'Erro desconhecido.'}`);
                }
            } catch (error) {
                console.error("Erro na requisição de cadastro de produto:", error.message, error.stack, error);
                alert("Falha na conexão com o servidor ao tentar cadastrar o produto. Verifique o console.");
            }
        });
    } else {
         if (!btnConfirmarCadastro) console.error("Botão de confirmar cadastro (cad_produtos) não encontrado.");
         if (!formCadastroProduto) console.error("Formulário de cadastro (formCadastroProduto) não encontrado.");
    }
});


// As funções abaixo são para um popup de Clientes (popUpClientes).
// Se não forem usadas na página cad_produto.html, podem ser removidas deste arquivo
// ou mantidas se este popUp.js for um script genérico para vários popups.

function abrirPopUpClientes() {
    const popUpClientes = document.getElementById("popUpClientes");
    if (popUpClientes) popUpClientes.style.display = "block";
}

function fecharPopUpClientes() {
    const popUpClientes = document.getElementById("popUpClientes");
    if (popUpClientes) popUpClientes.style.display = "none";
}

// Fechar popUpClientes ao clicar fora
// Cuidado: Este window.onclick pode conflitar com o de script.js se ambos tentarem fechar popups diferentes
// ou o mesmo popup. É melhor ter listeners mais específicos.
/*
window.addEventListener('click', function(event) { // Alterado para addEventListener para evitar sobrescrever
    let modalClientes = document.getElementById("popUpClientes");
    if (modalClientes && event.target === modalClientes) {
        modalClientes.style.display = "none";
    }
});
*/
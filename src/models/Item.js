class Item {
    constructor(codigoItem, nome, quantidade, precoCusto, precoVenda, descricao) {
        this.codigoItem = codigoItem; 
        this.nome = nome; 
        this.quantidade = quantidade; 
        this.precoCusto = precoCusto; 
        this.precoVenda = precoVenda;
        this.descricao = descricao;
    }

    atualizarQuantidade(novaQuantidade) {
        if (novaQuantidade >= 0) {
            this.quantidade = novaQuantidade;
            console.log(`Quantidade do item "${this.nome}" atualizada para ${this.quantidade}.`);
        } else {
            console.log('Erro: A quantidade não pode ser negativa.');
        }
    }


    calcularValorTotal() {
        const valorTotal = this.quantidade * this.precoCusto;
        console.log(`Valor total do item "${this.nome}" em estoque: R$ ${valorTotal.toFixed(2)}`);
        return valorTotal;
    }
}

module.exports = Item;
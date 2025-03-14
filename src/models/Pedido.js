class Pedido {
    constructor(cliente, dataPedido, status, listaItens) {
        this.cliente = cliente; 
        this.dataPedido = dataPedido; 
        this.status = status; 
        this.listaItens = listaItens; 
    }

    registrarPedido() {
        console.log(`Pedido registrado para o cliente "${this.cliente}".`);
        console.log(`Data do pedido: ${this.dataPedido}`);
        console.log(`Status: ${this.status}`);
        console.log('Itens do pedido:');
        this.listaItens.forEach(item => {
            console.log(`- ${item.nome}: ${item.quantidade} unidade(s)`);
        });
    }

    atualizarStatus(novoStatus) {
        this.status = novoStatus;
        console.log(`Status do pedido atualizado para "${this.status}".`);
    }

    consultarPedido() {
        console.log('--- Detalhes do Pedido ---');
        console.log(`Cliente: ${this.cliente}`);
        console.log(`Data do pedido: ${this.dataPedido}`);
        console.log(`Status: ${this.status}`);
        console.log('Itens do pedido:');
        this.listaItens.forEach(item => {
            console.log(`- ${item.nome}: ${item.quantidade} unidade(s)`);
        });
    }

    atualizarPedido(novoCliente, novaDataPedido, novaListaItens) {
        this.cliente = novoCliente;
        this.dataPedido = novaDataPedido;
        this.listaItens = novaListaItens;
        console.log('Pedido atualizado com sucesso.');
    }
}

module.exports = Pedido;
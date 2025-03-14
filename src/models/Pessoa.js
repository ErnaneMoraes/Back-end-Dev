class Pessoa {
    constructor(id, nome, contato, email, endereco, documento) {
        this.id = id;
        this.nome = nome;
        this.contato = contato;
        this.email = email; 
        this.endereco = endereco; 
        this.documento = documento; 
    }

    static Pessoa() {
        return new Pessoa(null, '', '', '', null, '');
    }

    atualizarInformacoes(novoNome, novoContato, novoEmail, novoEndereco, novoDocumento) {
        this.nome = novoNome;
        this.contato = novoContato;
        this.email = novoEmail;
        this.endereco = novoEndereco;
        this.documento = novoDocumento;
        console.log(`Informações da pessoa "${this.nome}" atualizadas.`);
    }

    excluir() {
        console.log(`Pessoa "${this.nome}" excluída.`);

    }

    cadastrarPessoa() {
        console.log(`Pessoa "${this.nome}" cadastrada com sucesso.`);
    }

    validarDocumento() {
        if (this.documento && this.documento.length === 11) { 
            console.log(`Documento "${this.documento}" válido.`);
            return true;
        } else {
            console.log(`Documento "${this.documento}" inválido.`);
            return false;
        }
    }
}

module.exports = Pessoa;
const { pool } = require('../../database');
const { hashPassword } = require('./encrypt'); // Corrigido aqui

class Usuario {
    constructor(idUsuario, nome, login, senha, nivelAcesso) {
        this.idUsuario = idUsuario;
        this.nome = nome;
        this.login = login;
        this.senha = senha;
        this.nivelAcesso = nivelAcesso;
    }

    static validarLoginExistente(login, listaUsuarios) {
        const loginExistente = listaUsuarios.some(usuario => usuario.login === login);
        if (loginExistente) {
            this.exibirAlerta(`O login "${login}" já está em uso. Por favor, escolha outro login.`);
        }
        return loginExistente;
    }

    static exibirAlerta(mensagem) {
        console.warn('ALERTA:', mensagem);
    }

    async criarUsuario(nome, login, senha, nivelAcesso) {
        try {
            // Verifica se o login já existe no banco de dados
            const [rows] = await pool.execute('SELECT * FROM tb_usuario WHERE LOGIN = ?', [login]);
            if (rows.length > 0) {
                console.log('ALERTA: O login já está em uso.');
                return;
            }

            // Gera o hash da senha usando a função hashPassword do encrypt.js
            const { salt, hash } = hashPassword(senha);

            // Insere o novo usuário no banco de dados com a senha criptografada
            const query = 'INSERT INTO tb_usuario (NOME, LOGIN, SENHA, SALT, NIVEL_ACESSO) VALUES (?, ?, ?, ?, ?)';
            const [results] = await pool.execute(query, [nome, login, hash, salt, nivelAcesso]);
            console.log('Usuário registrado com sucesso! ID:', results.insertId);
        } catch (err) {
            console.error('Erro ao criar usuário:', err);
        }
    }

    autenticarUsuario(login, senha) {
        if (this.login === login && this.senha === senha) {
            console.log('Usuário autenticado com sucesso!');
            return true;
        } else {
            console.log('Login ou senha incorretos.');
            return false;
        }
    }

    definirPermissoes() {
        switch (this.nivelAcesso) {
            case '1':
                console.log('Permissões de administrador: Acesso total ao sistema.');
                break;
            case '2':
                console.log('Permissões de editor: Pode editar conteúdo, mas não pode administrar usuários.');
                break;
            case '3':
                console.log('Permissões de visitante: Apenas leitura.');
                break;
            default:
                console.log('Nível de acesso desconhecido. Permissões não definidas.');
        }
    }
}

module.exports = Usuario;

const express = require('express');
const router = express.Router();
const Pedido = require('./src/models/Pedido'); // Certifique-se que o caminho está correto
const { pool } = require('./database');

const validarPedido = (req, res, next) => {
    const { idPessoa, listaItens, formaPgto, parcelas } = req.body;

    if (!idPessoa || !listaItens || !formaPgto || !parcelas) {
        return res.status(400).json({
            success: false,
            message: 'Dados incompletos. Forneça idPessoa, listaItens, formaPgto e parcelas'
        });
    }

    if (listaItens.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'O pedido deve conter pelo menos um item'
        });
    }

    next();
};

// Rota GET /api/pedidos MODIFICADA para incluir detalhes do cliente e produto
router.get('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const query = `
            SELECT
                ped.ID_PEDIDO_PK,
                ped.QUANTIDADE,
                ped.SUBTOTAL,
                ped.FORMA_PGTO,
                ped.PARCELAS,
                ped.VENCIMENTO,
                ped.TOTAL,
                ped.ID_PESSOA_FK,  -- Mantendo para referência, se necessário
                ped.ID_PRODUTO_FK, -- Mantendo para referência, se necessário
                -- Dados do Cliente (da tabela tb_pessoa)
                pessoa.NOME AS NOME_CLIENTE,
                pessoa.CPF_CNPJ AS CPF_CNPJ_CLIENTE,
                pessoa.CELULAR AS CELULAR_CLIENTE,
                pessoa.RUA AS RUA_CLIENTE,
                pessoa.NUMERO AS NUMERO_CLIENTE,
                pessoa.UF AS UF_CLIENTE,
                pessoa.CIDADE AS CIDADE_CLIENTE,
                -- Dados do Produto (da tabela tb_produto)
                produto.nome AS NOME_PRODUTO 
                -- Se você tiver um campo de DESCONTO na tb_pedido, adicione-o aqui:
                -- ped.DESCONTO (ou nome similar)
            FROM
                tb_pedido ped
            LEFT JOIN
                tb_pessoa pessoa ON ped.ID_PESSOA_FK = pessoa.ID_PESSOA_PK
            LEFT JOIN
                tb_produto produto ON ped.ID_PRODUTO_FK = produto.ID_PRODUTO_PK
            ORDER BY
                ped.ID_PEDIDO_PK DESC; -- Opcional: ordena pelos pedidos mais recentes
        `;
        
        const [rows] = await connection.execute(query);

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Erro ao listar pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar pedidos'
        });
    } finally {
        connection.release();
    }
});
//------------------final da modificação da rota GET / ------------------

router.post('/', validarPedido, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { idPessoa, listaItens, formaPgto, parcelas, status = 'Aberto' } = req.body;

        const pedido = new Pedido(
            connection,
            idPessoa,
            new Date(),
            status,
            listaItens,
            formaPgto,
            parcelas
        );

        const idPedido = await pedido.registrarPedido();

        res.status(201).json({
            success: true,
            message: 'Pedido criado com sucesso',
            idPedido
        });
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao criar pedido'
        });
    } finally {
        connection.release();
    }
});

router.get('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        // TODO: Considerar se esta rota também precisa de JOINs para detalhes ou se o modelo Pedido.consultarPedido(id) já faz isso.
        // Por agora, esta rota não foi alterada.
        const pedido = new Pedido(connection);
        const dadosPedido = await pedido.consultarPedido(id);

        res.status(200).json({
            success: true,
            data: dadosPedido
        });
    } catch (error) {
        console.error('Erro ao consultar pedido:', error);

        if (error.message === 'Pedido não encontrado') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro ao consultar pedido'
        });
    } finally {
        connection.release();
    }
});

router.put('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const novosDados = req.body;

        const pedido = new Pedido(connection);
        await pedido.atualizarPedido(id, novosDados);

        res.status(200).json({
            success: true,
            message: 'Pedido atualizado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);

        if (error.message === 'Pedido não encontrado') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar pedido'
        });
    } finally {
        connection.release();
    }
});

router.patch('/:id/status', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'O novo status deve ser fornecido'
            });
        }

        const pedido = new Pedido(connection);
        await pedido.atualizarStatus(id, status);

        res.status(200).json({
            success: true,
            message: 'Status do pedido atualizado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar status do pedido:', error);

        if (error.message === 'Pedido não encontrado') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status do pedido'
        });
    } finally {
        connection.release();
    }
});

router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const pedido = new Pedido(connection);
        await pedido.deletarPedido(id);

        res.status(200).json({
            success: true,
            message: 'Pedido deletado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao deletar pedido:', error);

        if (error.message === 'Pedido não encontrado') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro ao deletar pedido'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
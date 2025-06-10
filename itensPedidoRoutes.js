const express = require('express');
const router = express.Router();
const ItensPedido = require('./src/models/ItensPedido');
const { pool } = require('./database');

// Middleware de validação para ItensPedido
const validarItemPedido = (req, res, next) => {
    const { ID_PEDIDO_FK, ID_PRODUTO_FK, QUANTIDADE } = req.body;
    
    if (!ID_PEDIDO_FK || !ID_PRODUTO_FK || QUANTIDADE === undefined) {
        return res.status(400).json({
            success: false,
            message: 'ID do pedido, ID do produto e quantidade são obrigatórios'
        });
    }
    
    if (parseInt(QUANTIDADE) <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Quantidade deve ser maior que zero'
        });
    }
    
    next();
};

// Rota para criar item de pedido
router.post('/', validarItemPedido, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { ID_PEDIDO_FK, ID_PRODUTO_FK, QUANTIDADE } = req.body;
        
        const itemPedido = new ItensPedido(
            null, // id será gerado pelo banco
            ID_PEDIDO_FK,
            ID_PRODUTO_FK,
            parseInt(QUANTIDADE)
        );

        const idItemPedido = await itemPedido.salvar();
        
        res.status(201).json({
            success: true,
            message: 'Item do pedido criado com sucesso',
            id: idItemPedido
        });
    } catch (error) {
        console.error('Erro ao criar item do pedido:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao criar item do pedido'
        });
    } finally {
        connection.release();
    }
});

// Rota para buscar item de pedido por ID
router.get('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const itemPedido = await ItensPedido.buscarPorId(req.params.id);
        
        if (!itemPedido) {
            return res.status(404).json({
                success: false,
                message: 'Item do pedido não encontrado'
            });
        }
        
        res.status(200).json({
            success: true,
            data: itemPedido
        });
    } catch (error) {
        console.error('Erro ao buscar item do pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar item do pedido'
        });
    } finally {
        connection.release();
    }
});

// Rota para listar todos os itens de um pedido específico
router.get('/pedido/:idPedido', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const itensPedido = await ItensPedido.listarPorPedido(req.params.idPedido);
        
        res.status(200).json({
            success: true,
            data: itensPedido
        });
    } catch (error) {
        console.error('Erro ao listar itens do pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar itens do pedido'
        });
    } finally {
        connection.release();
    }
});

// Rota para atualizar item de pedido
router.put('/:id', validarItemPedido, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Primeiro busca o item existente
        const itemExistente = await ItensPedido.buscarPorId(req.params.id);
        
        if (!itemExistente) {
            return res.status(404).json({
                success: false,
                message: 'Item do pedido não encontrado'
            });
        }

        // Atualiza os campos
        const { ID_PEDIDO_FK, ID_PRODUTO_FK, QUANTIDADE } = req.body;
        
        itemExistente.ID_PEDIDO_FK = ID_PEDIDO_FK || itemExistente.ID_PEDIDO_FK;
        itemExistente.ID_PRODUTO_FK = ID_PRODUTO_FK || itemExistente.ID_PRODUTO_FK;
        itemExistente.QUANTIDADE = QUANTIDADE !== undefined ? parseInt(QUANTIDADE) : itemExistente.QUANTIDADE;

        const sucesso = await itemExistente.atualizar();
        
        if (!sucesso) {
            throw new Error('Falha ao atualizar item do pedido');
        }
        
        res.status(200).json({
            success: true,
            message: 'Item do pedido atualizado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar item do pedido:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao atualizar item do pedido'
        });
    } finally {
        connection.release();
    }
});

// Rota para deletar item de pedido
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Primeiro busca o item existente
        const itemExistente = await ItensPedido.buscarPorId(req.params.id);
        
        if (!itemExistente) {
            return res.status(404).json({
                success: false,
                message: 'Item do pedido não encontrado'
            });
        }

        const sucesso = await itemExistente.deletar();
        
        if (!sucesso) {
            throw new Error('Falha ao deletar item do pedido');
        }
        
        res.status(200).json({
            success: true,
            message: 'Item do pedido deletado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao deletar item do pedido:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao deletar item do pedido'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
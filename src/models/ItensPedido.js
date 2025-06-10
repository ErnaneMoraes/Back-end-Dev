const { pool } = require('../../database');

class ItensPedido {
    constructor(
        id = null,
        ID_PEDIDO_FK,
        ID_PRODUTO_FK,
        QUANTIDADE = 1
    ) {
        this.id = Number(id) || null;
        this.ID_PEDIDO_FK = Number(ID_PEDIDO_FK);
        this.ID_PRODUTO_FK = Number(ID_PRODUTO_FK);
        this.QUANTIDADE = Number(QUANTIDADE) || 1;
    }

    async salvar(connection = null) {
        const conn = connection || await pool.getConnection();

        try {
            const query = `
                INSERT INTO tb_itens_pedidos (
                    ID_PEDIDO_FK, ID_PRODUTO_FK, QUANTIDADE
                ) VALUES (?, ?, ?)`;

            const [result] = await conn.execute(query, [
                this.ID_PEDIDO_FK,
                this.ID_PRODUTO_FK,
                this.QUANTIDADE
            ]);

            this.id = result.insertId;
            return this.id;
        } catch (error) {
            console.error('Erro ao salvar item do pedido:', error);
            throw error;
        } finally {
            if (!connection) {
                conn.release();
            }
        }
    }

    static async buscarPorId(id) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM tb_itens_pedidos WHERE id = ?',
                [id]
            );

            if (rows.length === 0) return null;

            const itemData = rows[0];
            return new ItensPedido(
                itemData.id,
                itemData.ID_PEDIDO_FK,
                itemData.ID_PRODUTO_FK,
                itemData.QUANTIDADE
            );
        } catch (error) {
            console.error('Erro ao buscar item do pedido:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async listarPorPedido(ID_PEDIDO_FK) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM tb_itens_pedidos WHERE ID_PEDIDO_FK = ?',
                [ID_PEDIDO_FK]
            );

            return rows.map(row => new ItensPedido(
                row.id,
                row.ID_PEDIDO_FK,
                row.ID_PRODUTO_FK,
                row.QUANTIDADE
            ));
        } catch (error) {
            console.error('Erro ao listar itens do pedido:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    async atualizar() {
        if (!this.id) {
            throw new Error('ID do item do pedido não definido');
        }

        const connection = await pool.getConnection();
        try {
            const query = `
                UPDATE tb_itens_pedidos SET
                    ID_PEDIDO_FK = ?,
                    ID_PRODUTO_FK = ?,
                    QUANTIDADE = ?
                WHERE id = ?`;

            const [result] = await connection.execute(query, [
                this.ID_PEDIDO_FK,
                this.ID_PRODUTO_FK,
                this.QUANTIDADE,
                this.id
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao atualizar item do pedido:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    async deletar() {
        if (!this.id) {
            throw new Error('ID do item do pedido não definido');
        }

        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                'DELETE FROM tb_itens_pedidos WHERE id = ?',
                [this.id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao deletar item do pedido:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = ItensPedido;
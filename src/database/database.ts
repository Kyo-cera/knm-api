import { ConnectionPool } from 'mssql';

const dbConfig = {
    server: 'localhost',
    user: 'apps',
    password: 'Kyo2024!',
    database: 'LKDISPATCH',
    options: {
        encrypt: false // Impostare su true se si utilizza una connessione crittografata
    }
};

const pool = new ConnectionPool(dbConfig);

class Database {
    async closePool() {
        try {
            await pool.close();
            console.log('Pool di connessioni chiusa correttamente');
        } catch (error) {
            console.error('Errore durante la chiusura della pool di connessioni:', error);
            throw error;
        }
    }

    async query(sql: string) {
        let connection;
        try {
            connection = await pool.connect();
            const result = await connection.request().query(sql);
            return result.recordset;
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            if (connection) {
            //    connection.close();
            }
        }
    }
}

export default new Database();


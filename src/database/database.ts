// import { ConnectionPool } from 'mssql';

// const dbConfig = {
//     server: 'localhost',
//     user: 'apps',
//     password: 'Kyo2024!',
//     database: 'LKDISPATCH',
//     options: {
//         encrypt: false // Impostare su true se si utilizza una connessione crittografata
//     }
// };

// const pool = new ConnectionPool(dbConfig);

// class Database {
//     async closePool() {
//         try {
//             await pool.close();
//             console.log('Pool di connessioni chiusa correttamente');
//         } catch (error) {
//             console.error('Errore durante la chiusura della pool di connessioni:', error);
//             throw error;
//         }
//     }

//     async query(sql: string) {
//         let connection;
//         try {
//             connection = await pool.connect();
//             const result = await connection.request().query(sql);
//             return result.recordset;
//         } catch (err) {
//             console.error(err);
//             throw err;
//         } finally {
//             if (connection) {
//             //    connection.close();
//             }
//         }
//     }
// }

// export default new Database();

import { Pool } from 'pg';
import { writeToLog } from '../utils/writeLog';

const dbConfig = {
    host: 'localhost',       
    user: 'apps',            
    password: 'Kyo2024!',    
    database: 'LKDISPATCH',
//    database: 'postgres',    
    port: 5432,              
};

const pool = new Pool(dbConfig);

class Database {
    async closePool() {
        try {
            await pool.end(); 
            writeToLog('Pool di connessioni chiusa correttamente', pool);
        } catch (error) {
            console.error('Errore durante la chiusura della pool di connessioni:', error);
            throw error;
        }
    }

    async query(sql: string, params: any[] = []) {
        try {
            const result = await pool.query(sql, params);
            return result.rows;
        } catch (err) {
            console.error('Errore durante l\'esecuzione della query:', err);
            throw err;
        }
    }

    async testConnection() {
        try {
            writeToLog('Tentativo di connessione al database...', pool);
            
            // Esegue una query semplice per testare la connessione
            const result = await this.query('SELECT NOW() AS current_time');
            
            if (result && result.length > 0) {
                writeToLog('Connessione al database riuscita!', pool);
                writeToLog('Ora del server:', result[0].current_time);
            } else {
                writeToLog('Connessione riuscita, ma non ci sono risultati.', pool);
            }
        } catch (error) {
            console.error('Errore nella connessione al database:', error);
        } finally {
            await this.closePool();
        }
    }
}

const db = new Database();

// Esegui il test della connessione quando il file viene eseguito
if (require.main === module) {
    db.testConnection();
}

export default db;

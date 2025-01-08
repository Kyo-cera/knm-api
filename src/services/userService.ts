import { User } from 'models/user';
import db from '../database/database';
class userService {

    async getAllUsers(): Promise<User[]> {
        const users = await db.query(`SELECT * FROM dbo.users`);
        return users as User[];
    }

    async getUserById(ID:number): Promise<User[] | null | any> {
        const user = await db.query(`SELECT * FROM dbo.users WHERE "id" = '${ID}' RETURNING *;`);
        if (Array.isArray(user) && user.length > 0) {
            return user[0] as User;
        }
        console.log('user not found '+user);
        return user;
    }

    async postUser(data: User): Promise<User[] | null> {
        try {
            const query = `
                INSERT INTO dbo.users (
                    "name", "firstname", "lastname", "email", "role", "permissions", 
                    "type", "active", "password", "locale", "created_at"
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
                RETURNING *;
            `;
    
            const values = [
                data.name,
                data.firstname,
                data.lastname,
                data.email,
                data.role,
                data.permissions,
                data.type,
                data.active,
                data.password,
                data.locale
            ];
    
            const result = await db.query(query, values);
    
            return result || null;
        } catch (error) {
            console.error('Errore durante l\'inserimento dell\'utente:', error);
            throw error;
        }
    }
    

    async deleteUser(id: Number): Promise<User[] | null> {
        try {
            const query = `
                DELETE FROM dbo.users
	            WHERE "id" = '${id}'
                RETURNING *;
            `;
    
            const result = await db.query(query);

            return result || null;
        } catch (error) {
            console.error('Errore durante l\'inserimento del cliente:', error);
            throw error;
        }
    }

    async updateUser(userId: number, data: Partial<User>): Promise<any> {
        try {
            if (!userId || isNaN(userId)) {
                throw new Error("L'ID utente deve essere un numero valido.");
            }
    
            const query = `
                UPDATE dbo.users
                SET
                    "name" = COALESCE($1, "name"),
                    "firstname" = COALESCE($2, "firstname"),
                    "lastname" = COALESCE($3, "lastname"),
                    "email" = COALESCE($4, "email"),
                    "role" = COALESCE($5, "role"),
                    "permissions" = COALESCE($6, "permissions"),
                    "type" = COALESCE($7, "type"),
                    "active" = COALESCE($8, "active"),
                    "locale" = COALESCE($9, "locale"),
                    "password" = COALESCE($10, "password"),
                    "modified_at" = CURRENT_TIMESTAMP
                WHERE
                    "id" = $11
                RETURNING *;
            `;
    
            const values = [
                data.name || null,       
                data.firstname || null,  
                data.lastname || null,   
                data.email || null,      
                data.role || null,       
                data.permissions || null,
                data.type || null,       
                data.active || null,
                data.locale || null,  
                data.password || null,    
                userId                   
            ];
    
            const result = await db.query(query, values);
    
            return result || null;
        } catch (error) {
            console.error('Errore durante l\'aggiornamento dell\'utente:', error);
            throw error;
        }
    }

    async updateUserPassword(userId: number, data: Partial<User>): Promise<any> {
        try {
            if (!userId || isNaN(userId)) {
                throw new Error("L'ID utente deve essere un numero valido.");
            }
    
            const query = `
                UPDATE dbo.users
                SET
                    "password" = COALESCE($1, "password")
                WHERE
                    "id" = $2
                RETURNING *;
            `;
    
            const values = [
                data.password || null,    
                userId                   
            ];
    
            const result = await db.query(query, values);
    
            return result || null;
        } catch (error) {
            console.error('Errore durante l\'aggiornamento dell\'utente:', error);
            throw error;
        }
    }

    async getUsersByType(type: string): Promise<User[] | null> {
        try {
            const query = `SELECT * FROM dbo.users WHERE "type" = '${type}';`;
    
            const result = await db.query(query);
    
            if (Array.isArray(result) && result.length > 0) {
                return result as User[]; 
            }
    
            console.log('Nessun utente trovato per il tipo: ' + type);
            return null; 
        } catch (error) {
            console.error('Errore durante il recupero degli utenti per tipo:', error);
            throw error; 
        }
    }

    async getUsersByRole(role: string): Promise<User[] | null> {
        try {
            const query = `SELECT * FROM dbo.users WHERE "role" = '${role}';`;
    
            const result = await db.query(query);
    
            if (Array.isArray(result) && result.length > 0) {
                return result as User[]; 
            }
    
            console.log('Nessun utente trovato per il role: ' + role);
            return null; 
        } catch (error) {
            console.error('Errore durante il recupero degli utenti per tipo:', error);
            throw error; 
        }
    }
    
    async getUsersByEmail(email: string): Promise<User[] | null> {
        try {
            const query = `SELECT * FROM dbo.users WHERE "email" = '${email}';`;
    
            const result = await db.query(query);
    
            if (Array.isArray(result) && result.length > 0) {
                return result as User[]; 
            }
    
            console.log('Nessun utente trovato per il tipo: ' + email);
            return null; 
        } catch (error) {
            console.error('Errore durante il recupero degli utenti per tipo:', error);
            throw error; 
        }
    }

}

export default new userService();

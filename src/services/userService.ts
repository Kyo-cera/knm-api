import { User } from 'models/user';
import db from '../database/database';
import { writeToLog } from '../utils/writeLog';
import jsonwebtoken from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import { sendEmail } from '../utils/email';
import { EmailData } from 'models/email';


class userService {

    async getAllUsers(): Promise<User[]> {
        const users = await db.query(`SELECT * FROM dbo.users`);
        return users as User[];
    }

    async getUserById(ID: number): Promise<any> {
        try {
            const user = await db.query(`SELECT * FROM dbo.users WHERE "id" = '${ID}'`);
            
            if (Array.isArray(user) && user.length > 0) {
                const userData = user[0] as User;
    
                const token = generateToken(userData.email);
                userData["token"] = token; // Aggiungo il token nell'oggetto
    
                return {
                    success: true,
                    data: userData,
                    token: token, // 🔥 Token nel ritorno
                    error: null
                };
            }
    
            writeToLog('user not found ', user);
            return {
                success: false,
                data: null,
                error: "Utente non trovato"
            };
    
        } catch (error) {
            console.error("Errore durante il recupero dell'utente per ID:", error);
            return {
                success: false,
                data: null,
                error: error
            };
        }
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
    
            writeToLog('Nessun utente trovato per il tipo: ' , type);
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
    
            writeToLog('Nessun utente trovato per il role: ' , role);
            return null; 
        } catch (error) {
            console.error('Errore durante il recupero degli utenti per tipo:', error);
            throw error; 
        }
    }
    
    async getUsersByEmail(email: string): Promise<any> {
        try {
            const user = await db.query(`SELECT * FROM dbo.users WHERE "email" = '${email}'`);
            
            if (Array.isArray(user) && user.length > 0) {
                const userData = user[0] as User;
    
                const token = generateToken(userData.email);
                userData["token"] = token; // Aggiungo il token nell'oggetto
    
                return {
                    success: true,
                    data: userData,
                    token: token, // 🔥 Token nel ritorno
                    error: null
                };
            }
    
            writeToLog('user not found ', user);
            return {
                success: false,
                data: null,
                error: "Utente non trovato"
            };
    
        } catch (error) {
            console.error("Errore durante il recupero dell'utente per ID:", error);
            return {
                success: false,
                data: null,
                error: error
            };
        }
    }

    async verifyToken(token: string): Promise<any>{
        try {
            const decoded = jsonwebtoken.verify(token, secretKey);
            return decoded;
        } catch (error) {
            console.error("Token non valido o scaduto:", error);
            return null;
        }
    };

    async authMiddleware (req: Request, res: Response, next: NextFunction): Promise<any>{
        try {
            const authHeader = req.headers.authorization;
    
            if (!authHeader) {
                return res.status(401).json({ success: false, message: 'Token mancante' });
            }

            const token = authHeader.split(' ')[1];
    
            if (!token) {
                return res.status(401).json({ success: false, message: 'Token non valido' });
            }
    
            const decoded = verifyToken(token);
    
            if (!decoded) {
                return res.status(401).json({ success: false, message: 'Token scaduto o non valido' });
            }

            (req as any).user = decoded;

            next();
    
        } catch (error) {
            console.error('Errore autenticazione:', error);
            return res.status(401).json({ success: false, message: 'Token non valido' });
        }
    
    };

async verifyUserByEmail(email: string): Promise<any> {
    try {
        // Controllo che l'email non sia vuota
        if (!email) {
          return { success: false, error: "Email is required" };
        }
    
        // Esegui la query per controllare se l'email esiste nel DB
        const result = await db.query(
          `SELECT email FROM dbo.users WHERE "email" = '${email}'`
        );
    
        // Se la mail non è trovata, ritorna errore
        if (!result || result.length === 0) {
          console.log("Email non trovata:", email);
          return { success: false, error: "Email not found in the database" };
        }
    
        console.log("Email trovata:", email);
    
        // Creiamo i dati per la mail
        const emailData: EmailData = {
            recipient: `${email}`,
            subject: `cambia password per la mail: ${email}`,
            emailBody: `<p>cambia qui la tua password: </p>`
        };
    
        // Usiamo la funzione già pronta per inviare la mail
        const emailStatus = await sendEmail(emailData);
    
        // Se la mail non parte, ritorniamo errore
        if (emailStatus !== "success") {
          console.error("Errore nell'invio dell'email:", emailStatus);
          return { success: false, error: "Failed to send email" };
        }
    
        console.log(`Email di verifica inviata a: ${email}`);
    
        // Ritorna un risultato di successo
        return {
          success: true,
          message: "Verification email sent successfully"
        };
      } catch (error) {
        console.error("Errore nel service verifyUserByEmail:", error);
        return { success: false, error: error || "Internal server error" };
      }
    }    


}

dotenv.config();

const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';

export const generateToken = (email: string): string => {
    try {
        const payload = {
            email: email,
            exp: Math.floor(Date.now() / 1000) + (1 * 60)
        };

        const token = jsonwebtoken.sign(payload, secretKey);
        return token;
    } catch (error) {
        console.error("Errore nella generazione del token:", error);
        throw new Error('Errore nella generazione del token');
    }
};

export const verifyToken = (token: string) => {
    try {
        const decoded = jsonwebtoken.verify(token, secretKey);
        return decoded;
    } catch (error) {
        console.error("Token non valido o scaduto:", error);
        return null;
    }
};


export default new userService();

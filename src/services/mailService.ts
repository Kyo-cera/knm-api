import { e_mail } from '../models/e-mail';
import { IResult } from 'mssql';
import { sendEmail } from '../utils/email';
import { EmailData } from '../models/email';
import { writeToLog } from '../utils/writeLog';
import db from '../database/database';

class mailService{

    async getAllEmail(): Promise<e_mail[]> {
        const email = await db.query(`SELECT * FROM dbo.email`);
        return email as e_mail[];
    }

    async getEmailByType(tipo:string): Promise<e_mail | null> {
        const email = await db.query(`SELECT * FROM dbo.email WHERE "type_email" = '${tipo}'`);
        if (Array.isArray(email) && email.length > 0) {
            return email[0] as e_mail;
        }
        return null;
    }

    async getEmailById(id:number): Promise<e_mail | null> {
        const email = await db.query(`SELECT * FROM dbo.email WHERE "id" = '${id}'`);
        if (Array.isArray(email) && email.length > 0) {
            return email[0] as e_mail;
        }
        return null;
    }

    async postMail(data: e_mail): Promise<void> {
        try {
            const result = await db.query(`
                INSERT INTO dbo.email(email, subject, body, type_email, updated_at)
                VALUES 
                ('${data.email}', '${data.subject}', '${data.body}', '${data.type_email}', CURRENT_TIMESTAMP)
            `);
        } catch (error) {
            console.error('Errore durante l\'inserimento della email:', error);
        }
    }

    async updateByID(data: e_mail, id: number): Promise<void> {
        try {
            const result = await db.query(`
                SELECT * 
                FROM dbo.email
                WHERE "id" = '${id}'
                LIMIT 1;
            `);
            
            if (result.length > 0) {
                await db.query(`
                    UPDATE dbo.email
                    SET 
                        "email" = '${data.email}', 
                        "subject" = '${data.subject}', 
                        "body" = '${data.body}', 
                        "updated_at" = CURRENT_TIMESTAMP  -- Usare CURRENT_TIMESTAMP in PostgreSQL
                    WHERE "id" = '${id}'
                `);
            } else {
                writeToLog(`Email with ID ${id} not found. No update performed.`,id);
            }
        } catch (error) {
            console.error('Errore durante l\'aggiornamento dell\'email:', error);
            throw error; 
        }
    
    }
    
    async invioEmail (data: EmailData): Promise<void> {
        const emailData: EmailData = {
                              recipient: `${data.recipient}`,
                              subject: `${data.subject}`,
                              emailBody: `${data.emailBody}`,
                              attachment: `${data.attachment}`
                          };
                          const sendSuccess = await sendEmail(emailData);
    }
        

}

export default new mailService();
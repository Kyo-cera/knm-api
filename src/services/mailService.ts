import { e_mail } from '../models/e-mail';
import db from '../database/database';

class mailService{

    async getAllEmail(): Promise<e_mail[]> {
        const email = await db.query(`SELECT * FROM email`);
        return email as e_mail[];
    }

    async getAllEmailCustomers(): Promise<e_mail[]> {
        const email = await db.query(`SELECT * FROM email WHERE type_email = 'Emailcustomers'`);
        return email as e_mail[];
    }

    async getAllEmailAdmin(): Promise<e_mail[]> {
        const email = await db.query(`SELECT * FROM email WHERE type_email = 'Emailadmin'`);
        return email as e_mail[];
    }

    async getFirstCustomerEmail(): Promise<e_mail | null> {
        const email = await db.query(`SELECT TOP 1 * FROM email WHERE type_email = 'Emailcustomers' ORDER BY id ASC`);
        return email[0] || null;
    }

    async getFirstAdminEmail(): Promise<e_mail | null> {
        const email = await db.query(`SELECT TOP 1 * FROM email WHERE type_email = 'Emailadmin' ORDER BY id ASC`);
        return email[0] || null;
    }

    async updateFirstCustomerEmail(updatedEmail: e_mail): Promise<e_mail | null> {
        await db.query(`UPDATE email SET 
            email = '${updatedEmail.email}', 
            subject = '${updatedEmail.subject}', 
            body = '${updatedEmail.body}', 
            type_email = '${updatedEmail.type_email}', 
            updated_at = GETDATE() 
            WHERE id = (SELECT TOP 1 id FROM email WHERE type_email = 'Emailcustomers' ORDER BY id ASC)`);
        return this.getFirstCustomerEmail();
    }

    async updateFirstAdminEmail(updatedEmail: e_mail): Promise<e_mail | null> {
        await db.query(`UPDATE email SET 
            email = '${updatedEmail.email}', 
            subject = '${updatedEmail.subject}', 
            body = '${updatedEmail.body}', 
            type_email = '${updatedEmail.type_email}', 
            updated_at = GETDATE() 
            WHERE id = (SELECT TOP 1 id FROM email WHERE type_email = 'Emailadmin' ORDER BY id ASC)`);
        return this.getFirstAdminEmail();
    }


}

export default new mailService();
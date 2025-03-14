import { Customer } from 'models/customer';
import db from '../database/database';
const axios = require('axios');
import { EmailData } from '../models/email';
import { sendEmail } from '../utils/email';
import { createPDFList, processJsonFiles, readSalesDocuments, runAllProcessesPDF, updateStatusFromApi } from '../utils/pdf';
import { writeToLog } from '../utils/writeLog';
const apiUrl = `${process.env.ENDPOINT_API}${process.env.PORT}`;
class customerService {
    async getAllCustomers(): Promise<Customer[]> {
        const customers = await db.query(`SELECT * FROM dbo.ordinante`);
        return customers as Customer[];
    }

    async getCustomerByItemOda(ODA:number): Promise<Customer | null> {
        const customer = await db.query(`SELECT * FROM dbo.ordinante WHERE "ODA" = '${ODA}'`);
        if (Array.isArray(customer) && customer.length > 0) {
            return customer[0] as Customer;
        }
        writeToLog('customer not found',customer);
        return null;
    }
    async postCustomer(data: Customer): Promise<Customer | null> {
        try {
            if (!data.ODA || !data.Sales_Doc || !data.Ordinante || !data.Email) {
                throw new Error('Missing required fields');
            }

            const values = [
                data.Sales_Doc.toString().replace(/[\s\uFEFF\xA0]+/g, ''),
                data.Ordinante.toString().trim(),
                data.Email.toString().trim(),
                data.ODA.toString().replace(/[\s\uFEFF\xA0]+/g, '').substring(0, 20)
            ];

            const query = `
                INSERT INTO dbo.ordinante ("Sales_Doc", "Ordinante", "Email", "ODA")
                VALUES ($1, $2, $3, $4)
            `;
            writeToLog("data.ODA: ",data.ODA);
            await db.query(query, values);
            return await this.getCustomerByItemOda(Number(values[3]));
        } catch (error) {
            console.error('Errore durante l\'inserimento del cliente:', error);
            throw error;
        }
    }
  

  async getCheckCustomer(): Promise<string> {
    try {
        const query = `
            UPDATE dbo.ordinante o
            SET "Sales_Doc" = ord."Sales_Doc"
            FROM dbo.orders ord
            WHERE o."ODA" = ord."Purchase_order_nr"
              AND o."Sales_Doc" != ord."Sales_Doc";
        `;

        // Eseguiamo il merge
        await db.query(query);

        return "getCheckCustomer fatta con successo";
    } catch (error) {
        console.error('Errore durante l\'aggiornamento del Sales_Doc nella tabella ordinante:', error);
        throw error;
    }
}


    //getCustomerPdfList
    async getCustomerPdfList(): Promise<object> {
        try {           
            const results = await createPDFList();
            return {results}
          } catch (error) {
            console.error(`Errore durante l'aggiornamento del salesDoc in table Ordinante nel database:`, error);
            throw error;
          }
       
    }
    async getCustomerPdfRead(): Promise<object> {
        try {           
            const results = await readSalesDocuments();
            return {results}
          } catch (error) {
            console.error(`Errore durante la lettura del Pdf nella directory con fn: readSalesDocuments:`, error);
            throw error;
          }
       
    }
    //getCustomerPdUpdate
    async getCustomerPdfUpdate(): Promise<object> {
      try {           
          const results = await updateStatusFromApi();
          return {results}
        } catch (error) {
          console.error(`Errore durante la lettura del Pdf nella directory con fn: readSalesDocuments:`, error);
          throw error;
        }
     
  }
  //getCustomerPdfProcess
  async getCustomerPdfProcess(): Promise<object> {
    try {           
        const results = await processJsonFiles();
        return {results}
      } catch (error) {
        console.error(`Errore durante la lettura del Pdf nella directory con fn: readSalesDocuments:`, error);
        throw error;
      }
   
}
//getCustomerAllPdfProcess
async getCustomerAllPdfProcess(): Promise<object> {
  try {           
      const results = await runAllProcessesPDF();
      const EmailadminResp = await axios.get(`${apiUrl}/email/byType/Emailadmin`);
      const Emailadmin = EmailadminResp.data.data;

    let emailAdmin = '';
    
    if (Emailadmin && Emailadmin.email) {
        emailAdmin = Emailadmin.email;
    }

      const emailData: EmailData = {
          recipient: `${emailAdmin}`,
          subject: `Knm import customers`,
          emailBody: `<p>${results?.success} customers imported</p>`,
          attachment: `noTXT.txt`
      };
      const sendSuccess = await sendEmail(emailData);

    //  console.log("results:: ",results);
      return {results}
    } catch (error) {
      console.error(`Errore durante la lettura del Pdf  con fn: runAllProcessesPDF:`, error);
      throw error;
    }
 
}

}

export default new customerService();
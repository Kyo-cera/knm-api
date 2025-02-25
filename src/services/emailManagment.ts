import axios from 'axios';
import { EmailData } from '../models/email';
import { sendEmail } from '../utils/email';
import { writeToLog } from '../utils/writeLog';
import fs from 'fs';
import path from 'path';
import db from '../database/database';
import dotenv from 'dotenv';
const apiUrl = `${process.env.ENDPOINT_API}${process.env.PORT}`;
const filePath = path.resolve('./src/data/devMode/devMode.json');
let devMode: boolean 

class EmailManagmentService {
    constructor() {
        this.loadDevMode();
    }

    async loadDevMode() {
        try {
            if (fs.existsSync(filePath)) {
                const data = await fs.promises.readFile(filePath, 'utf8');
                const jsonData = JSON.parse(data);
                devMode = jsonData.devMode;
            }
        } catch (error) {
            console.error('Errore durante la lettura di devMode:', error);
        }
    }

    async inDevMode() {
        devMode = !devMode;
        const data = { devMode: devMode };

        try {
            await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            return data;
        } catch (error) {
            console.error('Errore durante il salvataggio di devMode:', error);
        }
    }

    async getDevMode() {
        try {
            if (fs.existsSync(filePath)) {
                const data = await fs.promises.readFile(filePath, 'utf8');
                const jsonData = JSON.parse(data);
                return jsonData.devMode;
            }
            return false;
        } catch (error) {
            console.error('Errore durante la lettura di devMode:', error);
            return false;
        }
    }
}

export default new EmailManagmentService()
export const emailAdmin = async () => {
        const EmailadminResp = await axios.get(`${apiUrl}/email/byType/Emailadmin`);
          const Emailadmin = EmailadminResp.data.data;
          
          let subjectAdmin = '';
          let bodyAdmin = '';
          let emailAdmin = '';
          
          if (Emailadmin && Emailadmin.subject) {
              subjectAdmin = Emailadmin.subject;
              bodyAdmin = Emailadmin.body;
              emailAdmin = Emailadmin.email;
          }
          
          const ordersResponse = await axios.get(`${apiUrl}/orders/`);
          const orders: { Sales_Doc: string }[] = ordersResponse.data.data;
          const salesDocs = [...new Set(orders.map(order => order.Sales_Doc))];
          
          for (const salesDoc of salesDocs) {
              const customerResponse = await axios.get(`${apiUrl}/customer/`);
              const customers = customerResponse.data.data;
          
              let customerWithSalesDoc = false;
              let customerWithoutEmail = false;
              let customerWithApostrofo = false;
              let custEmail;
          
              if (customers && customers.length > 0) {
                  for (const customer of customers) {
                      if (customer.Sales_Doc === salesDoc) {
                          customerWithSalesDoc = true;
                          break; 
                      } else if (customer.Email.includes("'")) {
                        customerWithApostrofo = true
                        custEmail = customer.Email
                    }
                    
                  }
              }

              if (customers && customers.length > 0) {
                for (const customer of customers) {
                    if (customer.Email === "" || customer.Email === null) {
                        customerWithoutEmail = true;
                        subjectAdmin = "Indirizzo email mancante"
                        break; 
                    }
                }
            }
          
              if (!customerWithSalesDoc || customerWithoutEmail) {
                  const emailData: EmailData = {
                      recipient: `${emailAdmin}`,
                      subject: `${customerWithApostrofo ? `Indirizzo email ${custEmail} non valido` : subjectAdmin} - Sales Doc: ${salesDoc}`,
                      emailBody: `<p>${bodyAdmin}<br>Sales Doc: ${salesDoc}</p>`,
                      ...(fs.existsSync(path.join(__dirname, '../attachment/SalesDoc-Without-email.xlsx')) && {
                          attachment: "SalesDoc-Without-email.xlsx"
                      })
                  };
          
                  const sendSuccess = await sendEmail(emailData);
              } else {
                writeToLog(`Nessuna email inviata per Sales Doc: ${salesDoc} perché è associato a un cliente.`, salesDoc);
              }
          }
}

export const getEmailCustomer = async (salesDoc: string, oda: string): Promise<boolean> => {
    try {
        const resp = await axios.get(`${apiUrl}/license/email/${salesDoc}`);
        const email = resp.data;
        const userEmail = email.data[0].email;
        const fileExcel = `${salesDoc}.xlsx`;

        const customerResp = await axios.get(`${apiUrl}/customer/${oda}`);
        const customer = customerResp.data.data;
        let customerEmail = customer.Email

        if (!customer || !customer.Email) {
            console.error("Errore: `customer` o `customer.Email` non definito per `oda`:", oda);
            return false;
        }

        const EmailcustomersResp = await axios.get(`${apiUrl}/email/byType/Emailcustomers`);
        const Emailcustomers = EmailcustomersResp.data.data;
        const EmailadminResp = await axios.get(`${apiUrl}/email/byType/Emailadmin`);
        const Emailadmin = EmailadminResp.data.data;

          let emailAdmin = '';
          let bodyAdmin = '';
          
          if (Emailadmin && Emailadmin.email) {
              emailAdmin = Emailadmin.email;
              bodyAdmin = Emailadmin.body || '';
          }

        if (!Emailcustomers) {
            console.error("Errore: `Emailcustomers` non definito.");
            return false;
        }


        if(customer && Emailcustomers){

            let subjectCust = Emailcustomers.subject || '';
            let bodyCust = Emailcustomers.body || '';
            // let emailCust = Emailcustomers.email || '';
            let emailCust = customer.Email || '';

            if (bodyCust.includes("cliente")) {
                bodyCust = bodyCust.replace("cliente,", `${customer.Ordinante}<br>`);
            }

            const emailData: EmailData = {

            // recipient: `${emailCust}`,
            recipient: devMode ? 'KNM-Licenses@dit.kyocera.com' : `${emailCust}`,
            subject: subjectCust,
            emailBody: `<p>${bodyCust}</p>`,
            attachment: fileExcel
        };
        const sendsuccess = await sendEmail(emailData);
        let emails:any[] = []
        await new Promise(resolve => setTimeout(resolve, 5000)); 

        const response: any = await axios.get(`${apiUrl}/emailMC/getEmails`, {
            headers: {
                'Accept': 'application/json',
            },
        });

        
        if (response) {
            emails = response.data.data
            let emailsFiltrate = []
            for (let emailFiltrate of  emails) {
                if (emailFiltrate.isRead === false && emailFiltrate.hasAttachments == false) {
                    emailsFiltrate.push(emailFiltrate)
                }
            }

            await new Promise(resolve => setTimeout(resolve, 15000));
            if (emailsFiltrate[0]?.subject.includes("Non recapitabile")) {
                const emailDataSbagliata: EmailData = {
                    recipient: `${emailAdmin}`,
                    subject: `Indirizzo email inesistente - Sales Doc: ${salesDoc}`,
                    emailBody: `<p>${bodyAdmin} ${customerEmail}</p>`,
                    attachment: fileExcel
                };
                await sendEmail(emailDataSbagliata);
                await new Promise(resolve => setTimeout(resolve, 15000)); 
                await markEmailAsRead(emailsFiltrate[0].id, true)
                await new Promise(resolve => setTimeout(resolve, 5000)); 
                try {
                    await db.query(`
                        UPDATE dbo.licenze
                        SET "STATO" = null, "Sales_Doc" = null, "Item" = null
                        WHERE "Sales_Doc" = '${salesDoc}'
                    `);
            
                } catch (error) {
                    console.error("Errore durante l'aggiornamento del database:", error);
                }
                return false;
            }
        } else {
            console.error("Nessuna email trovata nella risposta");
        }

        

        writeToLog('Esito invio email:', sendsuccess);
        return sendsuccess;
        
        }
        return false
    } catch (error) {
        writeToLog(`Errore durante la ricerca dell'email per salesDoc: ${salesDoc}`, error);
        console.error('Errore durante la ricerca dell\'email:', salesDoc, error);
        throw error;
    }
}

async function markEmailAsRead(messageId: string, isRead: boolean): Promise<void> {
    dotenv.config();
    try {
        if (!messageId) {
            throw new Error("❌ messageId non valido o undefined");
        }

        const url = `https://graph.microsoft.com/v1.0/users/KNM-Licenses@dit.kyocera.com/messages/${messageId}`;

        const response = await axios.patch(
            url,
            { isRead },  // Imposta true o false
            {
                headers: {
                    Authorization: `Bearer ${process.env.TOKENMSG}`,
                    "Content-Type": "application/json",
                },
            }
        );

        writeToLog(`✅ Email ${isRead ? "letta" : "non letta"} con successo!`, isRead);
    } catch (error) {
        writeToLog("❌ Errore nel modificare lo stato di lettura dell'email:", error);
        throw error;
    }
}

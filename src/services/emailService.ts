import msal from '@azure/msal-node';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from "path";
import { ScheduleData } from "models/scheduleData";
import cron from 'node-cron';

dotenv.config();

class Services {
    static pca: msal.PublicClientApplication;
    static cca: msal.ConfidentialClientApplication;

    static initialize = () => {
        const msalConfig = {
            auth: {
                clientId: `${process.env.APPLICATION_ID}`,
                authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
                clientSecret: `${process.env.APPLICATION_SECRET}`,
            },
        };

        Services.cca = new msal.ConfidentialClientApplication(msalConfig);

        Services.pca = new msal.PublicClientApplication({
            auth: {
                clientId: `${process.env.APPLICATION_ID}`,
                authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
            },
        });
    };

    static generateGraphApiAccessToken = async () => {
        try {
            if (!Services.cca) {
                Services.initialize();
            }

            const tokenRequest = {
                scopes: ['https://graph.microsoft.com/.default'],
            };

            const tokenResponse = await Services.cca.acquireTokenByClientCredential(tokenRequest);
            return tokenResponse?.accessToken;
        } catch (error) {
            return "error access token: " + error;
        }
    };

    static generateDelegatedAccessToken = async (): Promise<string> => {
        try {
            const accessToken = process.env.TOKENMSG;

            if (!accessToken) {
                throw new Error("Token di accesso non trovato. Verifica il file .env e la variabile TOKENMSG.");
            }

            return accessToken;
        } catch (error) {
            console.error("Errore nel recupero del token delegato:", error);
            throw error;
        }
    };

    static getEmails = async (): Promise<any> => {
        try {
            const accessToken = await Services.generateDelegatedAccessToken();

            const response = await axios.get("https://graph.microsoft.com/v1.0/me/messages", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const messages = response.data.value;

            const emails = messages.map((message: any) => ({
                id: message.id,
                subject: message.subject,
                sender: message.sender?.emailAddress?.address,
                receivedDateTime: message.receivedDateTime,
                hasAttachments: message.hasAttachments,
                isRead: message.isRead,
            }));

            return emails;
        } catch (error) {
            console.error("Errore durante il recupero delle email:", error);
            throw error;
        }
    };

    static async getAttachments(messageId: string): Promise<any> {
        try {
            const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments`;

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${process.env.TOKENMSG}`,
                },
            });

            return response.data.value; // Array di allegati
        } catch (error) {
            console.error("❌ Errore nel recupero degli allegati:", error);
            throw error;
        }
    }

    static async downloadAttachments(messageId: string): Promise<void> {
        try {
            const attachments = await Services.getAttachments(messageId);
    
            if (attachments.length === 0) {
                console.log("📭 Nessun allegato trovato.");
                return;
            }
    
            for (const attachment of attachments) {
                if (attachment["@odata.type"] === "#microsoft.graph.fileAttachment") {
                    const fileName = attachment.name;
                    let savePath = "C:\\files"; 
    
                    if (fileName.includes("licenses SO")) {
                        savePath = "C:\\files"; 
                    } else if (fileName.includes("Sblocco")) {
                        savePath = "C:\\files\\licenze"; 
                    }
    
                    const filePath = path.join(savePath, fileName);
    
                    fs.writeFileSync(filePath, attachment.contentBytes, "base64");
                    console.log(`✅ Allegato salvato: ${filePath}`);
                }
            }
        } catch (error) {
            console.error("❌ Errore nel download degli allegati:", error);
            throw error;
        }
    }
    

    static async markEmailAsRead(messageId: string, isRead: boolean): Promise<void> {
        try {
            if (!messageId) {
                throw new Error("❌ messageId non valido o undefined");
            }
    
            const url = `https://graph.microsoft.com/v1.0/me/messages/${messageId}`;
    
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
    
            console.log(`✅ Email ${isRead ? "letta" : "non letta"} con successo!`);
        } catch (error) {
            console.error("❌ Errore nel modificare lo stato di lettura dell'email:", error);
            throw error;
        }
    }
    


    static async checkAndDownload(): Promise<any> {
        try {
            let emails = await this.getEmails()
            for (let email of emails){
                let oggetto: string = email.subject
                if(email.hasAttachments && !email.isRead && oggetto.includes("sblocco")){
                    let attachments = await this.downloadAttachments(email.id)
                    await this.markEmailAsRead(email.id, true)
                    return attachments
                }
            }
            } catch (error) {
            console.error("❌ Errore nel recupero degli allegati:", error);
            throw error;
        }
    }

    static scheduleCheckAndDownload(scheduleData: ScheduleData): void {
        const { ora, minuti } = scheduleData; 

        const cronExpression = `${minuti} ${ora} * * *`;

        console.log(`[DEBUG] Configurazione cron: "${cronExpression}" per l'API CheckAndDownload`);

        cron.schedule(
            cronExpression,
            async () => {
                try {
                    console.log(`⏳ Avvio richiesta API a ${ora}:${minuti}...`);
                    const response = await axios.get("http://localhost:3005/emailMC/checkAndDownload");
                    console.log("✅ API eseguita con successo:", response.data);
                } catch (error) {
                    console.error("❌ Errore nell'esecuzione dell'API:", error);
                }
            },
            {
                scheduled: true,
                timezone: "Europe/Rome",
            }
        );

        console.log(`🔔 API programmata per le ${ora}:${minuti}`);
    }

    
}

export default Services;
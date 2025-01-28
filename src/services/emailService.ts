import msal from '@azure/msal-node';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from "path";
import { scheduleDataEmail } from "models/scheduleDataEmail";
import cron from 'node-cron';
import { writeToLog } from '../utils/writeLog';
require("dotenv").config();
const envPath = path.resolve(__dirname, ".env");
const SCHEDULE_DATA_PATH = path.join(__dirname, "../data/scheduleData/scheduleDataEmail.json");

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
            writeToLog("Errore nel recupero del token delegato:", error);
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
            writeToLog("Errore durante il recupero delle email:", error);
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
            writeToLog("❌ Errore nel recupero degli allegati:", error);
            throw error;
        }
    }

    static async downloadAttachments(messageId: string): Promise<void> {
        try {
            const attachments = await Services.getAttachments(messageId);
    
            if (attachments.length === 0) {
                writeToLog("📭 Nessun allegato trovato.", attachments.length);
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
                    writeToLog(`✅ Allegato salvato: ${filePath}`, filePath);
                }
            }
        } catch (error) {
            writeToLog("❌ Errore nel download degli allegati:", error);
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
    
            writeToLog(`✅ Email ${isRead ? "letta" : "non letta"} con successo!`, isRead);
        } catch (error) {
            writeToLog("❌ Errore nel modificare lo stato di lettura dell'email:", error);
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
                writeToLog("❌ Errore nel recupero degli allegati:", error);
            throw error;
        }
    }

    static saveScheduleData(scheduleDataEmail: scheduleDataEmail): void {
        try {
            fs.writeFileSync(SCHEDULE_DATA_PATH, JSON.stringify(scheduleDataEmail, null, 2), "utf-8");
            writeToLog("✅ Dati di schedulazione salvati:", scheduleDataEmail);
        } catch (error) {
            writeToLog("❌ Errore nel salvataggio dei dati di schedulazione:", error);
        }
    }

    static getScheduleData(): any {
        try {
            if (!fs.existsSync(SCHEDULE_DATA_PATH)) {
                writeToLog("⚠️ Il file di schedulazione non esiste. Restituzione di dati vuoti.", SCHEDULE_DATA_PATH);
                return { ora: null, minuti: null, frequenza: null };
            }
    
            const data = fs.readFileSync(SCHEDULE_DATA_PATH, "utf-8");
            return JSON.parse(data);
        } catch (error) {
            writeToLog("❌ Errore nel recupero dei dati di schedulazione:", error);
            return null;
        }
    }

    // funzione per la gestione del token scaduto
    static async refreshAccessToken(refreshToken: any) {
        const tokenUrl = `https://login.microsoftonline.com/abb79fd9-c566-40c1-af4d-313a74c9f286/oauth2/v2.0/token`;
    
        const data = new URLSearchParams();
        data.append("client_id", process.env.CLIENT_ID || "");
        data.append("client_secret", process.env.CLIENT_SECRET || "");
        data.append("grant_type", "refresh_token");
        data.append("refresh_token", process.env.REFRESH_TOKEN || "");
        data.append("scope", "https://graph.microsoft.com/.default");

            
        try {
            const response = await axios.post(tokenUrl, data);
            const newToken = response.data.access_token;
            writeToLog("✅ Nuovo Access Token ottenuto!", newToken);
    
            // Aggiorna il file .env con il nuovo token
            Services.updateEnvFile("TOKENMSG", newToken);
    
            return newToken;
        } catch (error) {
            writeToLog("❌ Errore nel rinnovo del token:", error);
            return null;
        }
    }
    
    // Funzione per aggiornare una variabile nel file .env
    static updateEnvFile(key:any, value:any) {
        let envContent = fs.readFileSync(envPath, "utf8"); // Legge il file .env
    
        // Se la chiave esiste, la aggiorna, altrimenti la aggiunge
        const regex = new RegExp(`^${key}=.*`, "m");
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
            envContent += `\n${key}=${value}`;
        }
    
        fs.writeFileSync(envPath, envContent, "utf8"); // Scrive il nuovo file .env
        writeToLog(`✅ Variabile ${key} aggiornata nel file .env!`, key);
    }
    
    

    static scheduleCheckAndDownload(scheduleDataEmail: scheduleDataEmail): void {
        const { ora, minuti, frequenza } = scheduleDataEmail; 

        Services.saveScheduleData(scheduleDataEmail);

        const cronExpression = `${minuti} ${ora} * * *`;

        writeToLog(`[DEBUG] Configurazione cron: "${cronExpression}" per l'API CheckAndDownload`, cronExpression);

        cron.schedule(
            cronExpression,
            async () => {
                try {
                    writeToLog(`⏳ Avvio richiesta API a ${ora}:${minuti}...`,`${ora}, ${minuti}`);
                    const response = await axios.get("http://localhost:3005/emailMC/checkAndDownload");
                    writeToLog("✅ API eseguita con successo:", response.data);
                } catch (error) {
                    writeToLog("❌ Errore nell'esecuzione dell'API:", error);
                }
            },
            {
                scheduled: true,
                timezone: "Europe/Rome",
            }
        );

        writeToLog(`🔔 API programmata per le ${ora}:${minuti}`,`${ora}, ${minuti}`);
        // Services.refreshAccessToken(process.env.TOKENMSG)
    }

    
}

export default Services;
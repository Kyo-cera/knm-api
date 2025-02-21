import msal from '@azure/msal-node';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from "path";
import { scheduleDataEmail } from "models/scheduleDataEmail";
import cron from 'node-cron';
import { writeToLog } from '../utils/writeLog';
const apiUrl = `${process.env.ENDPOINT_API}${process.env.PORT}`;
require("dotenv").config();
const envPath = path.join(process.cwd(), '.env');
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
            const accessToken = process.env.TOKENMSG;
            const userId = process.env.MAIL_SENDER; // Usa l'ID utente specificato

            const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/messages`, {
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
        dotenv.config();
        try {
            const userId = process.env.MAIL_SENDER;
            const url = `https://graph.microsoft.com/v1.0/users/${userId}/messages/${messageId}/attachments`;

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${process.env.TOKENMSG}`,
                },
            });

            return response.data.value;
        } catch (error) {
            writeToLog("❌ Errore nel recupero degli allegati:", error);
            throw error;
        }
    }

    static async downloadAttachments(messageId: string): Promise<any[]> {
        dotenv.config();
        try {
            const attachments = await Services.getAttachments(messageId);
            let attachmentTrovati: any[] = [];
    
            if (attachments.length === 0) {
                writeToLog("📭 Nessun allegato trovato.", attachments.length);
                return [];
            }
    
            for (const attachment of attachments) {
                if (attachment["@odata.type"] === "#microsoft.graph.fileAttachment") {
                    let fileName = attachment.name;
                    let savePath = "C:\\files";

                    writeToLog("📂 Nome originale:", fileName);

                    if (fileName.includes("Consips2")) {
                        fileName = "Consips2 licenses SO.xlsx"
                        savePath = "C:\\files"; 
                    } else if (fileName.includes("licenze KNM") || fileName.includes("Sblocco") || fileName.includes("sblocco")) {
                        fileName = "28° Sblocco C2 (licenze KNM) 16.10.2024.xlsx"
                        savePath = "C:\\files\\licenze"; 
                    }
    
                    const filePath = path.join(savePath, fileName);
                    attachment.name = fileName;
    
                    fs.writeFileSync(filePath, attachment.contentBytes, "base64");
                    writeToLog(`✅ Allegato salvato: ${filePath}`, filePath);
                    attachmentTrovati.push(attachment)
                }
            }
            return attachmentTrovati
        } catch (error) {
            writeToLog("❌ Errore nel download degli allegati:", error);
            throw error;
        }
    }
    

    static async markEmailAsRead(messageId: string, isRead: boolean): Promise<void> {
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
    


    static async checkAndDownload(): Promise<any> {
        await Services.handleTokenRefresh();
        writeToLog("nuovo token: : ", process.env.TOKENMSG);
        dotenv.config();
        writeToLog("nuovo token: : ", process.env.TOKENMSG);
        try {
            let emails = await this.getEmails()
            for (let email of emails){
                let oggetto: string = email.subject
                if(email.hasAttachments && !email.isRead && oggetto.includes("sblocco")){
                    let attachments = await this.downloadAttachments(email.id)
                    await this.markEmailAsRead(email.id, true)
                    return {attachments, successDownload:true}
                }
                return {successDownload:false}
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
    static async refreshAccessToken() {
        try {
            const tokenUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
            const data = new URLSearchParams();
    
            data.append("grant_type", "client_credentials");
            data.append("client_id", process.env.APPLICATION_ID || "");
            data.append("client_secret", process.env.APPLICATION_SECRET || "");
            data.append("scope", "https://graph.microsoft.com/.default");
    
            const response = await axios.post(tokenUrl, data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
    
            if (response.data.access_token) {
                // Aggiorniamo solo il token nel file .env
                await Services.updateEnvFile("TOKENMSG", response.data.access_token, false);
                process.env.TOKENMSG = response.data.access_token
                dotenv.config();
                return response.data.access_token;
            }
        } catch (error) {
            writeToLog("❌ Errore nel rinnovo del token:", error);
            throw error;
        }
    }
    
    
    // Funzione per gestire automaticamente il refresh del token quando scade
    static async handleTokenRefresh() {
        const updateToken = "Avvio aggiornamento token..."
        const updatedToken = "Token aggiornato con successo!"
        try {
            writeToLog("🔄 ", updateToken);
            await Services.refreshAccessToken();
            writeToLog("✅ ", updatedToken);
        } catch (error) {
            writeToLog("❌ Errore nell'aggiornamento del token:", error);
            throw error;
        }
    }
    
    // Modifichiamo updateEnvFile per gestire l'aggiunta di nuove variabili
    static updateEnvFile(key: string, value: string, isNewVariable: boolean = false) {
        try {
            let envContent = fs.readFileSync(envPath, "utf8");
            let lines = envContent.split('\n');
            
            // Se è una nuova variabile e non esiste già
            if (isNewVariable && !lines.some(line => line.startsWith(`${key}=`))) {
                lines.push(`${key}='${value}'`);
            } else {
                // Altrimenti aggiorniamo la variabile esistente
                lines = lines.filter(line => !line.startsWith(`${key}=`));
                lines.push(`${key}='${value}'`);
            }
            
            envContent = lines.join('\n');
            fs.writeFileSync(envPath, envContent, "utf8");
            
            writeToLog(`✅ Variabile ${key} ${isNewVariable ? 'aggiunta' : 'aggiornata'} nel file .env!`, value);
        } catch (error) {
            writeToLog("❌ Errore nell'aggiornamento del file .env:", error);
            throw error;
        }
    }
    
    

    static async scheduleCheckAndDownload(scheduleDataEmail: scheduleDataEmail): Promise<void> {
        
        const { ora, minuti, frequenza } = scheduleDataEmail; 

        Services.saveScheduleData(scheduleDataEmail);

        const cronExpression = `${minuti} ${ora} * * *`;

        writeToLog(`[DEBUG] Configurazione cron: "${cronExpression}" per l'API CheckAndDownload`, cronExpression);

        cron.schedule(
            cronExpression,
            async () => {
                try {
                    writeToLog(`⏳ Avvio richiesta API a ${ora}:${minuti}...`,`${ora}, ${minuti}`);
                    const response = await axios.get(`${apiUrl}/emailMC/checkAndDownload`);
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
    }

    
}

export default Services;
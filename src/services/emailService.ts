import msal from '@azure/msal-node';
import dotenv from 'dotenv';
import axios from 'axios';

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
            }));

            return emails;
        } catch (error) {
            console.error("Errore durante il recupero delle email:", error);
            throw error;
        }
    };
}

export default Services;
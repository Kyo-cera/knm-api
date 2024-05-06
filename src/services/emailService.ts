import msal from '@azure/msal-node';
import dotenv from 'dotenv';
dotenv.config();
//console.log('APPLICATION_ID: '+ process.env.APPLICATION_ID+' '+' APPLICATION_SECRET: '+ process.env.APPLICATION_SECRET+' '+' TENANT_ID: '+ process.env.TENANT_ID);
class Services {
   

    static cca: msal.ConfidentialClientApplication;

    static initialize = () => {
            const msalConfig = {
                auth: {
                    clientId: `${process.env.APPLICATION_ID}`,
                    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
                    clientSecret: `${process.env.APPLICATION_SECRET}`,
               }
            };
        Services.cca = new msal.ConfidentialClientApplication(msalConfig);
    }

    static generateGraphApiAccessToken = async () => {
        try {
            if (!Services.cca) {
                Services.initialize();
            }
            
            const tokenRequest = {
                scopes: ['https://graph.microsoft.com/.default'],
            };
            const tokenResponse = await Services.cca.acquireTokenByClientCredential(tokenRequest);
        //    console.log('token: ', tokenResponse?.accessToken);
            return tokenResponse?.accessToken;
        } catch (error) {
            return "error access token: " + error;
        }
    }
}

export default Services;
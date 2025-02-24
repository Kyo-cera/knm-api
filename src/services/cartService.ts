import axios from 'axios';
import { EmailData } from '../models/email';
import { sendEmail } from '../utils/email';
import { emailAdmin, getEmailCustomer } from './emailManagment'
import { createExcelFileLicense, readLicenseKeysFromExcel } from '../utils/excel';
import { writeToLog } from '../utils/writeLog';
const apiUrl = `${process.env.ENDPOINT_API}${process.env.PORT}`;
// const apiUrl = `http://localhost:3005`;
async function processSalesDoc(): Promise<void> {
    try {
          //   processCheckData(); // check data &  invio email con i clienti senza email
          const response = await axios.get(`${apiUrl}/orders/sales`);
          const items = response.data.data;

          emailAdmin();

       if (items.length === 0) {
            return items.length;
        }else{   
            
            for (const item of items) {
                const salesDoc = item.Sales_Doc;
                const oda = item.ODA;
                const cart = await callSalesDoc(salesDoc);
    
          if (cart) {
                    const pack = await getPackLicense(salesDoc);
                   
                    // Continua con la logica successiva solo se il valore di cart è presente
                if(pack.length > 0){
                   
                    const emailSend = await getEmailCustomer(salesDoc, oda);
                    if(emailSend){
                     const updateLicense = await  sendedLicense(salesDoc);
                  
                    }
                    
                }else{
                    writeToLog('non ci sono ordine da spedire ', pack.length);
                }    
                }
               
            }
            return items.length;
        }
     
    } catch (error) {
        writeToLog("Errore durante la richiesta ordini:",error);
        console.error('Errore durante l\'elaborazione degli elementi:', error);
    }
}

async function callSalesDoc(salesDoc: string): Promise<any> {
    try {
        const response = await axios.get(`${apiUrl}/orders/listSalesDoc/${salesDoc}`);
        const data = response.data.data;
let LicenseFound=0;
        for (const item of data) {
           writeToLog('callSalesDoc- License:', item.License);
            const LICENSE_KEY = await getLicense(item.License, item.Sales_Doc, item.Item);
            
            if (LICENSE_KEY !=0) {LicenseFound++;
                writeToLog('licenze trovate : - >'+item.License+' : ', LicenseFound);
            }

            
        }

        return data;
    } catch (error) {
        console.error('Errore durante il recupero dei dati:', error);
        throw error;
    }
}
async function getLicense(license: string, salesDoc: string, item: string): Promise<any> {
    try {
            const resp = await axios.get(`${apiUrl}/license/${license}`);
            const LIC_KEY = await resp.data.data.LICENSE_KEY;
            if (LIC_KEY) {
                const booked = await reserverdLicense(salesDoc, item, LIC_KEY);
            } else {
                writeToLog("al momento non ci sono le licenze a disponibilità esaurita "+LIC_KEY+" tipo: " ,license);
                return resp.data.data.length;
            }
            return LIC_KEY;
   
    } catch (error) {
        writeToLog("Errore durante la richiesta della licenza di tipo: " + license + "--", error);
        console.error('Errore durante la richiesta della licenza di tipo:', license, error);
        throw error;
    }
}
//
async function reserverdLicense(salesDoc: string, item: string, key: string): Promise<any> {
    try {
        const resp = await axios.put(`${apiUrl}/license/booking/${salesDoc}/${item}/${key}/prenotato`);
        const reserve = await resp.data; 
       return reserve;
    } catch (error) {
        writeToLog("Errore durante prenotazione della licenza "+key+"--"+salesDoc+"--",error);
        console.error('Errore durante prenotazione della licenza :', key, error);
        throw error;
    }
}
async function sendedLicense(salesDoc: string): Promise<any> {
    try {
        const keys: string[]=await readLicenseKeysFromExcel(salesDoc);

        processLicenseKeys(keys)
        .then((results) => {
            return results;
        })
        .catch((error) => {
            console.error('Errore durante agiornamento delle chiavi: di licenza:', error);
        });
     
     
       
    } catch (error) {
        writeToLog("Errore durante set invio della licenza ","--"+salesDoc+"--"+error);
        console.error('Errore durante set invio della licenza :', error);
        throw error;
    }
}
async function getPackLicense(salesDoc: string): Promise<any> {
    try {
        const resp = await axios.get(`${apiUrl}/license/pack/${salesDoc}`);
        const pack = await resp.data.data; 
        if (pack.length > 0) {
            const fileExcel = await createExcelFileLicense(pack,salesDoc);
        }
        
        
        return pack;
    } catch (error) {
        
        console.error('Errore durante creazione pack  :', salesDoc, error);
        throw error;
    }
}




async function updateLicenseApi(key:string) {
    try {
        const response = await axios.put(`${apiUrl}/license/sended/${key}/inviato`);
        writeToLog(`Chiamata API per la chiave ${key} avvenuta con successo. Risposta:`, response.data);
        return response.data;
    } catch (error) {
        writeToLog(`Errore durante la chiamata API per la chiave ${key}:`, error);
        console.error(`Errore durante la chiamata API per la chiave ${key}:`, error);
        return null;
    }
       
}

async function processLicenseKeys(licenseKeys:string[]) {
    const results = [];
    for (const key of licenseKeys) {
        const result = await updateLicenseApi(key);
        results.push(result);
    }
    return results;
}





export default processSalesDoc;
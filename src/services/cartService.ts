import axios from 'axios';
import { EmailData } from '../models/email';
import { sendEmail } from '../utils/email';
import { createExcelFileLicense, readLicenseKeysFromExcel } from '../utils/excel';
import { writeToLog } from '../utils/writeLog';
const apiUrl = `${process.env.ENDPOINTAPI}${process.env.PORT}`;
async function processSalesDoc(): Promise<void> {
    try {
          //   processCheckData(); // check data &  invio email con i clienti senza email
        const response = await axios.get(`${apiUrl}/orders/sales`);
        const items = response.data.data;   
        if (items.length === 0) {
       
            console.log('non ci sono ordini da spedire: ' + items.length);
            return items.length;
        }else{   
            
            for (const item of items) {
                const salesDoc = item.Sales_Doc;
                const oda = item.ODA;
                const cart = await callSalesDoc(salesDoc);
                console.log('ORDINE PER :', salesDoc,' numero di licenze richieste: ',cart.length); // Test del documento di vendita
                console.log('ODA PER :', oda);
                console.log('item :', item);
    
          if (cart) {
                    const pack = await getPackLicense(salesDoc);
                   
                    // Continua con la logica successiva solo se il valore di cart è presente
                if(pack.length > 0){
                   
                    const emailSend = await getEmailCustomer(salesDoc, oda);
                    console.log('callSalesDoc: ordine da spedire:', pack.length); 
                    console.log('la email spedita con :', emailSend); 
                    if(emailSend){
                     const updateLicense = await  sendedLicense(salesDoc);
                  
                        console.log('updateLicense :', updateLicense); 
                    }
                    
                }else{
                   
                    console.log('non ci sono ordine da spedire ', pack.length);
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
        writeToLog('licenze richieste da :'+salesDoc+' #', await data.length);
let LicenseFound=0;
        for (const item of data) {
        //    writeToLog('callSalesDoc- License:', item.License);
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
            writeToLog('ricerca: licenza di tipo: '+ license+" --> ",resp.data.data.length);
            if (LIC_KEY) {
                writeToLog(" - Richiesta della licenza booked " + salesDoc + "--" + item + "--" + LIC_KEY + "--" , license);
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
        writeToLog('reserverdLicense- prenotazione della licenza fatta :',salesDoc+'- '+item+'-'+ key+'-'+reserve);
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

        console.log('key: ',keys);
        processLicenseKeys(keys)
        .then((results) => {
            console.log('agiornamento delle chiavi:', results);
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
        writeToLog('pack: ',pack);
        if (pack.length > 0) {
            writeToLog("richiesta creazione file excel "+salesDoc+"--",pack.length);
            const fileExcel = await createExcelFileLicense(pack,salesDoc);
            console.log('fileExcel resp: ',fileExcel);
        }
        
        
        return pack;
    } catch (error) {
        
        console.error('Errore durante creazione pack  :', salesDoc, error);
        throw error;
    }
}
async function getEmailCustomer(salesDoc: string, oda: string): Promise<boolean> {
    try {
        const resp = await axios.get(`${apiUrl}/license/email/${salesDoc}`);
        const email = resp.data;
        const userEmail = email.data[0].email;
        const fileExcel = `${salesDoc}.xlsx`;
        
        console.log('email customer :', userEmail+'-attachement:'+fileExcel);

        const customerResp = await axios.get(`http://localhost:3002/api/customer/${oda}`);
        const customer = customerResp.data[0];

        console.log('oda :', oda);
        console.log('customer :', customer);

        const EmailcustomersResp = await axios.get(`http://localhost:3002/api/email-type/Emailcustomers`);
        const Emailcustomers = EmailcustomersResp.data.data.data;

        console.log('Emailcustomers su  getEmailCustomer: ', Emailcustomers);

        let subjectCust = '';
        let bodyCust = '';
        if (Emailcustomers && Emailcustomers.subject) {

        subjectCust = Emailcustomers.subject
        bodyCust = Emailcustomers.body
        }

        if (bodyCust.includes("cliente")) {
            bodyCust = bodyCust.replace("cliente,", `${customer.Ordinante}<br>`);
        }

        // if (bodyCust.includes(".")) {
        //     bodyCust = bodyCust.replace(".", `.<br>`);
        // }

        const emailData: EmailData = {
            recipient: `${customer.Email}`,
            subject: `${subjectCust}`,
            emailBody: `<p>${bodyCust}</p>`,
            attachment: `${fileExcel}`
        };
    
        const sendsuccess = await sendEmail(emailData);
        console.log('sendsuccess: ',sendsuccess);

        return  sendsuccess;
    } catch (error) {
        writeToLog("Errore durante la ricerca dell'email: --" + salesDoc + "--", error);
        console.error('Errore durante la ricerca dell\'email:', salesDoc, error);
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
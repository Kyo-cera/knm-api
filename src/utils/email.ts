import { EmailData } from '../models/email';
import { createExcelFileEmailsChecked } from './excel';
const axios = require('axios');
export async function sendEmail(emailData: EmailData) {
  try {
    const apiUrl = `${process.env.ENDPOINT_API}${process.env.PORT}/mail`;
    const response = await axios.post(apiUrl, emailData);
  //  console.log("email sent: result",response.data);
    return response.data.status
  } catch (error) {
    console.error(error);
  }
}



export async function processCheckData() {
  const apiUrl = `${process.env.ENDPOINT_API}${process.env.PORT}/orders/salesCheckData`;
  const response = await axios.get(apiUrl);
  const data = response.data.data;
  const error = response.data.error;
  const dataWithoutEmails: any = [];

 // console.log('Successo:', response.success,'url:',apiUrl,'response:',response.data.data);
  
  if (data && data.length > 0) {
      console.log('users senza email:',data.length);
      data.forEach((item:any, index: number) => {
       
        //  console.log(`    Email: ${item.email}`);
          
          if (!item.email) {
            //  console.log('Campo email mancante. Aggiungo l\'item al JSON senza email.');
              dataWithoutEmails.push(item);
          }
      });
      console.log('dataWithoutEmails.length '+dataWithoutEmails.length);
      if (dataWithoutEmails.length > 0) {
        const fileExcelMaked = await createExcelFileEmailsChecked(dataWithoutEmails);
        console.log('inviando email a:  :',fileExcelMaked);
        if (fileExcelMaked) {
          console.log('invio email a:  :',fileExcelMaked);
          const emailData: EmailData = {
            recipient: 'knm-licenses@dit.kyocera.com',
            subject: 'dati mancanti di questi utenti',
            emailBody: '<p>gentile custore in allegato il file excel dei clienti con mancanza di dati</p> ',
            attachment: `SalesDoc-Without-email.xlsx`
        };

        const sendsuccess = await sendEmail(emailData);
        console.log('email customer senza dati inviata con :',sendsuccess);
        }
      }
  } else {
      console.log('Nessun dato presente.');
  }

  if (error) {
      console.log('Errore:', error);
  }
}





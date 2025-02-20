const fs = require('fs');
import dotenv from 'dotenv';
import { writeToLog } from './writeLog';
dotenv.config();
const ExcelJS = require('exceljs');
const outputPath: string =`${process.env.FILES}`;
export async function createExcelFileLicense(jsonData: any,id: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dati');
    const fileExcel=outputPath+id+'.xlsx'

    // Aggiungi intestazioni
    worksheet.addRow(['Element', 'LICENSE_KEY', 'Sales_Doc', 'Item']);

    // Aggiungi dati dal JSON
    jsonData.forEach((data: any) => {
        const { Element, LICENSE_KEY, Sales_Doc, Item } = data;
        writeToLog('Element:'+ Element+ 'LICENSE_KEY:'+ LICENSE_KEY+ 'Sales_Doc:'+ Sales_Doc+ 'Item:', Item);
        worksheet.addRow([Element, LICENSE_KEY, Sales_Doc, Item]);
    });

    // Salva il file Excel dopo aver aggiunto tutte le righe
    workbook.xlsx.writeFile(fileExcel)
        .then(() => {
            writeToLog('File Excel creato con successo:', fileExcel);
        })
        .catch((error: any) => {
            writeToLog('Errore durante la creazione del file Excel:', error);
            console.error('Errore durante la creazione del file Excel:', error);
        });
}
export async function createExcelFileEmailsChecked(jsonData: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dati');
    const fileExcel=outputPath+'SalesDoc-Without-email.xlsx'
    
    // Aggiungi intestazioni
    worksheet.addRow(['Sales_Doc', 'Nome Cognome / CF', 'email', 'ODA']);

    // Aggiungi dati dal JSON
    jsonData.forEach((data: any) => {
        const { Sales_Doc, Nome_Cognome_CF, email, ODA } = data;
      //  console.log( 'emai:', email, 'Sales_Doc:', Sales_Doc, 'ODA:', ODA);
        worksheet.addRow([Sales_Doc, Nome_Cognome_CF, email, ODA]);
    });

    // Salva il file Excel dopo aver aggiunto tutte le righe
    workbook.xlsx.writeFile(fileExcel) 
        .then(() => {
            writeToLog('File Excel customer senza email creato con successo:', fileExcel);
            
         
        })
        .catch((error: any) => {
            writeToLog('Errore durante la creazione del file Excel:', error);
            console.error('Errore durante la creazione del file Excel:', error);
           
        });
        return true
      
}

async function writeFileExcel(fileLicenses: string) {

    
}



export async function readLicenseKeysFromExcel(fileLicenses: string) {
    const workbook = new ExcelJS.Workbook();
    
    try {
        await workbook.xlsx.readFile(outputPath + fileLicenses + '.xlsx');
        const worksheet = workbook.getWorksheet('Dati');
        const licenseKeys :any = [];

        // Trova l'indice della colonna 'LICENSE_KEY'
        const keyColumnIndex = worksheet.getRow(1).values.findIndex((value: string)  => value === 'LICENSE_KEY');

        if (keyColumnIndex === -1) {
            console.error('Colonna LICENSE_KEY non trovata nel foglio Excel.');
            return [];
        }

        // Itera sulle righe e inserisce i valori della colonna 'LICENSE_KEY' in licenseKeys
        worksheet.eachRow((row: any, rowNumber: number) => {
            if (rowNumber > 1) { // Ignora la riga delle intestazioni
                const licenseKey = row.getCell(keyColumnIndex).value;
                if (licenseKey) {
                    licenseKeys.push(licenseKey);
                }
            }
        });

        return licenseKeys;
    } catch (error) {
        console.error('Errore durante la lettura del file Excel:', error);
        return [];
    }
}

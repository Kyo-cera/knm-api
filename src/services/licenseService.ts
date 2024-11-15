import { License } from 'models/license';
import db from '../database/database';
import { IResult } from 'mssql';
const csv = require('csv-parser');

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const axios = require('axios');
const filePath = '/files/'; 
const inputFolder = filePath+'licenze';
const outputFolder = filePath+'licenze/csv';
const errorFolder = filePath+'licenze/error';
const doneFolder = filePath+'licenze/done';
const apiUrl = 'http://localhost:3005/';


class LicenseService {
    async getAllLicense(): Promise<License[]> {
        const license = await db.query(`SELECT * FROM Licenze`);
        return license as License[];
    }

    async postLicence(licenseData: License): Promise<License[]> {
        const {
            fatherComponent,
            element,
            knmItem,
            licenseKey,
            STATO,
            salesDoc,
            item,
            timestamp,
        } = licenseData;
    
        try {
            const result = await db.query(`
                INSERT INTO [dbo].[Licenze] 
                (FatherComponent, Element, KNM_ITEM, LICENSE_KEY, STATO, Sales_Doc, Item, Timestamp)
                VALUES
                (
                    '${fatherComponent || ''}', 
                    '${element || ''}', 
                    '${knmItem || ''}', 
                    '${licenseKey || ''}', 
                    '${STATO || ''}', 
                    '${salesDoc || ''}', 
                    '${item || ''}', 
                    ${timestamp ? `'${new Date(timestamp).toISOString()}'` : 'CURRENT_TIMESTAMP'}
                )
            `);
    
            console.log(`Dati inseriti correttamente per l'item ${knmItem}`, result);
    
            return [{
                fatherComponent,
                element,
                knmItem,
                licenseKey,
                STATO,
                salesDoc,
                item,
                timestamp,
            }];
        } catch (error: any) {
            console.error('Errore nell\'inserimento dei dati nel DB:', error.message);
            throw new Error('Errore nel salvataggio dei dati nel database');
        }
    }
    
    
    async getLicenseById(id: string): Promise<License | null> {
        const license = await db.query(`SELECT * FROM Licenze WHERE LICENSE_KEY = '${id}'`);
        if (Array.isArray(license) && license.length > 0) {
            return license[0] as License;
        }
        return null;
    }
    async getLicensePack(salesDoc: string): Promise<License | null> {
        const licenses = await db.query(`Select [Element],[LICENSE_KEY],[Sales_Doc],[Item],[stato] from Licenze where sales_doc = '${salesDoc}'`);
        if (Array.isArray(licenses) && licenses.length > 0) {
            return licenses as License;
        }
        return [] as License;
    }
    async getLicenseByElement(element: string): Promise<License | null> {
        const license = await db.query(`SELECT Top 1 [FatherComponent] ,[Element] ,[KNM_ITEM] ,[LICENSE_KEY] ,[STATO] ,[Sales_Doc],[Item] ,[Timestamp]  ,[prog_Item] = convert(int,rtrim(ltrim(right([KNM_ITEM],3-(CHARINDEX(' ', right([KNM_ITEM],3))))))) FROM [LKDISPATCH].[dbo].[Licenze]  where [Element] = '${element}' and  stato is null order by [FatherComponent] asc , element asc, convert(int,rtrim(ltrim(right([KNM_ITEM],3-(CHARINDEX(' ', right([KNM_ITEM],3))))))) asc`);
        if (Array.isArray(license) && license.length > 0) {
            return license[0] as License;
        }else{
        return [] as License;
    }
}
    //getEmail 
    async getEmailOrdering(salesDoc: string): Promise<License | null> {
        const email = await db.query(`SELECT   [Sales_Doc] ,[Nome_Cognome] ,[CF] ,[email] ,[ODA]   FROM [LKDISPATCH].[dbo].[Ordini_con_Ordinanti]   where sales_doc = '${salesDoc}'`);
        if (Array.isArray(email) && email.length > 0) {
            return email as License;
        }
        return null;
    }
   



    async putLicense(salesDoc: string, item: string, key: string, stato: string): Promise<License | null> {
        let result;
        
            result = await db.query(`UPDATE licenze SET stato = '${stato}', sales_doc = '${salesDoc}', Item = '${item}', Timestamp = GETDATE() WHERE License_key = '${key}'`);
            let lic = await this.getLicenseById(key); 
            const state = await lic?.STATO
            console.log('result:', lic);
        
        if (state && state!='') {
            console.log('ok result:', state);
            return await this.getLicenseById(key);
        }else{
            console.log('ko ', state);
            return null;
        }
        
       
    }
    //putLicenseSended
    async putLicenseSended( key: string, stato: string): Promise<License | null> {
        let result;
        
            result = await db.query(`UPDATE licenze SET stato = '${stato}',  Timestamp = GETDATE() WHERE License_key = '${key}'`);
            let lic = await this.getLicenseById(key); 
            const state = await lic?.STATO
            console.log('result:', lic);
        
        if (state && state!='') {
            console.log('ok result:', state);
            return await this.getLicenseById(key);
        }else{
            console.log('ko ', state);
            return null;
        }
        
       
    }

    async postLicense(data: License): Promise<License | null> {
        const result = await db.query(`INSERT INTO Products (name, price) VALUES (@name, @price)`);
      
        return null;
    }

    async inKnmETerminal(rowData: any): Promise<void> {
        try {
            if (!rowData.licenseKey || rowData.licenseKey.trim() === '') {
                console.log(`Skipping record with empty LICENSE_KEY:`, rowData);
                return; 
            }
    
            const licenseData = {
                fatherComponent: rowData.FatherComponent,
                element: rowData.Element,
                knmItem: rowData.item,
                licenseKey: rowData.licenseKey,
            };
    
            console.log('Invio dei dati alla API per inserimento...', licenseData);
    
            const response = await axios.post(`${apiUrl}license/postLicenza`, licenseData);
    
            console.log('Licenza inserita correttamente tramite API:', response.data);
        } catch (error: any) {
            console.error('Errore nell\'invio dei dati alla API:', error);
            console.error('Dettagli errore:', error.message);
            throw new Error(error.message); 
        }
    }
    


    async getTypeLicenze(): Promise<any[]> {
        try {
            const query = 'SELECT * FROM FattehrComponewntList';
            const results = await db.query(query);
    
            const recordset: any[] = results;
    
            console.log('Totale record trovati:', recordset.length);
    
            for (const record of recordset) {
                console.log('Elaborando record:', record);
                await this.readCSVAndCallAPI(record);
            }
    
            return recordset;
        } catch (error) {
            console.error('Errore nella query al database:', error);
            throw new Error('Errore durante il fetch dei dati dal database');
        }
    }
    
    
    
    

    async readCSVAndCallAPI(record: any): Promise<void> {
        const startingString = 'KNM';
        const file = `${record.Element}.csv`;
        const csvFilePath = path.join(outputFolder, file);

        console.log('Tentativo di lettura del file CSV:', csvFilePath);

        const tableDB = this.searchTable(record.Element);
        const rows: any[] = [];

        try {
            await new Promise<void>((resolve, reject) => {
                fs.createReadStream(csvFilePath)
                    .pipe(csv())
                    .on('data', (row: any) => {
                        console.log('Riga CSV:', row);
                        if (row['MyQ ITEM']?.startsWith(startingString)) {
                            rows.push(row);
                        }
                    })
                    .on('end', async () => {
                        console.log('Lettura CSV completata, righe trovate:', rows.length); 

                        for (const row of rows) {
                            const item = row['MyQ ITEM'];
                            const licenseKey = row['LICENSE KEY'];
                            const { FatherComponent, Element } = record;

                            try {
                                console.log(`Chiamata a inKnmETerminal con item: ${item}, licenseKey: ${licenseKey}`);
                                await this.inKnmETerminal({
                                    FatherComponent,
                                    Element,
                                    item,
                                    licenseKey,
                                    tableDB,
                                });
                                console.log(`API call successful for item: ${item}`);
                            } catch (apiError) {
                                console.error(`API call error for item ${item}:`, (apiError as Error).message);
                            }
                        }

                        this.moveFileToProcessedFolder(csvFilePath);
                        resolve();
                    })
                    .on('error', (error: any) => reject(error));
            });
        } catch (error) {
            console.error('Error processing CSV:', error);
        }
    }

    searchTable(table: string): string {
        const tableMap: { [key: string]: string } = {
            'KNM E-Terminal': 'KNM_E-Terminal',
            'KNM Pro': 'KNM_PRO',
            'SW MNT E-Terminal +2Year': 'SW_MNT_E-Terminal_2Year',
            'SW MNT E-Terminal +3Year': 'SW_MNT_E-Terminal_3Year',
            'SW MNT E-Terminal +4Year': 'SW_MNT_E-Terminal_4Year',
            'SW MNT Pro +2Year': 'SW_MNT_Pro_2Year',
            'SW MNT Pro +3Year': 'SW_MNT_Pro_3Year',
            'SW MNT Pro +4Year': 'SW_MNT_Pro_4Year',
        };
        return tableMap[table] || 'Table not found';
    }

    moveFileToProcessedFolder(filePath: string) {
        const directoryPath = path.dirname(filePath);
        const fileNameWithoutExtension = path.basename(filePath, '.csv');
        const processedFolderPath = path.join(directoryPath, fileNameWithoutExtension, 'processed');
    
        if (!fs.existsSync(processedFolderPath)) {
            fs.mkdirSync(processedFolderPath, { recursive: true });
        }
    
        const destination = path.join(processedFolderPath, path.basename(filePath));
        
        fs.renameSync(filePath, destination);
        console.log(`File moved to ${destination}`);
    }
    
    


    async importLicenses(): Promise<License[]> {
        const files = fs.readdirSync(inputFolder);
        let excelFilesCount = 0;
    
        for (const fileName of files) {
            const excelFilePath = path.join(inputFolder, fileName);
            try {
                if (path.extname(fileName) === '.xlsx' && fileName !== 'Consips2 licenses SO.xlsx') {
                    excelFilesCount++;
                    const workbook = XLSX.readFile(excelFilePath);
                    console.log(`Fogli disponibili nel file: ${workbook.SheetNames}`);

                    workbook.SheetNames.forEach((sheetName: string) => {
                        console.log(`Elaborando foglio: ${sheetName}`);
                        const worksheet = workbook.Sheets[sheetName];
                    
                        const range = XLSX.utils.decode_range(worksheet['!ref']); 
                        if (range.e.r > range.s.r && range.e.c > range.s.c) {
                            const csv = XLSX.utils.sheet_to_csv(worksheet);
                            const csvFilePath = path.join(outputFolder, `${sheetName}.csv`);
                            fs.writeFileSync(csvFilePath, csv);
                            console.log(`Foglio ${sheetName} convertito in CSV`);
                        } else {
                            console.log(`Foglio ${sheetName} vuoto o non valido, salto la conversione.`);
                        }
                    });
                    
                    fs.renameSync(excelFilePath, path.join(doneFolder, `${Date.now()}_${fileName}`));
                }
            } catch (error) {
                fs.renameSync(excelFilePath, path.join(errorFolder, `${Date.now()}_${fileName}`));
                console.error('Error converting Excel file:', error);
            }
        }
    
        if (excelFilesCount > 0) {
            console.log(`Excel files processed: ${excelFilesCount}`);
        } else {
            console.log('No Excel files found.');
        }

        if (excelFilesCount >= 1) {
            console.log(`Numero di file Excel trovati: ${excelFilesCount}`);
            
            try {
                const response = await this.getTypeLicenze();
                
                if (response && response.length > 0) {
                    console.log(`Andata a buon fine la chiamata al orderslist. Numero di record: ${response.length}`);
                    
                    for (const record of response) {
                        console.log('Record elaborato:', record);
                    }
                } else {
                    console.log('Spiacente, nessun record trovato nel database.');
                }
            } catch (error) {
                console.error('Errore durante la chiamata a getTypeLicenze:', error);
            }
        } else {
            console.log('Spiacente, non sono stati trovati file Excel.');
        }
    
        return await this.getAllLicense();
    }
}

export default new LicenseService();
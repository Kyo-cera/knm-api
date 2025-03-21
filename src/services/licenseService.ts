import { License } from 'models/license';
import db from '../database/database';
import { IResult } from 'mssql';
import { writeToLog } from '../utils/writeLog';
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
const apiUrl = `${process.env.ENDPOINT_API}${process.env.PORT}`;


class LicenseService {
    private files: string[];

    constructor() {
        this.files = []; 
    }
    async getAllLicense(): Promise<License[]> {
        const license = await db.query(`SELECT * FROM dbo.licenze;`);
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
                INSERT INTO dbo.licenze 
                ("FatherComponent", "Element", "KNM_ITEM", "LICENSE_KEY", "STATO", "Sales_Doc", "Item", "Timestamp")
                VALUES
                ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_TIMESTAMP));
            `, [
                fatherComponent || null,
                element || null,
                knmItem || null,
                licenseKey || null,
                STATO || null,
                salesDoc || null,
                item || null,
                timestamp || null 
            ]);
            
    
            writeToLog(`Dati inseriti correttamente per l'item ${knmItem}`, result);
    
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
        const license = await db.query(`SELECT * FROM dbo.licenze WHERE "LICENSE_KEY" = '${id}'`);
        if (Array.isArray(license) && license.length > 0) {
            return license[0] as License;
        }
        return null;
    }

    async getLicenseBySalesDoc(salesDoc: string): Promise<License | null> {
        const license = await db.query(`SELECT * FROM dbo.licenze WHERE "Sales_Doc" = '${salesDoc}'`);
        if (Array.isArray(license) && license.length > 0) {
            return license[0] as License;
        }
        return null;
    }

    async getLicensePack(salesDoc: string): Promise<License | null> {
        const licenses = await db.query(`
            SELECT "Element", "LICENSE_KEY", "Sales_Doc", "Item", "STATO" 
            FROM dbo.licenze 
            WHERE "Sales_Doc" = '${salesDoc}'`);
        if (Array.isArray(licenses) && licenses.length > 0) {
            return licenses as License;
        }
        return [] as License;
    }
    async getLicenseByElement(element: string): Promise<License | null> {
        const license = await db.query(`
       SELECT 
    *, 
    CASE 
        WHEN RIGHT("KNM_ITEM", 3 - POSITION(' ' IN REVERSE(RIGHT("KNM_ITEM", 3)))) ~ '^\d+$'
        THEN CAST(TRIM(BOTH ' ' FROM RIGHT("KNM_ITEM", 3 - POSITION(' ' IN REVERSE(RIGHT("KNM_ITEM", 3))))) AS INTEGER)
        ELSE NULL
    END AS "prog_Item"
FROM 
    dbo.licenze
WHERE 
    "Element" = '${element}'
    AND ("STATO" IS NULL OR "STATO" = '')
ORDER BY 
    "FatherComponent" ASC, 
    "Element" ASC, 
    "prog_Item" ASC
LIMIT 1;

`);
        if (Array.isArray(license) && license.length > 0) {
            return license[0] as License;
        }else{
        return [] as License;
    }
}
    //getEmail 
    async getEmailOrdering(salesDoc: string): Promise<License | null> {
        const email = await db.query(`
            SELECT 
                "Sales_Doc", 
                nome_cognome, 
                cf, 
                "Email", 
                "ODA"
            FROM 
                dbo.ordini_con_Ordinanti
            WHERE 
                "Sales_Doc" = '${salesDoc}';
            `);
        if (Array.isArray(email) && email.length > 0) {
            return email as License;
        }
        return null;
    }
   



    async putLicense(salesDoc: string, item: string, key: string, stato: string): Promise<License | null> {
        let result;
        
            result = await db.query(`
                UPDATE dbo.licenze 
                SET "STATO" = '${stato}', 
                    "Sales_Doc" = '${salesDoc}', 
                    "Item" = '${item}', 
                    "Timestamp" = CURRENT_TIMESTAMP 
                WHERE "LICENSE_KEY" = '${key}';
                `);
            let lic = await this.getLicenseById(key); 
            const state = await lic?.STATO
            writeToLog('result:', lic);
        
        if (state && state!='') {
            writeToLog('ok result:', state);
            return await this.getLicenseById(key);
        }else{
            writeToLog('ko ', state);
            return null;
        }
        
       
    }
    //putLicenseSended
    async putLicenseSended( key: string, stato: string): Promise<License | null> {
        let result;
        
            result = await db.query(`
                UPDATE dbo.licenze 
                SET "STATO" = '${stato}',  
                    "Timestamp" = CURRENT_TIMESTAMP
                WHERE "LICENSE_KEY" = '${key}';
                `);
            let lic = await this.getLicenseById(key); 
            const state = await lic?.STATO
            writeToLog('result:', lic);
        
        if (state && state!='') {
            writeToLog('ok result:', state);
            return await this.getLicenseById(key);
        }else{
            writeToLog('ko ', state);
            return null;
        }
        
       
    }

    async postLicense(data: License): Promise<License | null> {
        const result = await db.query(`
            INSERT INTO "Products" (name, price) 
            VALUES (@name, @price);
            `);
        return null;
    }

    async inKnmETerminal(rowData: any): Promise<{ isSuccess: boolean, isDuplicate: boolean }> {
        try {
            if (!rowData.licenseKey || rowData.licenseKey.trim() === '') {
                writeToLog(`Skipping record with empty LICENSE_KEY:`, rowData);
                return { isSuccess: false, isDuplicate: false }; 
            }

            // Verifica duplicati
            const isDuplicate = await this.checkLicenseDuplicate(rowData.licenseKey);
            if (isDuplicate) {
                writeToLog(`Duplicate license found for key: rowData.licenseKey`,rowData.licenseKey);
                return { isSuccess: false, isDuplicate: true };
            }

            const licenseData = {
                fatherComponent: rowData.FatherComponent,
                element: rowData.Element,
                knmItem: rowData.item,
                licenseKey: rowData.licenseKey,
            };

            writeToLog('Inserting new license...', licenseData);
            const response = await axios.post(`${apiUrl}/license/postLicence`, licenseData);
            writeToLog('License successfully inserted:', response.data);
            
            return { isSuccess: true, isDuplicate: false };
        } catch (error: any) {
            console.error('Error sending data to API:', error);
            console.error('Error details:', error.message);
            throw new Error(error.message);
        }
    }
    
    async checkLicenseDuplicate(licenseKey: string): Promise<boolean> {
        try {
            const query = `
                SELECT COUNT(*) as count 
                FROM dbo.licenze 
                WHERE "LICENSE_KEY" = $1;
            `;
            const result = await db.query(query, [licenseKey]);
            return result[0].count > 0;
        } catch (error) {
            console.error('Error checking for duplicate license:', error);
            return true; // In caso di errore, meglio prevenire inserimenti duplicati
        }
    }

    async getTypeLicenze(): Promise<any> {
        try {
            const query = 'SELECT * FROM dbo.FattehrComponewntList';
            const results = await db.query(query);
            const recordset: any[] = results;

            writeToLog('Totale record trovati:', recordset.length);

            // Rimuoviamo il loop qui e ritorniamo solo il recordset
            return recordset;

        } catch (error) {
            console.error('Errore nella query al database:', error);
            throw new Error('Errore durante il fetch dei dati dal database');
        }
    }
    
    async ifExixsCSV(outputFolder: string, file: string): Promise<boolean> {
        try {
            const filePath = path.join(outputFolder, file);
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        } catch (error) {
            return false;
        }
    }    
    
    async readCSVAndCallAPI(record: any): Promise<any> {
        const startingString = 'KNM';
        const file = `${record.Element}.csv`;
        const errorMessage = `File non trovato: ${file}`;
    
        // Verifica se il file esiste
        const fileExists = await this.ifExixsCSV(outputFolder, file);
        if (!fileExists) {
            // Aggiungi il messaggio solo se non è già presente
            if (!this.files.includes(errorMessage)) {
                this.files.push(errorMessage);
                writeToLog(`File non trovato: `, file);
                console.error(errorMessage);
            }
            return;
        }
    
        const csvFilePath = path.join(outputFolder, file);
        writeToLog('csvFilePath: ', csvFilePath);
        writeToLog('Tentativo di lettura del file CSV:', csvFilePath);
    
        const tableDB = this.searchTable(record.Element);
        const rows: any[] = [];
    
        const newLicenses: any[] = [];
        let duplicateCount = 0;
    
        try {
            await new Promise<void>((resolve, reject) => {
                fs.createReadStream(csvFilePath)
                    .pipe(csv())
                    .on('data', (row: any) => {
                        writeToLog('Riga CSV:', row);
                        if (row['MyQ ITEM']?.startsWith(startingString)) {
                            rows.push(row);
                        }
                    })
                    .on('end', async () => {
                        writeToLog('Lettura CSV completata, righe trovate:', rows.length);
    
                        for (const row of rows) {
                            const item = row['MyQ ITEM'];
                            const licenseKey = row['LICENSE KEY'];
                            const { FatherComponent, Element } = record;
    
                            try {
                                writeToLog(`Chiamata a inKnmETerminal con item: ${item}, licenseKey: ${licenseKey}`, item);
                                const result = await this.inKnmETerminal({
                                    FatherComponent,
                                    Element,
                                    item,
                                    licenseKey,
                                    tableDB,
                                });

                                if (result.isDuplicate) {
                                    duplicateCount++;
                                } else if (result.isSuccess) {
                                    newLicenses.push({
                                        FatherComponent,
                                        Element,
                                        item,
                                        licenseKey
                                    });
                                }

                            } catch (apiError) {
                                console.error(`API call error for item ${item}:`, (apiError as Error).message);
                            }
                        }
    
                        this.moveFileToProcessedFolder(csvFilePath);
                        resolve();
                    })
                    .on('error', (error: any) => reject(error));
            });

            return { newLicenses, duplicateCount };
        } catch (error) {
            console.error('Error processing CSV:', error);
            throw error;
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
        writeToLog(`File moved to `, destination);
    }
    
    async importLicenses(): Promise<any> {
        this.files = [];
        const files = fs.readdirSync(inputFolder);
        let excelFilesCount = 0;
        let totalNewLicenses: any[] = [];
        let totalDuplicates = 0;
    
        // Prima convertiamo tutti i file Excel in CSV
        for (const fileName of files) {
            const excelFilePath = path.join(inputFolder, fileName);
            try {
                if (path.extname(fileName) === '.xlsx' && fileName !== 'Consips2 licenses SO.xlsx') {
                    excelFilesCount++;
                    const workbook = XLSX.readFile(excelFilePath);
                    writeToLog(`Fogli disponibili nel file: `, workbook.SheetNames);
    
                    for (const sheetName of workbook.SheetNames) {
                        writeToLog(`Elaborando foglio: `, sheetName);
                        const worksheet = workbook.Sheets[sheetName];
    
                        const range = XLSX.utils.decode_range(worksheet['!ref']);
                        if (range.e.r > range.s.r && range.e.c > range.s.c) {
                            const csv = XLSX.utils.sheet_to_csv(worksheet);
                            const csvFilePath = path.join(outputFolder, `${sheetName}.csv`);
                            writeToLog("csvFilePath ", csvFilePath);
                            await fs.promises.writeFile(csvFilePath, csv);
                            writeToLog(`Foglio ${sheetName} convertito in CSV`, sheetName);
                        }
                    }
    
                    await fs.promises.rename(excelFilePath, path.join(doneFolder, `${Date.now()}_${fileName}`));
                }
            } catch (error) {
                await fs.promises.rename(excelFilePath, path.join(errorFolder, `${Date.now()}_${fileName}`));
                console.error('Error converting Excel file:', error);
            }
        }
    
        if (excelFilesCount >= 1) {
            try {
                // Otteniamo la lista dei tipi di licenze
                const licenseTypes = await this.getTypeLicenze();
                writeToLog('License types found:', licenseTypes);

                if (licenseTypes && licenseTypes.length > 0) {
                    // Processiamo ogni tipo di licenza
                    for (const record of licenseTypes) {
                        writeToLog('Processing license type:', record);
                        const result = await this.readCSVAndCallAPI(record);
                        
                        if (result && result.newLicenses) {
                            writeToLog(`Found ${result.newLicenses.length} new licenses and ${result.duplicateCount} duplicates for `, record.Element);
                            totalNewLicenses = [...totalNewLicenses, ...result.newLicenses];
                            totalDuplicates += result.duplicateCount;
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing licenses:', error);
            }
        }
    
        writeToLog(`Total new licenses: ${totalNewLicenses.length}, Total duplicates: `, totalDuplicates);
        return { 
            licenses: totalNewLicenses, 
            duplicateCount: totalDuplicates,
            files: this.files 
        };
    }
}

export default new LicenseService();
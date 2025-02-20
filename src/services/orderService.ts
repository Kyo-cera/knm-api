import { Order } from 'models/order';
import db from '../database/database';
import { writeToLog } from '../utils/writeLog';
const XLSX = require('xlsx');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const fileName = process.env.PATH_ORDERS; 
const sheetName = '2) Consip2 licenses pivot';
const urlApi = `${process.env.ENDPOINT_API}${process.env.PORT}`;
const sheetName2 = '1) Consip2 licenses';
const col = 0;
class OrderService {
    async getAllOrders(): Promise<Order[]> {
        const orders = await db.query(`SELECT * FROM dbo.orders`);
        return orders as Order[];
    }
    async getAllSalesOrders(): Promise<Order[]> {
    const sales = await db.query(`
        SELECT DISTINCT a."Sales_Doc", b."ODA"
        FROM dbo.orders a
        INNER JOIN dbo.ordini_con_ordinanti b
            ON a."Sales_Doc" = b."Sales_Doc"
        WHERE a."DlBl" = ''
            AND a."Sales_Doc" || '-' || a."Item" NOT IN (
                SELECT DISTINCT b."Sales_Doc" || '-' || b."Item"
                FROM dbo.licenze b
                WHERE b."Sales_Doc" <> ''
            )
        ORDER BY a."Sales_Doc" ASC;
    `);
    return sales as Order[];
}


async getOrderByItemSalesDoc(salesDoc: string): Promise<Order[] | null> {
    writeToLog("salesDoc:", salesDoc);
    const orders = await db.query(`
        SELECT *
        FROM dbo.orders
        WHERE "Sales_Doc" = '$1';
    `, [salesDoc]); 

    if (Array.isArray(orders) && orders.length > 0) {
        return orders;
    }
    return null;
}


async getOrdersWithoutDestination(): Promise<Order[]> {
    const orderCheckAdress = await db.query(`
        SELECT "Sales_Doc", 
               nome_cognome || ' / CF: ' || cf AS "Nome Cognome / CF:", 
               "Email", 
               "ODA" 
        FROM dbo.ordini_con_Ordinanti 
        WHERE nome_cognome IN ('') 
           OR "Email" IN ('') 
           OR "ODA" IN ('') 
        
        UNION 
        
        SELECT DISTINCT a."Sales_Doc", 
                        '' AS "Nome Cognome / CF:", 
                        '' AS "email", 
                        '' AS "ODA"
        FROM dbo.orders a 
        WHERE a."DlBl" = '' 
          AND a."Sales_Doc" NOT IN (
              SELECT DISTINCT b."Sales_Doc"
              FROM dbo.licenze b
              WHERE b."Sales_Doc" <> ''
          ) 
          AND a."Sales_Doc" NOT IN (
              SELECT "Sales_Doc"
              FROM dbo.ordini_con_ordinanti
          )
        ORDER BY "Sales_Doc" ASC;
    `);
    return orderCheckAdress as Order[];
}


    //getgetCheckDibi
    async getCheckDibi(salesDoc: string, item: string, dibi: string): Promise<Order[]> {
        const orderCheckAdress = await db.query(`
            SELECT * 
            FROM dbo.Orders_Update($1, $2, $3);
        `, [salesDoc, item, dibi]);
    
        return orderCheckAdress as Order[];
    }
    
// list order combination pack
async getOrderListxDoc(salesDoc: string): Promise<Order | null> {
    const ordersList = await db.query(`
        SELECT * 
        FROM dbo.orders a
        INNER JOIN dbo.combinations b 
            ON a."Component" = b."Item_Material_Number"
        WHERE a."Sales_Doc" = '${salesDoc}';
    `);

    if (Array.isArray(ordersList) && ordersList.length > 0) {
        return ordersList as Order;
    }
    return null;
}



    async importOrders(): Promise<{orders: Order[], duplicateCount: number}> {
        try {
            await fs.access(fileName);
        } catch (error) {
            console.error(`Il file non esiste: ${fileName}`);
            return { orders: [], duplicateCount: 0 };
        }
    
        const workbook = XLSX.readFile(fileName);
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const newOrders: Order[] = [];
        let duplicateCount = 0;
        let processedCount = 0;
    
        for (let row = 8; row <= range.e.r; row++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
            if (cell && cell.v && typeof cell.v === 'string') {
                const value = cell.v.trim();
                const isNumeric = !isNaN(value.replace(/[^0-9]/g, ''));
                if (isNumeric && value.indexOf(' ') === -1) {
                    const result = await readSalesDoc(workbook, sheetName2, value);
                    if (result.data && result.data.length > 0) {
                        processedCount++;
                        duplicateCount += result.duplicates;
                        if (!result.duplicates) {
                            result.data.forEach(orderData => {
                                newOrders.push({
                                    valueContrNo: orderData.valueContrNo,
                                    salesDoc: orderData.salesDoc,
                                    item: orderData.item,
                                    customer: orderData.customer,
                                    name: orderData.name,
                                    material: orderData.material,
                                    component: orderData.component,
                                    materialDescription: orderData.materialDescription,
                                    language: orderData.language,
                                    dlBl: orderData.dlBl,
                                    purchaseOrderNr: orderData.purchaseOrderNr
                                } as Order);
                            });
                        }
                    }
                }
            }
        }
    
        writeToLog(`Ordini totali processati: `, processedCount);
        writeToLog(`Ordini effettivamente importati: `, newOrders.length);
        writeToLog(`Duplicati trovati: `, duplicateCount);
    
        try {
            await moveFileToProcessedFolder(fileName, path, fs);
            const responseCheck = await axios.get(`${urlApi}/customer/import/checkCustomer`);
            writeToLog('----> checkcustomers', responseCheck.status);
        } catch (error) {
            console.error('Errore nello spostamento del file:', error);
        }

        return { 
            orders: newOrders,
            duplicateCount: duplicateCount 
        };
    }

}

async function readSalesDoc(workbook:any, sheetName:any, salesDoc:any) {
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const data: {
        valueContrNo: any;
        salesDoc: any;
        item: any;
        customer: any;
        name: any;
        material: any;
        component: any;
        materialDescription: any;
        language: string;
        dlBl: string;
        purchaseOrderNr: any;
    }[] = [];
    
    let salesDocColumnIndex = -1;

    for (let col = 0; col <= range.e.c; col++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
        if (cell && cell.v && cell.v.trim() === "Sales Doc.") {
            salesDocColumnIndex = col;
            break;
        }
    }

    if (salesDocColumnIndex === -1) {
        writeToLog("Colonna 'Sales Doc' non trovata.", salesDocColumnIndex);
        return { data, duplicates: 0 };
    }

    for (let row = 1; row <= range.e.r; row++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: salesDocColumnIndex })];
        if (cell && cell.v && cell.v.trim() === salesDoc) {
            const columns = [];
            for (let c = 0; c <= range.e.c; c++) {
                const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: c })];
                columns.push(cell ? cell.v : undefined);
            }
            const rowData = {
                valueContrNo: columns[7],
                salesDoc: columns[3],
                item: columns[4],
                customer: columns[15],
                name: columns[16],
                material: columns[7],
                component: columns[0],
                materialDescription: columns[1],
                language: 'EN',
                dlBl: '',
                purchaseOrderNr: columns[5]
            };
            data.push(rowData);
        }
    }

    if (data.length > 0) {
        const duplicates = await inOrders(data);
        if (duplicates > 0) {
            return { data, duplicates };
        }
    }

    return { data, duplicates: 0 };
}

function moveFileToProcessedFolder(filePath:any,path:any,fs:any) {
  const  dir='/files/';
  const processedFolderPath = dir+'processed';
    const fileName = path.basename(filePath);
    const timestamp = Date.now();
    const newFileName = `${timestamp}-${fileName}`;
    const processedFilePath = path.join(processedFolderPath, newFileName);
  
    fs.rename(filePath, processedFilePath, (err:any) => {
      if (err) {
        console.error(`Errore durante il rinominare del file -${fileName} :`, err);
      } else {
        writeToLog(`File ${timestamp}-${fileName}  rinominato con il timestamp e spostato nella cartella di elaborazione con successo`, timestamp);
      }
    });
  }


  async function getOrdesCheck(rowData: any) {
    try {
        const query = `
            SELECT COUNT(*) as count 
            FROM dbo.orders 
            WHERE "Sales_Doc" = $1 
            AND "Item" = $2 
            AND "Material_Description" = $3;
        `;
        const values = [
            rowData.salesDoc,
            rowData.item,
            rowData.materialDescription
        ];
        
        const results = await db.query(query, values);
        return results[0].count > 0;  // Ritorna true se esiste almeno un record
        
    } catch (error) {
        console.error('Errore durante il controllo dell\'item nel database:', error);
        return true; // In caso di errore, meglio prevenire inserimenti duplicati
    }
}

async function inOrders(data: any) {
    try {
        const rowsData = data;
        let duplicateCount = 0;
        const duplicateItems = [];

        // Verifica tutti i duplicati prima di procedere con l'inserimento
        for (const rowData of rowsData) {
            const isDuplicate = await getOrdesCheck(rowData);
            if (isDuplicate) {
                duplicateCount++;
                duplicateItems.push(rowData);
                writeToLog(`Duplicato trovato per Sales_Doc: ${rowData.salesDoc}, Item: `, rowData.item);
            }
        }

        if (duplicateItems.length > 0) {
            writeToLog(`Trovati ${duplicateItems.length} duplicati, inserimento annullato`, duplicateItems.length);
            return duplicateCount;
        }

        // Se non ci sono duplicati, procedi con l'inserimento
        for (const rowData of rowsData) {
            const query = `
                INSERT INTO dbo.orders 
                ("Value_contr_no", "Sales_Doc", "Item", "Customer", "name", "Material", "Component", "Material_Description", "Language", "DlBl", "Timestamp", "Purchase_order_nr")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, $11);
            `;
            const values = [
                rowData.valueContrNo,
                rowData.salesDoc,
                rowData.item,
                rowData.customer,
                rimuoviApici(rowData.name),
                rowData.material,
                rowData.component,
                rowData.materialDescription,
                rowData.language,
                rowData.dlBl,
                rowData.purchaseOrderNr
            ];

            await db.query(query, values);
        }
        
        return duplicateCount;
    } catch (error) {
        console.error('Errore durante l\'inserimento:', error);
        return 0;
    }
}

      function rimuoviApici(inputString:any) {
        // Utilizzo della funzione replace con espressione regolare per rimuovere gli apici singoli
        const stringaSenzaApici = inputString.replace(/'/g, '');
        return stringaSenzaApici;
      }

export default new OrderService();
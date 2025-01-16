import { Order } from 'models/order';
import db from '../database/database';
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
    console.log("salesDoc:", salesDoc);
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



    async importOrders(): Promise<Order[]> {
        try {
            // Controlla se il file esiste
            await fs.access(fileName);
        } catch (error) {
            console.error(`Il file non esiste: ${fileName}`);
            return []; // Esci dalla funzione se il file non esiste
        }
    
        const workbook = XLSX.readFile(fileName);
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const data = [];
    
        for (let row = 8; row <= range.e.r; row++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
            if (cell && cell.v && typeof cell.v === 'string') {
                const value = cell.v.trim();
                const isNumeric = !isNaN(value.replace(/[^0-9]/g, ''));
                if (isNumeric && value.indexOf(' ') === -1) {
                    const salesDocData = await readSalesDoc(workbook, sheetName2, value);
                 //   console.log(salesDocData);
                    data.push(value);
                }
            }
        }
    
        try {
            await moveFileToProcessedFolder(fileName, path, fs);
            const responseCheck = await axios.get(`${urlApi}/customer/import/checkCustomer`);
            console.log('----> checkcustomers', responseCheck.status);
        } catch (error) {
            console.error('Errore nello spostamento del file:', error);
        }

        const ordini = this.getAllOrders();
       
      
        return ordini;
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
        console.log("Colonna 'Sales Doc' non trovata.");
        return data;
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
    //   const response = await axios.post(`${urlApi}inOrders`, data);
      //  console.log('Risposta inOrders:', response.data, 'status:', response.status); 
        
      const response = inOrders(data);
    }

    return data;
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
        console.log(`File ${timestamp}-${fileName}  rinominato con il timestamp e spostato nella cartella di elaborazione con successo`);
      }
    });
  }


  function inOrders(data:any) {
    try {
        const rowsData = data; // Assumiamo che req.body sia un array di oggetti
        const duplicateItems = [];
    
        for (const rowData of rowsData) {
          const checkRow:any =  getOrdesCheck(rowData);
          if (checkRow > 0) {
            duplicateItems.push(rowData); // Aggiungi l'elemento duplicato alla lista
          }
        }
    
        if (duplicateItems.length > 0) {
          return;
        }
    
        // Se non ci sono duplicati, procedi con l'inserimento
        const insertPromises = data.map(async (rowData: any) => {
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
            
            return db.query(query, values);
        });
        

        const results = Promise.all(insertPromises);
    } catch (error) {
        console.error(error);
    }

    }

    async function getOrdesCheck(rowData:any){

        try {
          const query = `
           SELECT * FROM dbo.orders WHERE "Sales_Doc"='${rowData.salesDoc}' AND "Item"='${rowData.item}' AND "Material_Description"='${rowData.materialDescription}';
          `;
          const results = await db.query(query);
         // console.log('results: '+results.recordset.length)
          /* if (results.recordset.length !== 1) {
            throw new Error('Subquery returned more than one value.');
          } */
      
          return results.length;
        } catch (error) {
          console.error('Errore durante il controllo dell\'item nel database:', error);
          throw error;
        }
      }

      function rimuoviApici(inputString:any) {
        // Utilizzo della funzione replace con espressione regolare per rimuovere gli apici singoli
        const stringaSenzaApici = inputString.replace(/'/g, '');
        return stringaSenzaApici;
      }

export default new OrderService();
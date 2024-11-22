import { Order } from 'models/order';
import db from '../database/database';
const XLSX = require('xlsx');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const fileName = 'C:\\files\\Consips2 licenses SO.xlsx'; // Assicurati che il percorso sia corretto
const sheetName = '2) Consip2 licenses pivot';
const urlApi = `${process.env.ENDPOINTAPI}${process.env.PORT}`;
const sheetName2 = '1) Consip2 licenses';
const col = 0;
class OrderService {
    async getAllOrders(): Promise<Order[]> {
        const orders = await db.query(`SELECT * FROM Orders`);
        return orders as Order[];
    }
    async getAllSalesOrders(): Promise<Order[]> {
        const sales = await db.query(`SELECT distinct a.Sales_Doc, b.ODA  FROM [LKDISPATCH].[dbo].[Orders] a  inner join [Ordini_con_Ordinanti] b on a.Sales_Doc = b.Sales_Doc   
       where a.DlBl = '' and a.Sales_Doc+'-'+a.item not in (select distinct b.sales_doc+'-'+b.Item from Licenze b where b.sales_doc not in ('')) order by Sales_Doc asc `);
        return sales as Order[];
    }

    async getOrderByItemSalesDoc(salesDoc:string): Promise<Order[] | null> {
        console.log("salesDoc:", salesDoc)
        const orders = await db.query(`SELECT * FROM Orders WHERE Sales_Doc = ${salesDoc}`);
        if (Array.isArray(orders) && orders.length > 0) {
            return orders;
        }
        return null;
    }

    async getOrdersWithoutDestination(): Promise<Order[]> {
        const orderCheckAdress = await db.query(`  SELECT [Sales_Doc] ,[Nome_Cognome]+' / CF: '+[CF] 'Nome Cognome / CF:'   ,[email] ,[ODA] FROM [LKDISPATCH].[dbo].[Ordini_con_Ordinanti] where Nome_Cognome in ('') or email in ('') or oda in ('') 
        Union 
        SELECT distinct  a.[Sales_Doc] ,'Nome Cognome / CF:' = '' ,'email' = '' ,'ODA' = ''  FROM [LKDISPATCH].[dbo].[Orders] a   Where [DlBl] = '' and a.Sales_Doc not in (select distinct b.sales_doc 
        from Licenze b where b.sales_doc not in ('')) And a.sales_doc not in (select sales_doc from [Ordini_con_Ordinanti]) order by Sales_Doc asc `);
        return orderCheckAdress as Order[];
    }

    //getgetCheckDibi
    async getCheckDibi(salesDoc: string, item: string, dibi: string): Promise<Order[]> {
        const orderCheckAdress = await db.query(`USE [LKDISPATCH];
        DECLARE @return_value int,
                @Action varchar(30);
        EXEC @return_value = [dbo].[Orders_Update]
                @Sales_Doc = N'${salesDoc}',
                @Item = N'${item}',
                @DlBl = '${dibi}',
                @Action = @Action OUTPUT;
        SELECT @Action as N'@Action';`);
        return orderCheckAdress as Order[];
    }
// list order combination pack
async getOrderListxDoc(salesDoc: string): Promise<Order | null> {
    const ordersList = await db.query(`SELECT * FROM [LKDISPATCH].[dbo].[Orders] a inner join  [dbo].[Combinations] b on a.Component = b.Item_Material_Number where sales_doc = '${salesDoc}'`);
    if (Array.isArray(ordersList) && ordersList.length > 0) {
        return ordersList as Order;
    }
    return null;
}
//
    async postOrder(data: Order): Promise<Order | null> {
        const result = await db.query(`INSERT INTO Orders (name, price) VALUES (@name, @price)`);
      
        return null;
    }





    async importOrders(): Promise<Order[]> {
        console.log('ciao import orders')
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
        const insertPromises = data.map(async (rowData:any) => {
            const query = `
                INSERT INTO Orders (Value_contr_no, Sales_Doc, Item, Customer, Name_1, Material, Component, Material_Description, Language, DlBl, Timestamp, Purchase_order_nr)
                VALUES ('${rowData.valueContrNo}', '${rowData.salesDoc}', '${rowData.item}', '${rowData.customer}', '${rimuoviApici(rowData.name)}', '${rowData.material}', '${rowData.component}', '${rowData.materialDescription}', '${rowData.language}', '${rowData.dlBl}', GETDATE(), '${rowData.purchaseOrderNr}')
            `;
            return db.query(query);
        });

        const results = Promise.all(insertPromises);
    } catch (error) {
        console.error(error);
    }

    }

    async function getOrdesCheck(rowData:any){

        try {
          const query = `
           SELECT *  FROM [LKDISPATCH].[dbo].[Orders] where Sales_Doc='${rowData.salesDoc}' AND Item='${rowData.item}' AND Material_Description='${rowData.materialDescription}';
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
import { Customer } from 'models/customer';
import db from '../database/database';
import { createPDFList, processJsonFiles, readSalesDocuments, runAllProcessesPDF, updateStatusFromApi } from '../utils/pdf';
class customerService {
    async getAllCustomers(): Promise<Customer[]> {
        const customers = await db.query(`SELECT * FROM ordinante`);
        return customers as Customer[];
    }

    async getCustomerByItemOda(ODA:number): Promise<Customer | null> {
        const customer = await db.query(`SELECT * FROM ordinante WHERE ODA = '${ODA}'`);
        if (Array.isArray(customer) && customer.length > 0) {
            return customer[0] as Customer;
        }
        console.log('customer not found'+customer);
        return null;
    }
    async postCustomer(data: Customer): Promise<Customer | null> {
        const result = await db.query(`INSERT INTO [dbo].[ordinante] ([Sales_Doc], [Ordinante], [Email], [ODA]) VALUES ('${data.Sales_Doc}', '${data.Ordinante}', '${data.Email}', '${data.ODA}')`);
       const customer = this.getCustomerByItemOda(Number(data.ODA));
        return customer;
    }

    async getCheckCustomer(): Promise<string> {
        try {
            const query = `UPDATE o SET o.Sales_Doc = ord.Sales_Doc FROM [LKDISPATCH].[dbo].[ordinante] o JOIN [LKDISPATCH].[dbo].[Orders] ord 
  ON o.ODA = ord.Purchase_order_nr WHERE o.Sales_Doc != ord.Sales_Doc`;
            const results = db.query(query);
          } catch (error) {
            console.error(`Errore durante l'aggiornamento del salesDoc in table Ordinante nel database:`, error);
            throw error;
          }
        return "getCheckCustomer fatta con successo";
    }
    //getCustomerPdfList
    async getCustomerPdfList(): Promise<object> {
        try {           
            const results = await createPDFList();
            return {results}
          } catch (error) {
            console.error(`Errore durante l'aggiornamento del salesDoc in table Ordinante nel database:`, error);
            throw error;
          }
       
    }
    async getCustomerPdfRead(): Promise<object> {
        try {           
            const results = await readSalesDocuments();
            return {results}
          } catch (error) {
            console.error(`Errore durante la lettura del Pdf nella directory con fn: readSalesDocuments:`, error);
            throw error;
          }
       
    }
    //getCustomerPdUpdate
    async getCustomerPdfUpdate(): Promise<object> {
      try {           
          const results = await updateStatusFromApi();
          return {results}
        } catch (error) {
          console.error(`Errore durante la lettura del Pdf nella directory con fn: readSalesDocuments:`, error);
          throw error;
        }
     
  }
  //getCustomerPdfProcess
  async getCustomerPdfProcess(): Promise<object> {
    try {           
        const results = await processJsonFiles();
        return {results}
      } catch (error) {
        console.error(`Errore durante la lettura del Pdf nella directory con fn: readSalesDocuments:`, error);
        throw error;
      }
   
}
//getCustomerAllPdfProcess
async getCustomerAllPdfProcess(): Promise<object> {
  try {           
      const results = await runAllProcessesPDF();
    //  console.log("results:: ",results);
      return {results}
    } catch (error) {
      console.error(`Errore durante la lettura del Pdf  con fn: runAllProcessesPDF:`, error);
      throw error;
    }
 
}

}

export default new customerService();
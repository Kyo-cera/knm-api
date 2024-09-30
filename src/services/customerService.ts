import { Customer } from 'models/customer';
import db from '../database/database';
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
    

}

export default new customerService();
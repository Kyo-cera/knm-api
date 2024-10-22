import { Order } from 'models/order';
import db from '../database/database';
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
    async getOrdersWithoutDestination(): Promise<Order[]> {
        const orderCheckAdress = await db.query(`  SELECT [Sales_Doc] ,[Nome_Cognome]+' / CF: '+[CF] 'Nome Cognome / CF:'   ,[email] ,[ODA] FROM [LKDISPATCH].[dbo].[Ordini_con_Ordinanti] where Nome_Cognome in ('') or email in ('') or oda in ('') 
        Union 
        SELECT distinct  a.[Sales_Doc] ,'Nome Cognome / CF:' = '' ,'email' = '' ,'ODA' = ''  FROM [LKDISPATCH].[dbo].[Orders] a   Where [DlBl] = '' and a.Sales_Doc not in (select distinct b.sales_doc 
        from Licenze b where b.sales_doc not in ('')) And a.sales_doc not in (select sales_doc from [Ordini_con_Ordinanti]) order by Sales_Doc asc `);
        return orderCheckAdress as Order[];
    }

    async getOrderByItemSalesDoc(item: number,salesDoc:number): Promise<Order | null> {
        const orders = await db.query(`SELECT * FROM Orders WHERE id = @id`);
        if (Array.isArray(orders) && orders.length > 0) {
            return orders[0] as Order;
        }
        return null;
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

}

export default new OrderService();
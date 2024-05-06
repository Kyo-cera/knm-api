import { License } from 'models/license';
import db from '../database/database';

class LicenseService {
    async getAllLicense(): Promise<License[]> {
        const license = await db.query(`SELECT * FROM Licenze`);
        return license as License[];
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

}

export default new LicenseService();
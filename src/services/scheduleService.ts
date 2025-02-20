import fs from 'fs';
import path from 'path';
import axios from 'axios';
// @ts-ignore
import cron from 'node-cron';
import { ScheduleData } from 'models/scheduleData';
import { writeToLog } from '../utils/writeLog';
const ENDPOINT_API = process.env.ENDPOINT_API
const PORT = process.env.PORT
const apiURL = `${ENDPOINT_API}${PORT}`
// const apiURL = "http://localhost:3005"
class scheduleService {
    private filePath = path.join(__dirname, '../data/scheduleData/scheduleJSON.json');

    private apiUrls: { [key in 'importLicenses' | 'importOrders' | 'importCustomers' | 'sendOrders']: string } = {
        importLicenses: `${apiURL}/license/import/licenses`,
        importOrders: `${apiURL}/orders/import/orders`,
        importCustomers: `${apiURL}/customer/runAllProcessesPDF`,
        sendOrders: `${apiURL}/orders/cart`,
    };

    private daysMap: { [key: string]: number } = {
        "Lunedì": 1,
        "Martedì": 2,
        "Mercoledì": 3,
        "Giovedì": 4,
        "Venerdì": 5,
        "Sabato": 6,
        "Domenica": 0,
    };

    async scheduleByType(
        type: 'importLicenses' | 'importOrders' | 'importCustomers' | 'sendOrders', 
        ora: number,
        minuti: number,
        settimanale: boolean,
        giornoDellaSettimana: string,
        mensile: boolean,
        giornoDelMese: number
    ): Promise<string> {
        try {
            let scheduleData: ScheduleData = {};
            if (fs.existsSync(this.filePath)) {
                const fileContent = fs.readFileSync(this.filePath, 'utf-8');
                if (fileContent.trim() !== '') {
                    scheduleData = JSON.parse(fileContent) as ScheduleData;
                }
            }
    
            scheduleData[type] = {
                ora,
                minuti,
                settimanale,
                giornoDellaSettimana,
                mensile,
                giornoDelMese,
            };
    
            fs.writeFileSync(this.filePath, JSON.stringify(scheduleData, null, 2), 'utf-8');
    
            this.createCronJob(type, scheduleData[type]);
    
            return `Dati per il tipo ${type} salvati e cron job configurato con successo`;
        } catch (error: any) {
            console.error(`[ERROR] Errore nel salvataggio dei dati: ${error.message}`);
            throw new Error(`Errore nel salvataggio dei dati: ${error.message}`);
        }
    }
    

    constructor() {
        this.loadCronJobsFromJson();
    }

    private loadCronJobsFromJson() {
        if (fs.existsSync(this.filePath)) {
            const fileContent = fs.readFileSync(this.filePath, 'utf-8');
            if (fileContent.trim() !== '') {
                try {
                    const scheduleData: ScheduleData = JSON.parse(fileContent);
                    for (const type in scheduleData) {
                        const data = scheduleData[type];
                        this.createCronJob(type as 'importLicenses' | 'importOrders' | 'importCustomers' | 'sendOrders', data);
                    }
                } catch (error:any) {
                    console.error(`[ERROR] Errore nel parsing del JSON: ${error.message}`);
                }
            }
        }
    }
    

    private createCronJob(type: 'importLicenses' | 'importOrders' | 'importCustomers' | 'sendOrders', data: ScheduleData[string]) {
        let cronExpression: string;

        if (data.settimanale) {
            const dayNumber = this.daysMap[data.giornoDellaSettimana] ?? 1;
            cronExpression = `${data.minuti} ${data.ora} * * ${dayNumber}`;
        } else if (data.mensile) {
            cronExpression = `${data.minuti} ${data.ora} ${data.giornoDelMese} * *`;
        } else {
            cronExpression = `${data.minuti} ${data.ora} * * *`; 
        }

        writeToLog(`[DEBUG] Configurazione cron: "${cronExpression}" per tipo `,type);

        cron.schedule(
            cronExpression,
            async () => {
                writeToLog(`[DEBUG] Esecuzione pianificata per tipo: ${type} alle ${data.ora}:`, data.minuti);
                await this.executeApi(type);
            },
            {
                scheduled: true,
                timezone: "Europe/Rome",
            }
        );

        writeToLog(`[DEBUG] Cron job creato con successo per tipo: `, type);
    }

    async getScheduleByType(type: 'importLicenses' | 'importOrders' | 'importCustomers' | 'sendOrders'): Promise<ScheduleData[string]> {
        try {
            if (fs.existsSync(this.filePath)) {
                const fileContent = fs.readFileSync(this.filePath, 'utf-8');
                if (fileContent.trim() !== '') {
                    const scheduleData: ScheduleData = JSON.parse(fileContent);
                    return scheduleData[type] || {
                        ora: 0,
                        minuti: 0,
                        settimanale: false,
                        giornoDellaSettimana: '',
                        mensile: false,
                        giornoDelMese: 0
                    };
                }
            }
            return {
                ora: 0,
                minuti: 0,
                settimanale: false,
                giornoDellaSettimana: '',
                mensile: false,
                giornoDelMese: 0
            };
        } catch (error: any) {
            console.error(`[ERROR] Errore durante il recupero dei dati per tipo "${type}": ${error.message}`);
            return {
                ora: 0,
                minuti: 0,
                settimanale: false,
                giornoDellaSettimana: '',
                mensile: false,
                giornoDelMese: 0
            };
        }
    }
    
    

    private async executeApi(type: 'importLicenses' | 'importOrders' | 'importCustomers' | 'sendOrders') {
        const apiUrl = this.apiUrls[type];
        if (!apiUrl) {
            console.error(`[ERROR] Nessuna API configurata per il tipo: ${type}`);
            return;
        }

        try {
            const response = await axios.get(apiUrl);
            writeToLog(`[SUCCESS] Risposta dall'API ${type}:`, response.data);
        } catch (error: any) {
            console.error(`[ERROR] Errore durante l'esecuzione dell'API ${type}:`, error.message);
        }
    }
}

export default new scheduleService();

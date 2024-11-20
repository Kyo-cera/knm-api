export interface ScheduleData {
    [key: string]: {
        ora: number;
        minuti: number;
        settimanale: boolean;
        giornoDellaSettimana: string;
        mensile: boolean;
        giornoDelMese: number;
    };
}
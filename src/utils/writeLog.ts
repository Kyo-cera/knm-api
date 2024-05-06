const fs = require('fs').promises;
const path = require('path');
import { checkFileSize } from './utils';
const logFilePath = path.resolve(__dirname, '../log/log.txt');
export async function writeToLog(data: string, v: any) {
    try { 
      checkFileSize(path, fs,logFilePath);
     console.log(data);
       const logMessage = `[${new Date().toISOString()}] ${data} ${v !== undefined ? JSON.stringify(v) : '-'} \n`;
      await fs.appendFile(logFilePath, logMessage, 'utf8');
    } catch (error) {
      console.error('Errore durante la scrittura del file di log:', error);
    }
  }
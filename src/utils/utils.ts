

export async function checkFileSize(path: any, fs : any, filePath:string) {
  try {
    const stats = await fs.stat(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

    if (fileSizeInMegabytes >= 100) {
      const backupFilePath = path.resolve(__dirname, `../log/${Date.now()}-${path.basename(filePath)}`);

      const data = await fs.readFile(filePath, 'utf8');
      await fs.writeFile(backupFilePath, data, 'utf8');

      // Reset the log file
      const logFilePath = path.resolve(__dirname, '../log/log.txt');
      await fs.writeFile(logFilePath, 'reset', 'utf8');

      // Log the event
      console.log('File size exceeded 100MB, backup created and log file reset.');

      // Delete the original log file
      await fs.unlink(filePath);
    }
  } catch (error) {
    console.error('Errore durante l\'esecuzione della funzione checkFileSize:', error);
  }
}
export async function deleteLogFile(fs: any, filePath: string) {
    try {
      await fs.unlink(filePath);
   //   await   writeToLog('File di log cancellato:', 'delete');
    } catch (error) {
      console.error('Errore durante la cancellazione del file di log:', error);
    }
  }
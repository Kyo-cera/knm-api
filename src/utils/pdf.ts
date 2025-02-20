import fs from 'fs/promises';
import path from 'path';
import { writeToLog } from '../utils/writeLog';
const fse = require('fs-extra');
const axios = require('axios');
const pathFiles = path.join(__dirname, '../data');
 const pathFilesI =`${process.env.PATH_PDF_PROD}`;
const salesDocuments = pathFiles + "/pdfList.json";
const apiPostPdfUrl =`${process.env.ENDPOINT_API}${process.env.PORT}/customer/` ;
let errorPDF = [];
  let counterKO = 0;
  let counterOK = 0;
export async function createPDFList() { 
    const pdfList: Array<{ pdfSales_doc: string; status: string; sales_doc: string | null }> = [];
    let count = 0; // Contatore per il numero di file PDF aggiunti
    try {
        const files = await fs.readdir(pathFilesI); // Leggi la directory in modo asincrono
        const pdfFiles = files.reduce<string[]>((acc, file) => {
            const ext = path.extname(file);
            const fileName = path.basename(file, ext); // Ottieni il nome del file senza estensione
            const fileParts: string[] = fileName.split('_'); // Assicurati che fileParts sia un array di stringhe
            const isValid = isValidFileName(file);
         //   console.log("isValid",isValid," file: ",file);
            // Verifica se l'estensione è PDF e se ci sono parti numeriche nel nome del file
            if (ext.toLowerCase() === ".pdf" && fileParts.length ===3 && isValid) {
              //  console.log("file:", file," - ", fileParts.length," isValid- ",isValid )
                acc.push(file);
            }
            return acc;
        }, []);

        if (pdfFiles.length === 0) {
            writeToLog("Nessun file PDF trovato nella directory.", pdfFiles.length);
            return { success: true, total: 0 }; // Restituisce successo anche se non ci sono file
        }

        for (const pdfFile of pdfFiles) {
            let salesOrder = await extractLastNumericCode(pdfFile);
            pdfList.push({ pdfSales_doc: pdfFile, status: "pre", sales_doc: salesOrder });
            count++; // Incrementa il contatore per ogni file aggiunto
        }
        writeToLog(`pathFiles- `, pathFiles);

        const jsonFilePath = path.join(pathFiles, "pdfList.json");
        const jsonString = JSON.stringify({ items: pdfList, total: count }, null, 2); // Aggiungi il totale al JSON
        await fs.writeFile(jsonFilePath, jsonString); // Usa await
        writeToLog(`Lista dei documenti PDF creata con successo. Totale file aggiunti: ${count}`, jsonFilePath);
       // const updateStatusResult = await updateStatusFromApi();
       // console.log("Risultato dell'aggiornamento dello stato dall'API:", updateStatusResult);
        return { success: true, total: count };
    } catch (error) {
        console.error("Errore creazione lista", error);
        return { error: error }; // Restituisci solo il messaggio di errore
    }
}

export async function readPDFAndSaveToJson(pdfFilePath: string) {
    try {
        let emailPuntoOrdinanteValue = "";
        let odaValue = "";
        let pecValue = "";
        let puntoOrdinanteValue = "";
        let counterOK = 0;
        let counterKO = 0;
        let errorPDF: Array<{ pdfError: string }> = [];
        let salesOrder = await extractLastNumericCode(pdfFilePath);
        let checkFilePDF = await checkFileExists(pdfFilePath);
        const foundX = 16.875;
        const foundY = 31.3;

        if (checkFilePDF) {
            const module = await import('pdfreader');
            const PdfReader = module.PdfReader;

            await new Promise<void>((resolve, reject) => {
                new PdfReader().parseFileItems(pdfFilePath, async (err, item) => {
                 let   itemObj: any = item;
                    if (err) {
                        return reject(err);
                    } else if (!itemObj) {
                        // Quando non ci sono più elementi da elaborare
                        if (emailPuntoOrdinanteValue || pecValue || odaValue) {
                            const jsonData = {
                                Sales_Doc: salesOrder,
                                Ordinante: puntoOrdinanteValue,
                                Email: emailPuntoOrdinanteValue,
                                Pec: pecValue,
                                ODA: odaValue
                            };
                            const jsonString = JSON.stringify(jsonData, null, 2);
                            if (salesOrder && jsonString) {
                                const jsonFilePath = path.join(
                                    pathFiles,
                                    "pdf",
                                    `${odaValue}_${salesOrder}.json`
                                );
                                try {
                                    await fs.writeFile(jsonFilePath, jsonString);
                                    counterOK++;
                                    writeToLog(`Email Punto Ordinante salvata con successo nel file JSON: Contatore: ${counterOK}`, salesOrder);
                                } catch (writeError) {
                                    console.error("Errore durante la scrittura del file:", writeError);
                                }
                            } else {
                                counterKO++;
                                errorPDF.push({ pdfError: pdfFilePath });
                                const jsonStringError = JSON.stringify(errorPDF, null, 2);
                                await fs.writeFile(path.join(pathFiles, "ErrorPDF.json"), jsonStringError);
                            }
                        }
                        resolve(); // Indica che il parsing è completato
                    } else if (itemObj.text) {
                        const x = itemObj?.x; // Usa l'operatore di chaining facoltativo
                        const y = itemObj?.y; // Usa l'operatore di chaining facoltativo

                        if (typeof x === 'number' && typeof y === 'number') {
                            // Controllo per l'email
                            if (itemObj.text.includes("@") && x === foundX && y <= foundY) {
                                emailPuntoOrdinanteValue = itemObj.text.replace(/'/g, "''");
                                pecValue = itemObj.text.includes("PEC") ? itemObj.text : '';
                            } else if (x === foundX && y === 5.264) {
                                odaValue = itemObj.text;
                            } else if (itemObj.text.includes("CF:") && x === foundX && y <= foundY) {
                                puntoOrdinanteValue = itemObj.text.replace(/'/g, "''");
                            }
                        }
                    }
                });
            });
            return { success: true };
        } else {
            console.error("Il file PDF non esiste o non può essere aperto.");
            return { success: false };
        }
    } catch (error) {
        console.error("Errore durante la lettura del PDF e salvataggio in JSON:", error);
        return { success: false };
    }
}


function extractLastNumericCode(filePath: string): string | null {
    // Rimuove gli spazi prima dei punti
    filePath = filePath.replace(/\s+\./g, "."); 
    // Estrae il nome del file
    const fileName = filePath.split("/").pop()?.split("\\").pop() || ""; // Gestisce sia i separatori di percorso Unix che Windows
    // Estrae il nome senza estensione
    const nameWithoutExtension = fileName.split(".").slice(0, -1).join(".");
    // Trova l'ultimo codice numerico
    const lastNumericCode = nameWithoutExtension.match(/\d+/g); // Trova tutti i numeri
    return lastNumericCode && lastNumericCode.length > 0 ? lastNumericCode[lastNumericCode.length - 1] : null; // Restituisce l'ultimo numero trovato
}

async function checkFileExists(pdfFilePath:string) {
    try {
        // Normalizza il percorso per evitare problemi di formattazione
        const normalizedPath = path.normalize(pdfFilePath);
        // Verifica che il file esista
        await fs.access(normalizedPath);
      //  console.log(`Il file ${normalizedPath} esiste nella directory.`);
        return true;
    } catch (err) {
        // Controllo specifico per l'errore ENOENT (file non trovato)
       
        writeToLog(`Errore durante l'accesso al file ${pdfFilePath}:`, err);
        
        return false;
    }
}
const BATCH_SIZE = 50;
export async function readSalesDocuments() {
  let counterKO = 0;
  let counterOK = 0;
  try {
    const jsonData = await fs.readFile(salesDocuments, "utf8");
    const jsonArray = JSON.parse(jsonData).items;

    if (Array.isArray(jsonArray)) {
      const chunkedArray = Array.from(
        { length: Math.ceil(jsonArray.length / BATCH_SIZE) },
        (_, i) => jsonArray.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
      );

      for (const chunk of chunkedArray) {
        const promises = chunk.map(async (item) => {
          let pdfFile = pathFilesI + item.pdfSales_doc;
          let pdfFilestatus = item.status;
          
          if (pdfFile && pdfFilestatus === 'pre') {
            writeToLog("pdfFile:",pdfFile);
            try {
              await readPDFAndSaveToJson(pdfFile);
              counterOK++;
            } catch (error) {
              console.error(`Error processing file ${pdfFile}:`, error);
              counterKO++;
            }
          } else {
            counterKO++;
          }
        });

        await Promise.all(promises); // Aspetta che tutte le promesse siano risolte
      }

      const totalArray = jsonArray.length; // Rimosso await
      writeToLog("jsonArray.length:" + totalArray + " item ok:" + counterOK + " item error: " , counterKO);
      return { success: true, total: totalArray, totaItemsok: counterOK, totaItemsKo: counterKO };
    } else {
        writeToLog("jsonData is not an array.", Array);
    }
  } catch (error) {
    console.error("Error reading sales documents:", error);
  }
}
export async function updateStatusFromApi() {
    const pdfListPath = await path.join(salesDocuments); // Percorso al file JSON

    try {
        // Leggi il file JSON contenente la lista dei PDF
        const jsonData = await fs.readFile(pdfListPath, 'utf8');
        const pdfList = JSON.parse(jsonData);
        const response = await getData(apiPostPdfUrl); 
        writeToLog('apiPostPdfUrl: ',apiPostPdfUrl);
        // Itera attraverso gli elementi della lista
        for (const item of pdfList.items) {
         //   console.log('item.sales_doc: ',item.sales_doc);

          // Chiamata all'API per verificare il documento
   const found = findSalesDoc(response.data, item.sales_doc);

  //  console.log(`Elemento con sales_doc "${searchDoc}" trovato:`, found);
      
          if (found) {
                 // Supponiamo che l'API restituisca un oggetto con una proprietà "exists"
                item.status = "ok"; // Aggiorna lo stato a "ok"
                writeToLog(`Document  trovato nel DB. Stato aggiornato a "ok"`, item.pdfSales_doc);
               
            } else {
                writeToLog(`Document ${item.pdfSales_doc} non trovato nel DB. -${found} - ${item.sales_doc} -  `, found);
            }
               
        }
        function findSalesDoc(data: Array<{ Sales_Doc: string }>, salesDoc: string): boolean {
            // Controllo che data sia un array
            if (!Array.isArray(data)) {
                console.error("Il parametro 'data' non è un array:", data);
                return false; // Restituisce false se data non è un array
            }
        
            // Controllo che salesDoc sia una stringa valida
            if (typeof salesDoc !== 'string' || salesDoc.trim() === '') {
                return false; // Restituisce false se salesDoc non è valido
            }
            
            // Verifica se esiste un documento di vendita corrispondente
            return data.some(item => item.Sales_Doc === salesDoc);
        }

        // Salva nuovamente la lista aggiornata nel file JSON
        const updatedJsonString = JSON.stringify(pdfList, null, 2);
        await fs.writeFile(pdfListPath, updatedJsonString);
        writeToLog("Lista aggiornata salvata con successo.","lista pdf");
        return {sucess:true}
    } catch (error) {
        writeToLog("Errore durante l'aggiornamento dello stato: ",error);
        console.error("Errore durante l'aggiornamento dello stato:", error);
    }
}
async function getData(url:string) {
    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data; // Restituisce i dati della risposta
    } catch (error) {
        writeToLog("Errore durante la chiamata API GET: ",error);
        console.error('Errore durante la chiamata API GET:', error);
        return null;
    }
}
function isValidFileName(fileName:string) {
    
    const regex = /^\d+_\d{8}_\d+ ?_?\.PDF$/; 
    return regex.test(fileName);
}

async function moveFile(sourcePath:string, destPath:string) {
    try {
        // Controlla se il file di destinazione esiste già
        let finalDestPath = destPath;
        let counter = 1;

        while (await fse.pathExists(finalDestPath)) {
            const ext = path.extname(destPath);
            const baseName = path.basename(destPath, ext);
            finalDestPath = path.join(path.dirname(destPath), `${baseName}_${Date.now()}_${counter}${ext}`);
            counter++;
        }

        await fse.move(sourcePath, finalDestPath);
        writeToLog(`File spostato: `, path.basename(finalDestPath));
    } catch (error) {
        console.error(`Errore durante lo spostamento del file: ${error}`);
        throw error; // Rilancia l'errore per gestirlo nel chiamante
    }
}

// Funzione principale per elaborare i file JSON
export async function processJsonFiles() {
    let successCount = 0;
    let errorCount = 0;
    const dataDir = pathFiles + "/pdf/";
    const processDir = pathFiles + "/pdf/process/";
    const errorDir = pathFiles + "/pdf/error/";

    try {
        const files = await fs.readdir(dataDir);
        const jsonFiles = files.filter(file => path.extname(file) === '.json');

        // Suddividere i file in batch da 200
        const batchSize = 200;
        for (let i = 0; i < jsonFiles.length; i += batchSize) {
            const batchFiles = jsonFiles.slice(i, i + batchSize);
            writeToLog(`Elaborazione batch da file ${i + 1} a `, Math.min(i + batchSize, jsonFiles.length));

            // Processa i file nel batch
            const processingPromises = batchFiles.map(async (file) => {
                const filePath = path.join(dataDir, file);
                let operationStatus = 'success'; // Variabile per tenere traccia dello stato dell'operazione
                try {
                    const jsonData = await fse.readJson(filePath);
                    if (Object.keys(jsonData).length === 0) {
                        writeToLog(`Il file ${file} è vuoto. Passo al file successivo.`, file);
                        return; // Passa al file successivo
                    } else {
                        writeToLog(`jsonData: counts`, Object.keys(jsonData).length);
                    }
                    const response = await axios.post(apiPostPdfUrl, jsonData);
                    writeToLog(`File ${file} inviato con successo:`, response.data);
                } catch (error) {
                    writeToLog(`Errore durante l'invio del file ${file}:`, error);
                    operationStatus = 'error'; // Imposta lo stato su errore
                    errorCount++;
                }

                // Sposta il file nella cartella appropriata in base allo stato dell'operazione
                const finalFilePath = path.join(operationStatus === 'success' ? processDir : errorDir, file);
                await moveFile(filePath, finalFilePath); // Sposta nella cartella appropriata

                // Incrementa successCount solo se l'operazione è stata un successo
                if (operationStatus === 'success') {
                    successCount++;
                    writeToLog(`File ${file} spostato nella cartella 'process' come`, path.basename(finalFilePath));
                } else {
                    writeToLog(`File ${file} spostato nella cartella 'error' come`, path.basename(finalFilePath));
                }
            });

            // Attendi il completamento del batch corrente
            await Promise.all(processingPromises);
            writeToLog(`Batch da ${batchFiles.length} file completato con successo.`, batchFiles.length);
        }

    } catch (error) {
        console.error('Errore durante il processo dei file:', error);
    } finally {
        writeToLog(`Elaborazione completata. File elaborati con successo: ${successCount}, File con errore:`, errorCount);
    }

    return { success: successCount, error: errorCount };
}


export async function runAllProcessesPDF() {
    try {
        // 1. Crea la lista dei file PDF
        const createListResult = await createPDFList();
        writeToLog("Risultato della creazione lista PDF:", createListResult);

        // 2. Aggiorna lo stato dall'API
      const updateStatusResult = await updateStatusFromApi();
      writeToLog("Risultato dell'aggiornamento dello stato dall'API:", updateStatusResult);

        // 3. Leggi i documenti di vendita
    const readSalesDocumentsResult = await readSalesDocuments();
    writeToLog("Risultato della lettura dei documenti di vendita:", readSalesDocumentsResult);

        // 4. Elabora i file JSON
       const processJsonFilesResult = await processJsonFiles();
       writeToLog("Risultato dell'elaborazione dei file JSON:", processJsonFilesResult);
       return processJsonFilesResult

    } catch (error) {
        console.error("Errore durante l'esecuzione dei processi:", error);
    }
}
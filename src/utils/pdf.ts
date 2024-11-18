import fs from 'fs/promises'; // Assicurati di importare fs con il modulo promises
import path from 'path';
const pathFiles = path.join(__dirname, '../data');
 const pathFilesI = "I:/Cross Document/Ordini Consip/ORDINI Consip 2/"; 
//const pathFilesI = "C:/trasferte/ORDINI Consip 2/";
const salesDocuments = pathFiles + "pdfList.json";
const apiPostPdfUrl = 'http://localhost:3005/customer/';
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
            
            // Verifica se l'estensione è PDF e se ci sono parti numeriche nel nome del file
            if (ext.toLowerCase() === ".pdf" && fileParts.length > 1 && fileParts.some(part => !isNaN(Number(part)) && part.trim() !== '')) {
                acc.push(file);
            }
            return acc;
        }, []);

        if (pdfFiles.length === 0) {
            console.log("Nessun file PDF trovato nella directory.");
            return { success: true, total: 0 }; // Restituisce successo anche se non ci sono file
        }

        for (const pdfFile of pdfFiles) {
            let salesOrder = await extractLastNumericCode(pdfFile);
            pdfList.push({ pdfSales_doc: pdfFile, status: "pre", sales_doc: salesOrder });
            count++; // Incrementa il contatore per ogni file aggiunto
        }
        console.log(`pathFiles- ${pathFiles}`);

        const jsonFilePath = path.join(pathFiles, "pdfList.json");
        const jsonString = JSON.stringify({ items: pdfList, total: count }, null, 2); // Aggiungi il totale al JSON
        await fs.writeFile(jsonFilePath, jsonString); // Usa await
        console.log(`Lista dei documenti PDF creata con successo. Totale file aggiunti: ${count} -in - ${jsonFilePath}`);
        return { success: true, total: count };
    } catch (error) {
        console.error("Errore creazione lista", error);
        return { error: error }; // Restituisci solo il messaggio di errore
    }
}

async function readPDFAndSaveToJson(pdfFilePath: string, pathFiles: string) {
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
                                    console.log(`Email Punto Ordinante salvata con successo nel file JSON: Contatore: ${counterOK}`, salesOrder);
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
// Assicurati che la funzione extractLastNumericCode sia definita correttamente

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
       
            console.log(`Errore durante l'accesso al file ${pdfFilePath}:`, err);
        
        return false;
    }
}
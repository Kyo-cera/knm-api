import CartService from './services/cartService';

async function runProcessSalesDoc() {
    try {
        const results = await CartService();
     //   console.log('Risultati delle chiamate API:', results);
    } catch (error) {
        console.error('Errore durante l\'esecuzione del processo:', error);
    }
}

runProcessSalesDoc(); 
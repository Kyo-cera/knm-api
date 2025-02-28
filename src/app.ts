import express, { Request, Response } from 'express';
import routes from './routes/routes';
import { writeToLog } from './utils/writeLog';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Middleware CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Permette tutte le origini
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
});

app.use(cors());

// Middleware per il parsing del JSON
app.use(express.json());

// Middleware per servire file statici
app.use('/attachment', express.static(path.join(__dirname, 'attachment')));

app.get('/', async (req: Request, res: Response) => {
    res.send(`Hi KNM Api`);
});

app.use('/', routes);

// Avvia il server
app.listen(PORT, () => {
    writeToLog(`✅ App KNM è online nella porta: ${PORT}`, __dirname);
    console.log(`✅ Server running on PORT: ${PORT}`);
});

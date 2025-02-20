import express, { Request, Response } from 'express';
import routes from './routes/routes';
import { writeToLog } from './utils/writeLog';
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware per il parsing del JSON
app.use(express.json());

// Middleware per servire file statici dalla cartella 'src/attachments'
app.use('/attachment', express.static(path.join(__dirname, 'attachment'))); // Modifica qui

app.get('/', async (req: Request, res: Response) => {
    res.send(`Hi KNM Api`);
});

app.use('/', routes);

app.listen(PORT, () => {
    writeToLog(`App KNM è online nella porta: ${PORT} - ${__dirname}`, __dirname);
});
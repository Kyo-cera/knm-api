import express, { Request, Response } from 'express';
import routes from './routes/routes';
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/', async (req: Request, res: Response)=>{
    res.send(`Hi KNM Api`);
});

app.use('/', routes);

app.listen(PORT, ()=>{
    console.log(`App KNM è online nella porta on port: ${process.env.PORT}`);
}); 
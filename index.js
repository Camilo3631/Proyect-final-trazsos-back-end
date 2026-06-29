import express from "express";
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import registerRouter from './routes/register.js';

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI); 


const main = async () => {
    await client.connect();
    app.locals.db = client.db('medicalcitas');
    app.use('/api', registerRouter);
    app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor corriendo 🚀');
    });
};

main();


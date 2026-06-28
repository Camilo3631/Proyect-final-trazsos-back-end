import express from "express";
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();





const app = express();


app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());



app.listen(process.env.PORT || 3000);




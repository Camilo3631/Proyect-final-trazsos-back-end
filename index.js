import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import registerRouter from "./routes/register.js";
import loginRouter from './routes/login.js';

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Todas las rutas del router comenzarán con /api
app.use("/api", registerRouter);
app.use("/api", loginRouter); 

await connectDB();

app.listen(process.env.PORT || 3000, () => {
 // console.log(`Servidor escuchando en el puerto ${process.env.PORT || 3000}`);
});

async function connectDB() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  app.locals.db = client.db("medicalcitas");
  console.log("✅ Conectado a MongoDB");
}

export default app;

import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import registerRouter from "./routes/register.js";
import loginRouter from './routes/login.js';
import disponbilidadRouter from './routes/disponibilidad.js';
import citasRouter from "./routes/citas.js";
import doctorsRouter from "./routes/doctors.js";
import usersRouter from "./routes/users.js"; 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());



app.use("/api", registerRouter);
app.use("/api", loginRouter); 
app.use("/api", disponbilidadRouter);
app.use("/api", citasRouter);
app.use("/api", doctorsRouter);
app.use("/api", usersRouter);

await connectDB();

app.listen(PORT, ()  => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

async function connectDB() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  app.locals.db = client.db("medicalcitas");
  console.log("✅ Conectado a MongoDB");
}

export default app;

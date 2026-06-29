import { Router  } from "express";
import bcrypt from "bcrypt"

const router = Router();

router.post('/register', async (req, res) => {

    const { name, email, password} = req.body;

    if (!name || !email  || !password) {
        return res.status(400).json({mensaje: 'Todos los campos son obligatorios'});  
    }

    const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailFormat.test(email)) {
        return res.status(400).json({mensaje: 'Formato de correo es incorrecto'});
    }

    if (password.length < 6) {
        return res.status(400).json({mensaje: 'La contraseña debe de tener un minimo de 6 caracteres'});   
    }

    const emailExistente = await req.app.locals.db
      .collection('users')
      .findOne({ email});

    if (emailExistente) {
        return res.status(400).json({mensaje: 'Ya existe una cuenta con ese email'});
    }

    const passwordCifrado = await bcrypt.hash(password, 12);

    const nuevoUsuario = await req.app.locals.db
      .collection('users')
      .insertOne({ name, email, password: passwordCifrado });

      res.status(201).json({ mensaje: "Usuario registrado con exito", data: nuevoUsuario });
});

export default router;

  
    

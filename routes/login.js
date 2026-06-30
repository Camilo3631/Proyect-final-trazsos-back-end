import { Router  } from "express";
import bcrypt from "bcrypt"

const router = Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({mensaje: 'Todos los campos son obligatorios'});
    }

    const usuario = await req.app.locals.db
      .collection('users')
      .findOne({ email });
 
   if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
   }

   const passwordMatch = await bcrypt.compare(password, usuario.password);

   if (!passwordMatch) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas'});
   }

   res.status(200).json({ mensaje: 'Login exitoso', usuario});

})


export default router;
import dotenv from 'dotenv';
dotenv.config();

import { Router } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { ObjectId } from "mongodb";

const router = Router();

const transporter = nodemailer.createTransport({
   host: 'smtp.gmail.com',
   port: 465,
   secure: true,
   auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
   }
});

const generarCodigoVerificacion = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


router.get('/doctors', async (req, res) => {
   try {
    const doctores = await req.app.locals.db
     .collection('doctors')
     .find()
     .toArray()

    res.status(200).json(doctores);
   } catch (error) {
     res.status(500).json({
      mensaje: 'Error al obtener doctores'
     });
   }  
});

router.post('/doctors/register', async (req, res) => {
    try {
      const {
        nombre,
        email,
        password,
        especialidad,
        horarios,
      } = req.body

      if (
        !nombre ||
        !email ||
        !password ||
        !especialidad ||
        !horarios ||
        horarios.length === 0
      ) {
         return res.status(400).json({
            mensaje: 'Todos los campos son obligatorios'
         })
      }

      const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailFormat.test(email)) {
         return res.status(400).json({
            mensaje: 'Formato de correo incorrecto'
         })
      }

      if (password.length < 6) {
        return res.status(400).json({
           mensaje: 'La contraseña debe tener mínimo 6 caracteres'
        })
      }

      const doctorExistente = await req.app.locals.db
       .collection('doctors')
       .findOne({ email});

      if (doctorExistente) {
        return res.status(400).json({
           mensaje: 'Ya existe una cuenta con ese email'
        })
      }

      const passwordCifrado = await bcryptjs.hash(password, 10);

      const codigoVerificacion = generarCodigoVerificacion();
      const codigoExpiracion = new Date(Date.now() + 8 * 60 * 1000);

      const newDoctor = {
        name: nombre,
        email,
        password: passwordCifrado,
        especialidad,
        horarios,
        rol: 'doctor',
        verificado: false,
        codigoVerificacion,
        codigoExpiracion,
        createdAt: new Date()
      };

      const result = await req.app.locals.db
       .collection('doctors')
       .insertOne(newDoctor)

       try {
         await transporter.sendMail({
           from: process.env.EMAIL_USER,
           to: email,
           subject: 'Código de verificación - MedicalCitas',
           html: `
             <h2>Registro Exitoso</h2>
             <p>Bienvenido ${nombre}</p>

             <p>Tu código de expiración es:</p>

             <h1 style="font-size: 36px; color: #3b82f6; letter-spacing: 5px;">
               ${codigoVerificacion}
             </h1>

             <p>Este código es válido por 8 minutos</p>

            <p>Si no realizaste este registro, ignora este email.</p>
           `

         })

         console.log(`✅ Email de registro enviado a ${email}`)
       } catch (emailError) {
         console.log('⚠️ Error al enviar email:', emailError.message);
       }

       res.status(201).json({
         mensaje: 'Doctor registrado. Revisa tu email para el código de verificación.'
       });

      } catch (error) {
        console.log(error)

       res.status(500).json({
           error: error.mensage
      });
     } 
});


router.post('/doctors/verify-code', async (req, res) => {
  try {
     const { email, codigo } = req.body;

     if (!email || !codigo) {
       return res.status(400).json({
          mensaje: 'Email y código son obligatorios'
       })
     }

     const doctor = await req.app.locals.db
       .collection('doctors')
       .findOne({ email })

      if (!doctor) {
        return res.status(400).json({
           mensaje: 'Doctor no encontrado'
        })
      }

      if (new Date() > doctor.codigoExpiracion) {
        return res.status(400).json({
           mensaje: 'El código expiró. Intenta registrarte de nuevo.'
        })
      }

      if (doctor.codigoVerificacion !== codigo) {
        return res.status(400).json({
           mensaje: 'Código incorrecto'
        })
      }

      await req.app.locals.db
       .collection('doctors')
       .updateOne(
        { email },
        {
           $set: {
           verificado: true,
           codigoVerificacion: null,
           codigoExpiracion: null 
         }
       }
      )

      res.json({
       mensaje: 'Email verificado correctamente. Ya puedes iniciar sesión.'
      });
    
  } catch (error) {
     console.log(error)

     res.status(500).json({
       error: error.message
     });
  }
});

router.post('/doctors/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
         mensaje: 'Email y contraseña obligatorios'
      });
    }

    const doctor = await req.app.locals.db
      .collection('doctors')
      .findOne({ email })

      if (!doctor) {
        return res.status(400).json({
           mensaje: 'Doctor no encontrado'
        })
      }

      if (!doctor.verificado) {
        return res.status(403).json({
           mensaje: 'Debes verificar tu correo antes de iniciar sesión'
        })
      }

      const passwordValido = await bcryptjs.compare(
        password,
        doctor.password
      );
 
      if (!passwordValido) {
        return res.status(400).json({
           mensaje: 'Contraseña incorrecta'
        })
      }

      const codigoVerificacion = generarCodigoVerificacion();
      const codigoExpiracion = new Date(Date.now() + 8 * 60 * 1000);

      await req.app.locals.db
       .collection('doctors')
       .updateOne(
           { email },
           {
             $set: {
              loginCodigoVerificacion: codigoVerificacion,
              loginCodigoExpiracion: codigoExpiracion
             }
           }
        );

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Código de verificación - Inicio de sesión',
          html: `
            <h2>Inicio de sesión seguro</h2>
            <p>Hola ${doctor.name}</p>

            <p>Tu código de verificacion es:</p>

            <h1 style="font-size: 36px; color: #3b82f6; letter-spacing: 5px;">
              ${codigoVerificacion}
            </h1>

            <p>Este código es válido por 8 minutos.</p>

            <p>Si no solicitaste este código, ignora este email.</p>

          `
        })

        console.log(`✅ Email de login enviado a ${email}`);
      } catch (emailError) {
        console.log('⚠️ Error al enviar email:', emailError.message);
      }

      res.json({
        mensaje: 'Credenciales correctas. Se envió un código a tu email.'
      })

   } catch (error) {
      console.log(error);

      res.status(500).json({
        error: error.message
      });
   }
 });

 router.post('/doctors/verify-login-code', async (req, res) => {
   try  {
     const { email, codigo } = req.body;

     if (!email || !codigo) {
       return res.status(400).json({
         mensaje: 'Email y código son obligatorios'
       })
     }

     const doctor = await req.app.locals.db 
      .collection('doctors')
      .findOne({ email })

     if (!doctor) {
       return res.status(400).json({
         mensaje: 'Doctor no encontrado'
       })
     }

     if (new Date() > doctor.loginCodigoExpiracion) {
       return res.status(400).json({
         mensaje: 'EL código  expiró. Intenta iniciar sesión de nuevo.'
       })
     }

     const token = jwt.sign(
       {
         id: doctor._id,
         rol: 'doctor'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h'
      }
     );

     await req.app.locals.db
      .collection('doctors')
      .updateOne(
      { email},
      { 
         $set: {
          loginCodigoVerificacion: null,
          loginCodigoExpiracion: null
        }
      }
     );

     res.json({
        token,
        doctor,
        mensaje: 'Login exitoso'
     });

   } catch (error) {
     console.log(error)

     res.status(500).json({
        error: error.message
     });
   }
});

router.delete('/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await req.app.locals.db
     .collection('doctors')
     .deleteOne({
        _id: new ObjectId(id)   
     });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
         mensaje: 'Doctor no encontrado'
      })
    }

    res.json({
       mensaje: 'Cuenta eliminada exitosamente'
    });

  } catch (error) {
    console.log(error)

    res.status(500).json({
      error: error.message
    });
  }
})

export default router;








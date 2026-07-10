import dotenv from "dotenv";
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


router.get('/doctors', async (req, res) => {
  try {
    const doctores = await req.app.locals.db
      .collection('doctors')
      .find()
      .toArray();

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
      horarios
    } = req.body;

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
      });
    }

    const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailFormat.test(email)) {
      return res.status(400).json({
        mensaje: 'Formato de correo incorrecto'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener mínimo 6 caracteres'
      });
    }

    const doctorExistente = await req.app.locals.db
      .collection('doctors')
      .findOne({ email });

    if (doctorExistente) {
      return res.status(400).json({
        mensaje: 'Ya existe una cuenta con ese email'
      });
    }

    const passwordCifrado = await bcryptjs.hash(password, 10);

    const newDoctor = {
      name: nombre,
      email,
      password: passwordCifrado,
      especialidad,
      horarios,
      rol: 'doctor',
      verificado: false,
      createdAt: new Date()
    };

    const result = await req.app.locals.db
      .collection('doctors')
      .insertOne(newDoctor);

    const verificationToken = jwt.sign(
      {
        id: result.insertedId
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h"
      }
    );

  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

   const verificationLink =
  `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verifica tu cuenta de doctor',
        html: `
          <h2>Registro exitoso</h2>
          <p>Bienvenido ${nombre}</p>

          <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>

          <a href="${verificationLink}">
            Verificar cuenta
          </a>

          <p>Este enlace expira en 24 horas.</p>
        `
      });

      console.log(`✅ Email enviado a ${email}`);
    } catch (emailError) {
      console.log(
        '⚠️ Error al enviar email:',
        emailError.message
      );
    }

    res.status(201).json({
      mensaje:
        'Doctor registrado exitosamente. Revisa tu correo para verificar tu cuenta.'
    });

  } catch (error) {
    console.log(error);

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
      .findOne({ email });

    if (!doctor) {
      return res.status(400).json({
        mensaje: 'Doctor no encontrado'
      });
    }

    if (!doctor.verificado) {
      return res.status(403).json({
        mensaje:
          'Debes verificar tu correo antes de iniciar sesión'
      });
    }

    const passwordValido = await bcryptjs.compare(
      password,
      doctor.password
    );

    if (!passwordValido) {
      return res.status(400).json({
        mensaje: 'Contraseña incorrecta'
      });
    }

    const token = jwt.sign(
      {
        id: doctor._id,
        rol: "doctor"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h'
      }
    );

    res.json({
      token,
      doctor,
      mensaje: 'Login exitoso'
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
});


router.get('/doctors/verify/:token', async (req, res) => {
  try {
    const decoded = jwt.verify(
      req.params.token,
      process.env.JWT_SECRET
    );

    const result = await req.app.locals.db
      .collection('doctors')
      .updateOne(
        {
          _id: new ObjectId(decoded.id)
        },
        {
          $set: {
            verificado: true
          }
        }
      );

    console.log(result);

    res.json({
      mensaje: 'Correo verificado correctamente'
    });

  } catch (error) {
    console.log(error);

    res.status(400).json({
      mensaje: 'Link inválido o expirado'
    });
  }
});


router.delete('/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.app.locals.db
      .collection("doctors")
      .deleteOne({
        _id: new ObjectId(id)
      });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        mensaje: 'Doctor no encontrado'
      });
    }

    res.json({
      mensaje: 'Cuenta eliminada exitosamente'
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
});

export default router;
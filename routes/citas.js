import dovtenv from 'dotenv';
dovtenv.config();

import { Router } from "express";
import { ObjectId } from "mongodb";
import nodemailer from "nodemailer";

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

router.post('/citas', async (req, res) => {
  try {
    const { userId, doctorId, doctorName, fecha, hora, motivo } = req.body;

    if (!userId || !doctorId || !doctorName || !fecha || !hora || !motivo) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }

    const citaExistente = await req.app.locals.db
      .collection('citas')
      .findOne({ doctorId, fecha, hora });

    if (citaExistente) {
      return res.status(400).json({ mensaje: 'Esa hora ya está ocupada' });
    }

    const nuevaCita = await req.app.locals.db
      .collection('citas')
      .insertOne({ userId, doctorId, doctorName, fecha, hora, motivo });

    res.status(201).json({ mensaje: 'Cita agendada con éxito', data: nuevaCita });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al agendar cita' });
  }
});

router.get('/citas/doctor/:doctorId', async (req, res) => {
  try {
    console.log('Doctor ID buscado:', req.params.doctorId);
    
    const citas = await req.app.locals.db
      .collection('citas')
      .find({ doctorId: req.params.doctorId })
      .toArray();
    
    console.log('Citas encontradas:', citas.length);
    console.log('Citas:', citas);
    
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/citas/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const citas = await req.app.locals.db
      .collection('citas')
      .find({ userId })
      .toArray();

    res.status(200).json(citas);

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener citas' });
  }
});

router.delete('/citas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await req.app.locals.db
      .collection('citas')
      .deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({ mensaje: 'Cita eliminada con éxito' });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar cita' });
  }
});

router.post('/citas/seguimiento', async (req, res) => {
  try {
    const {
      userId,
      doctorId,
      doctorName,
      fecha,
      hora,
      motivo,
      citaAnteriorId
    } = req.body;

    if (!userId || !doctorId || !doctorName || !fecha || !hora) {
      return res.status(400).json({
        mensaje: 'Todos los campos son obligatorios'
      });
    }

    const citaExistente = await req.app.locals.db
      .collection('citas')
      .findOne({ doctorId, fecha, hora });

   if (citaExistente) {
     return res.status(400).json({
      mensaje: 'Esta hora ya está ocupada'
     });
   }

   const paciente = await req.app.locals.db
     .collection('users')
     .findOne({ _id: new ObjectId(userId) });

   if (!paciente) {
     return res.status(404).json({
       mensaje: 'Paciente no encontrado'
     });
   }

const nombreLimpio = doctorName.replace(/^(Dr\.|Dra\.)\s*/, '').trim();
const articulo = doctorName.startsWith('Dra.') ? 'La Dra.' : 'El Dr.';

 

   const citaSeguimiento = await req.app.locals.db
     .collection('citas')
     .insertOne({
        userId,
        doctorId,
        doctorName,
        fecha,
        hora,
        tipo: 'seguimiento',
        motivo: motivo || '',
        citaAnteriorId: citaAnteriorId || null,
        fechaCreacion: new Date()
      });

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: paciente.email,
          subject: 'Cita de Seguimiento Agendada Mój Lekarz',
          html: `
           <h2>¡Cita de Seguimiento Agendada!</h2>
           <p>Hola ${paciente.name}</p>

          <p>${articulo} ${nombreLimpio} ha agendado tu cita de seguimiento:</p>

          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Fecha:</strong> ${fecha}</p>
            <p><strong>⏰ Hora:</strong> ${hora}</p>
            <p><strong>👨‍⚕️ Doctor:</strong> ${doctorName}</p>
            ${motivo ? `<p><strong>📝 Motivo:</strong> ${motivo}</p>` : ''}
          </div>

          <p>Por favor, presenta con anticipación para completar el trámite.</p>

          <p>Si necesitas cancelar o cambiar la hora, contacta al consultorio.</p>
          
          <p>Saludos, <br>Mój Lekarz</p>

          
          `
        });

        console.log(`✅ Email de seguimiento enviado a ${paciente.email}`);
      } catch (emailError) {
        console.log('⚠️ Error al enviar email:', emailError.message);
      }

      res.status(201).json({
        mensaje: 'Cita de seguimiento agendada con éxito',
        data: citaSeguimiento
      });

    } catch (error) {
      res.status(500).json({
         mensaje: 'Error al agendar cita de seguimiento' 
      });
    }
});

export default router;
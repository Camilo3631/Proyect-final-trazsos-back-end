import { Router } from "express";
import { ObjectId } from "mongodb";

const router = Router();


router.post('/citas', async (req, res) => {
  try {
    const { userId, doctorId, doctorName, fecha, hora } = req.body;

    if (!userId || !doctorId || !doctorName || !fecha || !hora) {
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
      .insertOne({ userId, doctorId, doctorName, fecha, hora });

    res.status(201).json({ mensaje: 'Cita agendada con éxito', data: nuevaCita });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al agendar cita' });
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

// Eliminar cita
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

export default router;
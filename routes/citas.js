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


export default router;
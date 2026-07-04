import { Router } from "express";

const router = Router();

router.get('/disponibilidad/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;

    const citasDelDia = await req.app.locals.db
      .collection('citas')
      .find({ fecha })
      .toArray();

    const doctores = await req.app.locals.db
      .collection('doctors')
      .find()
      .toArray();

    const disponibilidad = doctores.map(doctor => {
      const horasOcupadas = citasDelDia
        .filter(cita => String(cita.doctorId) === String(doctor._id))
        .map(cita => cita.hora);

      const horasLibres = doctor.horarios.filter(
        hora => !horasOcupadas.includes(hora)
      );

      return {
        doctorId: doctor._id,
        doctorName: doctor.name,
        especialidad: doctor.especialidad,
        horasLibres,
        disponible: horasLibres.length > 0
      };
    });

    const hayDisponibilidad = disponibilidad.some(d => d.disponible);

    res.status(200).json({
      fecha,
      disponible: hayDisponibilidad,
      mensaje: hayDisponibilidad ? '✅ Hay citas disponibles para esta fecha' : '❌ No hay citas disponibles para esta fecha',
      doctores: disponibilidad
    });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar disponibilidad' });
  }
});

export default router;
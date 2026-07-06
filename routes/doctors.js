import { Router } from 'express';

const router = Router();

router.get('/doctors', async (req, res) => {
    try {
      const doctores = await req.app.locals.db
        .collection('doctors')
        .find()
        .toArray();

        res.status(200).json(doctores);
     } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener doctores' });
     }
 })

 export default router;




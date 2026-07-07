import { Router } from "express";
import { ObjectId } from "mongodb";

const router = Router();

router.get('/users/:id', async (req, res) => {
  try {
    const usuario = await req.app.locals.db
     .collection('users')
     .findOne(
       {_id: new ObjectId(req.params.id) },
       { projection: { password: 0}}
     );

     if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado'});
   }

   res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuario'});
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name } = req.body;

     if (!name) {
        return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
     }

    await req.app.locals.db
      .collection('users')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { name } }
      );

     res.status(200).json({ mensaje: 'Nombre actualizado con éxito'}); 
   } catch (error) {
     res.status(500).json({ mensaje: 'Error al actualizar nombre'});
   }
});

router.delete('/users/:id', async (req, res) => {
    try {
      await req.app.locals.db
       .collection('users')
       .deleteOne({ _id: new ObjectId(req.params.id) })

       res.status(200).json({ mensaje: 'Cuenta eliminada con éxito'});
    } catch (error) {
       res.status(500).json({mensaje: 'Error al eliminar cuenta'});
   }
});

export default router;







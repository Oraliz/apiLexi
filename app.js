const express = require("express");
const admin = require("firebase-admin");
//const serviceAccount = require("./firebase-service-account.json");
const cors= require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ||3000;
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
// Inicializar Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
admin.auth().setPersistence

const db = admin.firestore(); 

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("Hola");
});

//Agregar ejercicios
app.post("/ejercicios", async (req,res) =>{
    try{
        const ejercicio= req.body;
        const docRef = await db.collection("ejercicios").add(ejercicio);
        res.status(201).json({ 
            message: 'Ejercicio registrado exitosamente',
            id: docRef.id,
            data: ejercicio
        });
    }catch(error){
        res.status(500).json({error:'Error al registrar ejercicio'})
    }
});

// Obtener usuarios
app.get("/ejercicios",async(req,res)=>{
    try{
        const snapshot = await db.collection("ejercicios").get();
        const ejercicios = snapshot.docs.map(doc => ({id:doc.id, ...doc.data()}));
        res.json(ejercicios);
    } catch (error){
        res.status(500).json({error: 'Error al obtener los ejercicios'})
    }
});

//Eliminar ejercicios
app.delete("/ejercicios/:id", async (req,res)=>{
    try{
        const {id} = req.params;
        await db.collection ("ejercicios").doc(id).delete()
        res.status(201).json({message:'Ejercicio eliminado correctamente'})
    }catch(error){
        res.status(500).json({error:'Error al eliminar ejercicio'})
    }
});

//Actualizar usuarios
app.put("/ejercicios/:id", async (req,res) =>{
    try{
        const {id} = req.params;
        const {instruccion} = req.body;
        await db.collection ("ejercicios").doc(id).update({instruccion})
        res.status(201).json({message:'Usuario actualizado correctamente'})
    } catch (error){
        res.status(500).json({error:'Error al altualizar'})
    }
});

app.listen(PORT,() => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
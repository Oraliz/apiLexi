const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const serviceAccount = JSON.parse(
    process.env.FIREBASE_CONFIG.replace(/\b/g, "").replace(/\r/g, "")
);

// Inicializar Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "tu-proyecto.appspot.com" // 👈 cambia por tu bucket real
});

// Referencias
const db = admin.firestore();
const bucket = admin.storage().bucket();

// Configuración de multer (para manejar archivos en memoria)
const upload = multer({ storage: multer.memoryStorage() });

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("Hola");
});

// Agregar ejercicios con imagen
app.post("/addejercicios", upload.single("imagen"), async (req, res) => {
    try {
        const ejercicio = JSON.parse(req.body.data); // datos del ejercicio enviados como JSON
        let imageUrl = null;

        if (req.file) {
        const fileName = `ejercicios/${Date.now()}_${req.file.originalname}`;
        const file = bucket.file(fileName);

        await file.save(req.file.buffer, {
            metadata: { contentType: req.file.mimetype },
        });

        // Hacer pública la imagen
        await file.makePublic();
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        }

        // Guardar en Firestore con la URL de la imagen
        const docRef = await db.collection("ejercicios").add({
        ...ejercicio,
        imagen: imageUrl,
        });

        res.status(201).json({
        message: "Ejercicio registrado exitosamente",
        id: docRef.id,
        data: { ...ejercicio, imagen: imageUrl },
        });
    } catch (error) {
        console.error("Error al registrar ejercicio:", error);
        res.status(500).json({ error: "Error al registrar ejercicio" });
    }
});

// Obtener ejercicios
app.get("/getejercicios", async (req, res) => {
    try {
        const snapshot = await db.collection("ejercicios").get();
        const ejercicios = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        }));
        res.json(ejercicios);
    } catch (error) {
        console.error("Error en getejercicios:", error);
        res.status(500).json({ error: "Error al obtener los ejercicios" });
    }
});

// Eliminar ejercicios
app.delete("/ejercicios/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection("ejercicios").doc(id).delete();
        res.status(201).json({ message: "Ejercicio eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar ejercicio" });
    }
});

// Actualizar ejercicios
app.put("/ejercicios/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { instruccion } = req.body;
        await db.collection("ejercicios").doc(id).update({ instruccion });
        res.status(201).json({ message: "Ejercicio actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

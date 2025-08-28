const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Usuário fixo
const USER = "nadilson";
const PASS = "nadilsonesusan";

// Configurar uploads
const storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, "uploads/"), filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),});
const upload = multer({ storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use( session({ secret: "chave-secreta", resave: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Armazenamento simples em memória
let items = [];

// Login
app.post("/login", (req, res) => {const { username, password } = req.body; if (username === USER && password === PASS) { req.session.loggedIn = true;
return res.redirect("/index.html"); } else { return res.send( "<h2>Usuário ou senha incorretos!</h2><a href='/login.html'>Voltar</a>"); }
});

// Middleware de autenticação
function authMiddleware(req, res, next) { if (req.session.loggedIn) next(); else res.status(401).send("Não autorizado. Faça login primeiro.");}

// Adicionar item
app.post("/add-item", authMiddleware, upload.single("image"), (req, res) => { const { name, films, quantity } = req.body; const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
const newItem = { name, films, quantity, image: imagePath }; items.push(newItem);

res.json({
    success: true,
    message: "Item salvo com sucesso!",
    item: newItem,
});
});

// Editar item
app.post("/edit-item", authMiddleware, upload.single("image"), (req, res) => {
const { index, name, films, quantity } = req.body;
if (index >= 0 && index < items.length) {
    const item = items[index];
    item.name = name;
    item.films = films;
    item.quantity = quantity;

if (req.file) {
    if (item.image) {
        const oldPath = path.join(__dirname, item.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    item.image = `/uploads/${req.file.filename}`;
    }

    return res.json({
    success: true,
    message: "Item editado com sucesso!",
    item,
    });
}
res.status(400).json({ success: false, message: "Índice inválido." });
});

// Excluir item
app.post("/delete-item", authMiddleware, (req, res) => {
const { index } = req.body;
if (index >= 0 && index < items.length) {
    const imagePath = items[index].image;
    if (imagePath) {
    const filePath = path.join(__dirname, imagePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    items.splice(index, 1);
    return res.json({ success: true, message: "Item excluído com sucesso!" });
}
  res.status(400).json({ success: false, message: "Índice inválido." });
});

// Listar itens
app.get("/items", (req, res) => res.json(items));

// Iniciar servidor
app.listen(PORT, () =>
console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
);

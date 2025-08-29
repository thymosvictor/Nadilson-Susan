const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Usuário fixo
const USER = "nadilson";
const PASS = "nadilsonesusan";

// Configurar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: "chave-secreta", resave: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Banco de dados SQLite
const db = new sqlite3.Database('./items.db');  // Cria o banco de dados

// Criar tabela se não existir
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL, quantity INTEGER, image TEXT)");
});

// Login
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username === USER && password === PASS) {
        req.session.loggedIn = true;
        return res.redirect("/index.html");
    } else {
        return res.send("<h2>Usuário ou senha incorretos!</h2><a href='/login.html'>Voltar</a>");
    }
});

// Middleware de autenticação
function authMiddleware(req, res, next) {
    if (req.session.loggedIn) next();
    else res.status(401).send("Não autorizado. Faça login primeiro.");
}

// Adicionar item
app.post("/add-item", authMiddleware, upload.single("image"), (req, res) => {
    const { name, price, quantity } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const stmt = db.prepare("INSERT INTO items (name, price, quantity, image) VALUES (?, ?, ?, ?)");
    stmt.run(name, price, quantity, imagePath, function (err) {
        if (err) {
            return res.status(500).json({ success: false, message: "Erro ao salvar item." });
        }
        res.json({ success: true, message: "Item salvo com sucesso!" });
    });
    stmt.finalize();
});

// Editar item
app.post("/edit-item", authMiddleware, upload.single("image"), (req, res) => {
    const { index, name, price, quantity } = req.body;
    if (index >= 0) {
        const stmt = db.prepare("UPDATE items SET name = ?, price = ?, quantity = ?, image = ? WHERE id = ?");
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        stmt.run(name, price, quantity, imagePath, index, function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: "Erro ao editar item." });
            }
            res.json({ success: true, message: "Item editado com sucesso!" });
        });
        stmt.finalize();
    } else {
        res.status(400).json({ success: false, message: "Índice inválido." });
    }
});

// Excluir item
app.post("/delete-item", authMiddleware, (req, res) => {
    const { index } = req.body;
    if (index >= 0) {
        const stmt = db.prepare("DELETE FROM items WHERE id = ?");
        stmt.run(index, function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: "Erro ao excluir item." });
            }
            res.json({ success: true, message: "Item excluído com sucesso!" });
        });
        stmt.finalize();
    } else {
        res.status(400).json({ success: false, message: "Índice inválido." });
    }
});

// Listar itens
app.get("/items", (req, res) => {
    db.all("SELECT * FROM items", [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

// Iniciar servidor
app.listen(PORT, () =>
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
);


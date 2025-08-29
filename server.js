const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Carregar variáveis de ambiente
dotenv.config();

// Conexão com o MongoDB Atlas usando mongoose
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("🚀 Conectado ao MongoDB Atlas"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB Atlas:", err));

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

// Modelo Item
const Item = mongoose.model("Item", new mongoose.Schema({
  name: String,
  films: String,
  quantity: Number,
  image: String,
}));

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
app.post("/add-item", authMiddleware, upload.single("image"), async (req, res) => {
  const { name, films, quantity } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const newItem = new Item({ name, films, quantity, image: imagePath });
    await newItem.save();

    res.json({
      success: true,
      message: "Item salvo com sucesso!",
      item: newItem,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao salvar item.", error: err.message });
  }
});

// Editar item
app.post("/edit-item", authMiddleware, upload.single("image"), async (req, res) => {
  const { id, name, films, quantity } = req.body;
  if (!id) return res.status(400).json({ success: false, message: "ID é obrigatório." });

  try {
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Item não encontrado." });

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

    await item.save();

    res.json({
      success: true,
      message: "Item editado com sucesso!",
      item,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao editar item.", error: err.message });
  }
});

// Excluir item
app.post("/delete-item", authMiddleware, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: "ID do item é necessário." });

  try {
    const item = await Item.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: "Item não encontrado." });

    // Exclui a imagem se houver
    if (item.image) {
      const filePath = path.join(__dirname, item.image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: "Item excluído com sucesso!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao excluir item.", error: err.message });
  }
});

// Listar itens
app.get("/items", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ success: false, message: "Erro ao listar itens.", error: err.message });
  }
});

// Iniciar servidor
app.listen(PORT, () =>
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
);


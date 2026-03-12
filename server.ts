import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import fs from "fs";

const db = new Database("menu.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image TEXT,
    price REAL NOT NULL,
    service_time INTEGER, -- in minutes
    category_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
  );
`);

// Seed initial data if empty
const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const insertCategory = db.prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
  insertCategory.run("Khai vị", "Các món ăn nhẹ đầu bữa");
  insertCategory.run("Món chính", "Các món ăn no, giàu đạm");
  insertCategory.run("Tráng miệng", "Đồ ngọt, trái cây sau bữa ăn");
  insertCategory.run("Đồ uống", "Nước giải khát, rượu, bia");

  const insertDish = db.prepare("INSERT INTO dishes (name, image, price, service_time, category_id) VALUES (?, ?, ?, ?, ?)");
  insertDish.run("Gỏi cuốn", "https://picsum.photos/seed/goicuon/400/300", 55000, 10, 1);
  insertDish.run("Phở bò", "https://picsum.photos/seed/phobo/400/300", 65000, 15, 2);
  insertDish.run("Chè ba màu", "https://picsum.photos/seed/che/400/300", 25000, 5, 3);
  insertDish.run("Cà phê sữa đá", "https://picsum.photos/seed/coffee/400/300", 30000, 5, 4);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Categories
  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", (req, res) => {
    const { name, description } = req.body;
    const result = db.prepare("INSERT INTO categories (name, description) VALUES (?, ?)").run(name, description);
    res.json({ id: result.lastInsertRowid, name, description });
  });

  app.put("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    db.prepare("UPDATE categories SET name = ?, description = ? WHERE id = ?").run(name, description, id);
    res.json({ id: Number(id), name, description });
  });

  app.delete("/api/categories/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Dishes
  app.get("/api/dishes", (req, res) => {
    const { category_id, min_price, max_price, max_time, search } = req.query;
    let query = `
      SELECT dishes.*, categories.name as category_name 
      FROM dishes 
      LEFT JOIN categories ON dishes.category_id = categories.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category_id) {
      query += " AND dishes.category_id = ?";
      params.push(category_id);
    }
    if (min_price) {
      query += " AND dishes.price >= ?";
      params.push(min_price);
    }
    if (max_price) {
      query += " AND dishes.price <= ?";
      params.push(max_price);
    }
    if (max_time) {
      query += " AND dishes.service_time <= ?";
      params.push(max_time);
    }
    if (search) {
      query += " AND dishes.name LIKE ?";
      params.push(`%${search}%`);
    }

    const dishes = db.prepare(query).all(...params);
    res.json(dishes);
  });

  app.post("/api/dishes", (req, res) => {
    const { name, image, price, service_time, category_id } = req.body;
    const result = db.prepare("INSERT INTO dishes (name, image, price, service_time, category_id) VALUES (?, ?, ?, ?, ?)").run(name, image, price, service_time, category_id);
    res.json({ id: result.lastInsertRowid, name, image, price, service_time, category_id });
  });

  app.put("/api/dishes/:id", (req, res) => {
    const { id } = req.params;
    const { name, image, price, service_time, category_id } = req.body;
    db.prepare("UPDATE dishes SET name = ?, image = ?, price = ?, service_time = ?, category_id = ? WHERE id = ?").run(name, image, price, service_time, category_id, id);
    res.json({ id: Number(id), name, image, price, service_time, category_id });
  });

  app.delete("/api/dishes/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM dishes WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

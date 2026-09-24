const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const db = new Database("app.db");

db.exec(`
	CREATE TABLE IF NOT EXISTS products (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		price REAL NOT NULL,
		stock INTEGER NOT NULL
	)
`);

app.get("/api/products", (req, res) => {
	let sql = "SELECT * FROM products WHERE 1 = 1";
	const params = [];

	if (req.query.minPrice !== undefined) {
		sql += " AND price >= ?";
		params.push(Number(req.query.minPrice));
	}
	if (req.query.maxPrice !== undefined) {
		sql += " AND price <= ?";
		params.push(Number(req.query.maxPrice));
	}

	const rows = db.prepare(sql).all(...params);
	res.json(rows);
});

app.post("/api/products", (req, res) => {
	const { name, price, stock } = req.body;

	if (typeof name !== "string" || name.trim() === "") {
		return res.status(400).json({ error: "name must be a non-empty string" });
	}
	if (typeof price !== "number" || price < 0) {
		return res.status(400).json({ error: "price must be a non-negative number" });
	}
	if (typeof stock !== "number" || stock < 0) {
		return res.status(400).json({ error: "stock must be a non-negative number" });
	}

	const info = db
		.prepare("INSERT INTO products (name, price, stock) VALUES (?, ?, ?)")
		.run(name, price, stock);

	res.status(201).json({ id: info.lastInsertRowid, name, price, stock });
});

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});

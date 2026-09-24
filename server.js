const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const db = new Database("app.db");

db.exec(`
	CREATE TABLE IF NOT EXISTS products (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL CHECK(length(trim(name)) > 0),
		price REAL NOT NULL CHECK(price >= 0),
		stock INTEGER NOT NULL CHECK(stock >= 0)
	)
`);

app.get("/api/products", (req, res) => {
	let sql = "SELECT * FROM products WHERE 1 = 1";
	const params = [];

	if (req.query.minPrice !== undefined) {
		const minPrice = Number(req.query.minPrice);

		if (!Number.isFinite(minPrice) || minPrice < 0) {
			return res.status(400).json({
				error: "minPrice must be a non-negative number",
			});
		}

		sql += " AND price >= ?";
		params.push(minPrice);
	}

	if (req.query.maxPrice !== undefined) {
		const maxPrice = Number(req.query.maxPrice);

		if (!Number.isFinite(maxPrice) || maxPrice < 0) {
			return res.status(400).json({
				error: "maxPrice must be a non-negative number",
			});
		}

		sql += " AND price <= ?";
		params.push(maxPrice);
	}

	if (
		req.query.minPrice !== undefined &&
		req.query.maxPrice !== undefined
	) {
		const minPrice = Number(req.query.minPrice);
		const maxPrice = Number(req.query.maxPrice);

		if (minPrice > maxPrice) {
			return res.status(400).json({
				error: "minPrice must be less than or equal to maxPrice",
			});
		}
	}

	const rows = db.prepare(sql).all(...params);
	res.json(rows);
});

app.post("/api/products", (req, res) => {
	const { name, price, stock } = req.body;

	if (typeof name !== "string" || name.trim() === "") {
		return res.status(400).json({
			error: "name must be a non-empty string",
		});
	}

	if (!Number.isFinite(price) || price < 0) {
		return res.status(400).json({
			error: "price must be a non-negative number",
		});
	}

	if (!Number.isInteger(stock) || stock < 0) {
		return res.status(400).json({
			error: "stock must be a non-negative integer",
		});
	}

	const cleanName = name.trim();

	const info = db
		.prepare("INSERT INTO products (name, price, stock) VALUES (?, ?, ?)")
		.run(cleanName, price, stock);

	res.status(201).json({
		id: info.lastInsertRowid,
		name: cleanName,
		price,
		stock,
	});
});

app.patch("/api/products/:id", (req, res) => {
	const { stock } = req.body;

	if (!Number.isInteger(stock) || stock < 0) {
		return res.status(400).json({
			error: "stock must be a non-negative integer",
		});
	}

	const info = db
		.prepare("UPDATE products SET stock = ? WHERE id = ?")
		.run(stock, req.params.id);

	if (info.changes === 0) {
		return res.status(404).json({ error: "Product not found" });
	}

	res.json({ id: Number(req.params.id), stock });
});

app.delete("/api/products/:id", (req, res) => {
	const info = db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);

	if (info.changes === 0) {
		return res.status(404).json({ error: "Product not found" });
	}

	res.status(204).end();
});

app.use((err, req, res, next) => {
	console.error(err);

	res.status(500).json({
		error: "internal server error",
	});
});

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});
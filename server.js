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

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});

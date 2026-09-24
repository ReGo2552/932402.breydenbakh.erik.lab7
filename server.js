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

function getProducts(minPrice, maxPrice) {
	let sql = "SELECT id, name, price, stock FROM products WHERE 1 = 1";
	const params = [];

	if (minPrice !== undefined) {
		sql += " AND price >= ?";
		params.push(minPrice);
	}

	if (maxPrice !== undefined) {
		sql += " AND price <= ?";
		params.push(maxPrice);
	}

	return db.prepare(sql).all(...params);
}

function createProduct(name, price, stock) {
	return db
		.prepare(
			"INSERT INTO products (name, price, stock) VALUES (?, ?, ?)"
		)
		.run(name, price, stock);
}

function updateProductStock(id, stock) {
	return db
		.prepare("UPDATE products SET stock = ? WHERE id = ?")
		.run(stock, id);
}

function deleteProduct(id) {
	return db
		.prepare("DELETE FROM products WHERE id = ?")
		.run(id);
}

app.get("/api/products", (req, res) => {
	let minPrice;
	let maxPrice;

	if (req.query.minPrice !== undefined) {
		minPrice = Number(req.query.minPrice);

		if (!Number.isFinite(minPrice) || minPrice < 0) {
			return res.status(400).json({
				error: "minPrice must be a non-negative number",
			});
		}
	}

	if (req.query.maxPrice !== undefined) {
		maxPrice = Number(req.query.maxPrice);

		if (!Number.isFinite(maxPrice) || maxPrice < 0) {
			return res.status(400).json({
				error: "maxPrice must be a non-negative number",
			});
		}
	}

	if (
		minPrice !== undefined &&
		maxPrice !== undefined &&
		minPrice > maxPrice
	) {
		return res.status(400).json({
			error: "minPrice must be less than or equal to maxPrice",
		});
	}

	const products = getProducts(minPrice, maxPrice);

	res.json(products);
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

	const info = createProduct(cleanName, price, stock);

	res.status(201).json({
		id: info.lastInsertRowid,
		name: cleanName,
		price,
		stock,
	});
});

app.patch("/api/products/:id", (req, res) => {
	const id = Number(req.params.id);

	if (!Number.isInteger(id) || id <= 0) {
		return res.status(400).json({
			error: "id must be a positive integer",
		});
	}

	const keys = Object.keys(req.body);

	if (keys.length !== 1 || keys[0] !== "stock") {
		return res.status(400).json({
			error: "only stock can be updated",
		});
	}

	const { stock } = req.body;

	if (!Number.isInteger(stock) || stock < 0) {
		return res.status(400).json({
			error: "stock must be a non-negative integer",
		});
	}

	const info = updateProductStock(id, stock);

	if (info.changes === 0) {
		return res.status(404).json({
			error: "Product not found",
		});
	}

	res.json({
		id,
		stock,
	});
});

app.delete("/api/products/:id", (req, res) => {
	const id = Number(req.params.id);

	if (!Number.isInteger(id) || id <= 0) {
		return res.status(400).json({
			error: "id must be a positive integer",
		});
	}

	const info = deleteProduct(id);

	if (info.changes === 0) {
		return res.status(404).json({
			error: "Product not found",
		});
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
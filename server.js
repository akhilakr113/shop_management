const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// ─── API Routes (must come before static) ────────────────────────────────────

app.get("/api/item-types", (req, res) => {
  const sql = "SELECT * FROM item_types";

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: err.sqlMessage });
    }
    res.json(result);
  });
});

app.get("/api/view-items", (req, res) => {
  const sql = `
    SELECT
      items.id,
      items.name,
      items.price,
      items.stock_quantity,
      item_types.type_name
    FROM items
    LEFT JOIN item_types
      ON items.item_type_id = item_types.id
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.sqlMessage });
    }
    res.json(result);
  });
});

app.post("/api/items", (req, res) => {
  const { name, price, stock_quantity, item_type_id } = req.body;

  const sql = `
    INSERT INTO items (name, price, stock_quantity, item_type_id)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, price, stock_quantity, item_type_id], (err, result) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.status(500).json({ message: err.sqlMessage });
    }
    res.json({
      message: "Item added successfully",
      id: result.insertId
    });
  });
});

app.post("/api/orders", (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No items selected" });
  }

  const orderSql = "INSERT INTO orders () VALUES ()";

  db.query(orderSql, (err, orderResult) => {
    if (err) return res.status(500).json({ message: err.sqlMessage });

    const orderId = orderResult.insertId;

    const orderItemValues = items.map(({ item_id, quantity }) => [orderId, item_id, quantity]);
    const itemSql = "INSERT INTO order_items (order_id, item_id, quantity) VALUES ?";

    db.query(itemSql, [orderItemValues], (err2) => {
      if (err2) return res.status(500).json({ message: err2.sqlMessage });

      res.json({ message: "Order placed successfully", order_id: orderId });
    });
  });
});

app.get("/api/orders", (req, res) => {
  const sql = `
    SELECT
      o.id AS order_id,
      o.created_at,
      i.name AS item_name,
      i.price,
      oi.quantity,
      (i.price * oi.quantity) AS subtotal
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN items i ON oi.item_id = i.id
    ORDER BY o.id DESC, oi.id ASC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: err.sqlMessage });
    res.json(result);
  });
});

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});


app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

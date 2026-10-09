const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dataDir = path.join(__dirname, 'data')
fs.mkdirSync(dataDir, { recursive: true })

const dbPath = path.join(dataDir, 'stockshare.db')
const db = new Database(dbPath)

module.exports = db

db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    location TEXT NOT NULL,
    status TEXT DEFAULT 'Available',
    description TEXT,
    business TEXT    
    )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS inventory_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
  )
`)

try {
  db.prepare(`
    ALTER TABLE inventory_requests
    ADD COLUMN requester_business TEXT
  `).run()
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    throw error
  }
}


const count = db
    .prepare('SELECT COUNT(*) AS count FROM inventory')
    .get()

if(count.count === 0){
    const insert = db.prepare(`
        INSERT INTO inventory
        (name, category, quantity, location, status, description, business)
        VALUES (?, ?, ?, ?, ?, ? ,?)
        `)
    insert.run(
        'Cardboard Boxes',
        'Packaging',
        500,
        'Madurai',
        'Available',
        'Unused cardboard boxes available for businesses requiring packaging.',
        'ABC Manufacturing'
    )
    insert.run(
        'Plastic Containers',
        'Storage',
        250,
        'Chennai',
        'Available',
        'Reusable plastic containers suitable for storage and transportation.',
        'Chennai Industrial Supplies'
    )

    insert.run(
        'Unused Office Chairs',
        'Furniture',
        40,
        'Coimbatore',
        'Available',
        'Good-condition office chairs available after an office renovation.',
        'Coimbatore Business Solutions'
    )

    insert.run(
        'Wooden Pallets',
        'Logistics',
        120,
        'Bengaluru',
        'Available',
        'Wooden pallets available for logistics and warehouse operations.',
        'Bengaluru Logistics Hub'
    )   
}
module.exports = db
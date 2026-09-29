const express = require('express')
const cors = require('cors')

const db = require('./db')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'StockShare backend is running'
  })
})

app.get('/api/inventory', (req, res) => {
    const inventory = db.prepare('SELECT * FROM inventory').all()

    res.json(inventory)
})

app.post('/api/inventory', (req, res) => {
    const {
        name,
        category,
        quantity,
        location,
        status,
        description,
        business
    } = req.body

    const result = db.prepare(`
        INSERT INTO inventory
        (name, category, quantity, location, status, description, business)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .run (
            name,
            category,
            quantity,
            location,
            status || 'Available',
            description,
            business
        )

    res.json({
        message: 'Inventory added successfully',
        id: result.lastInsertRowid
    })

})

app.post('/api/requests', (req, res) => {
  const {
    inventory_id,
    requester_business,
    quantity,
    message
  } = req.body

  const inventoryItem = db
    .prepare('SELECT * FROM inventory WHERE id = ?')
    .get(inventory_id)

  if (!inventoryItem) {
    return res.status(404).json({
      message: 'Inventory item not found'
    })
  }

  if (!requester_business || !requester_business.trim()) {
    return res.status(400).json({
      message: 'Please enter your business name'
    })
  }

  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      message: 'Please enter a valid quantity'
    })
  }

  if (quantity > inventoryItem.quantity) {
    return res.status(400).json({
      message: `Only ${inventoryItem.quantity} units are available`
    })
  }

  const result = db
    .prepare(`
      INSERT INTO inventory_requests
      (inventory_id, requester_business, quantity, message)
      VALUES (?, ?, ?, ?)
    `)
    .run(
      inventory_id,
      requester_business.trim(),
      quantity,
      message
    )

  res.json({
    message: 'Request submitted successfully',
    id: result.lastInsertRowid
  })
})


app.get('/api/requests', (req, res) => {
  const requests = db
    .prepare(`
      SELECT
        inventory_requests.id,
        inventory_requests.inventory_id,
        inventory.name AS inventory_name,
        inventory.business AS owner_business,
        inventory_requests.requester_business,
        inventory_requests.quantity,
        inventory_requests.message,
        inventory_requests.status,
        inventory_requests.created_at
      FROM inventory_requests
      JOIN inventory
        ON inventory_requests.inventory_id = inventory.id
      ORDER BY inventory_requests.id DESC
    `)
    .all()

  res.json(requests)
})

app.get('/api/requests/my', (req, res) => {
  const { business } = req.query

  if (!business) {
    return res.status(400).json({
      message: 'Business name is required'
    })
  }

  const requests = db
    .prepare(`
      SELECT
        inventory_requests.id,
        inventory_requests.inventory_id,
        inventory.name AS inventory_name,
        inventory.business AS owner_business,
        inventory_requests.requester_business,
        inventory_requests.quantity,
        inventory_requests.message,
        inventory_requests.status,
        inventory_requests.created_at
      FROM inventory_requests
      JOIN inventory
        ON inventory_requests.inventory_id = inventory.id
      WHERE LOWER(inventory_requests.requester_business) = LOWER(?)
      ORDER BY inventory_requests.id DESC
    `)
    .all(business.trim())

  res.json(requests)
})

app.patch('/api/inventory/:id', (req, res) => {
    const {id} = req.params
    const {quantity} = req.body

    if(quantity === undefined || quantity < 0) {
        return res.status(400).json({
            message: 'Please enter a valid quantity'
        })
    }

    const inventoryItem = db.prepare(`SELECT * FROM inventory WHERE id = ?`).get(id)

    if(!inventoryItem){
        return res.status(404).json({
            message: 'Inventory'
        })
    }

    db.prepare(`
        UPDATE inventory
        SET quantity = ?,
        status = CASE 
        WHEN ? = 0 then 'Unavailable'
        ELSE 'Available'
        END
        WHERE id = ?   
    `).run(quantity, quantity, id)
    
    res.json({
        message: 'Inventory updated successfully'
    })
})

app.delete('/api/inventory/:id', (req, res) => {
  const { id } = req.params

  const inventoryItem = db
    .prepare('SELECT * FROM inventory WHERE id = ?')
    .get(id)

  if (!inventoryItem) {
    return res.status(404).json({
      message: 'Inventory item not found'
    })
  }

  const requests = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM inventory_requests
      WHERE inventory_id = ?
    `)
    .get(id)

  if (requests.count > 0) {
    return res.status(409).json({
      message: 'Cannot delete inventory because requests are associated with it.'
    })
  }

  db
    .prepare('DELETE FROM inventory WHERE id = ?')
    .run(id)

  res.json({
    message: 'Inventory deleted successfully'
  })
})

app.patch('/api/requests/:id', (req, res) => {
  const { status } = req.body
  const { id } = req.params

  if (status !== 'Approved' && status !== 'Rejected') {
    return res.status(400).json({
      message: 'Invalid request status'
    })
  }

  try {
    const updateRequest = db.transaction(() => {
      const request = db
        .prepare(`
          SELECT *
          FROM inventory_requests
          WHERE id = ?
        `)
        .get(id)

      if (!request) {
        throw new Error('REQUEST_NOT_FOUND')
      }

      if (request.status !== 'Pending') {
        throw new Error('REQUEST_ALREADY_PROCESSED')
      }

      if (status === 'Approved') {
        const inventoryUpdate = db
          .prepare(`
            UPDATE inventory
            SET quantity = quantity - ?
            WHERE id = ?
              AND quantity >= ?
          `)
          .run(
            request.quantity,
            request.inventory_id,
            request.quantity
          )

        if (inventoryUpdate.changes === 0) {
          throw new Error('INSUFFICIENT_STOCK')
        }
      }

      db
        .prepare(`
          UPDATE inventory_requests
          SET status = ?
          WHERE id = ?
        `)
        .run(status, id)
    })

    updateRequest()

    res.json({
      message: `Request ${status.toLowerCase()} successfully`
    })
    }
    catch (error) {
        if (error.message === 'REQUEST_NOT_FOUND') {
        return res.status(404).json({
            message: 'Request not found'
        })
        }

        if (error.message === 'REQUEST_ALREADY_PROCESSED') {
        return res.status(400).json({
            message: 'Request has already been processed'
        })
        }

        if (error.message === 'INSUFFICIENT_STOCK') {
        return res.status(409).json({
            message: 'Not enough inventory available'
        })
        }

        console.error(error)

        res.status(500).json({
        message: 'Failed to update request'
        })
    }
})



app.listen(5000, () => {
  console.log('Server running on http://localhost:5000')
})
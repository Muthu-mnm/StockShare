const express = require('express')
const cors = require('cors')
const promClient = require('prom-client')

const db = require('./db')

const app = express()

// Prometheus Registry and Metrics
const register = new promClient.Registry()
register.setDefaultLabels({ app: 'stockshare-backend' })

promClient.collectDefaultMetrics({ register })

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
})

const httpRequestDurationSeconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
})

// Business Metrics
const inventoryItemsMetric = new promClient.Gauge({
  name: 'stockshare_inventory_items',
  help: 'Total number of distinct inventory items in StockShare',
  registers: [register],
})

const inventoryUnitsMetric = new promClient.Gauge({
  name: 'stockshare_inventory_units',
  help: 'Total number of available inventory units in StockShare',
  registers: [register],
})

const pendingRequestsMetric = new promClient.Gauge({
  name: 'stockshare_pending_requests',
  help: 'Total number of pending inventory requests in StockShare',
  registers: [register],
})

const approvedRequestsMetric = new promClient.Gauge({
  name: 'stockshare_approved_requests',
  help: 'Total number of approved inventory requests in StockShare',
  registers: [register],
})

const rejectedRequestsMetric = new promClient.Gauge({
  name: 'stockshare_rejected_requests',
  help: 'Total number of rejected inventory requests in StockShare',
  registers: [register],
})

const sqliteUpMetric = new promClient.Gauge({
  name: 'stockshare_sqlite_up',
  help: 'Status of the SQLite database connectivity (1 for UP, 0 for DOWN)',
  registers: [register],
})

function updateBusinessMetrics() {
  try {
    const isHealthy = db.checkHealth()
    sqliteUpMetric.set(isHealthy ? 1 : 0)

    if (!isHealthy) return

    const invStats = db
      .prepare(
        'SELECT COUNT(*) AS total_items, COALESCE(SUM(quantity), 0) AS total_units FROM inventory'
      )
      .get()

    inventoryItemsMetric.set(invStats.total_items || 0)
    inventoryUnitsMetric.set(invStats.total_units || 0)

    const reqStats = db
      .prepare(
        `SELECT
          COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) AS pending_count,
          COALESCE(SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END), 0) AS approved_count,
          COALESCE(SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END), 0) AS rejected_count
        FROM inventory_requests`
      )
      .get()

    pendingRequestsMetric.set(reqStats.pending_count || 0)
    approvedRequestsMetric.set(reqStats.approved_count || 0)
    rejectedRequestsMetric.set(reqStats.rejected_count || 0)
  } catch (err) {
    sqliteUpMetric.set(0)
  }
}

// Global Middlewares
app.use(cors())
app.use(express.json())

// HTTP Metrics Tracking Middleware
app.use((req, res, next) => {
  const start = process.hrtime()

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start)
    const duration = seconds + nanoseconds / 1e9

    // Normalize path to avoid high-cardinality label explosion
    let route = req.baseUrl || ''
    if (req.route && req.route.path) {
      route += req.route.path
    } else {
      route += req.path
        .replace(/\/api\/inventory\/\d+/, '/api/inventory/:id')
        .replace(/\/api\/requests\/\d+/, '/api/requests/:id')
    }

    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode,
    })

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route: route,
        status_code: res.statusCode,
      },
      duration
    )
  })

  next()
})

// Root & Health Endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'StockShare backend is running',
    version: '1.0.0',
  })
})

app.get('/health', (req, res) => {
  const isHealthy = db.checkHealth()
  const payload = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    database: isHealthy ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }

  if (isHealthy) {
    res.status(200).json(payload)
  } else {
    res.status(503).json(payload)
  }
})

// Metrics Endpoint for Prometheus scraping
app.get('/metrics', async (req, res) => {
  try {
    updateBusinessMetrics()
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
  } catch (err) {
    res.status(500).end(err.message)
  }
})

// Dashboard Summary API
app.get('/api/dashboard/summary', (req, res) => {
  try {
    const isHealthy = db.checkHealth()
    if (!isHealthy) {
      return res.status(503).json({ message: 'Database unavailable' })
    }

    const invStats = db
      .prepare(
        'SELECT COUNT(*) AS total_items, COALESCE(SUM(quantity), 0) AS total_units FROM inventory'
      )
      .get()

    const reqStats = db
      .prepare(
        `SELECT
          COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) AS pending_requests,
          COALESCE(SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END), 0) AS approved_requests,
          COALESCE(SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END), 0) AS rejected_requests,
          COUNT(*) AS total_requests
        FROM inventory_requests`
      )
      .get()

    const categoryBreakdown = db
      .prepare(
        `SELECT
          category,
          COUNT(*) AS count,
          COALESCE(SUM(quantity), 0) AS total_units
        FROM inventory
        GROUP BY category
        ORDER BY total_units DESC`
      )
      .all()

    const recentRequests = db
      .prepare(
        `SELECT
          inventory_requests.id,
          inventory_requests.inventory_id,
          inventory.name AS inventory_name,
          inventory.business AS owner_business,
          inventory_requests.requester_business,
          inventory_requests.quantity,
          inventory_requests.status,
          inventory_requests.created_at
        FROM inventory_requests
        JOIN inventory ON inventory_requests.inventory_id = inventory.id
        ORDER BY inventory_requests.id DESC
        LIMIT 6`
      )
      .all()

    res.json({
      totalInventoryItems: invStats.total_items || 0,
      totalAvailableUnits: invStats.total_units || 0,
      pendingRequests: reqStats.pending_requests || 0,
      approvedRequests: reqStats.approved_requests || 0,
      rejectedRequests: reqStats.rejected_requests || 0,
      totalRequests: reqStats.total_requests || 0,
      categoryBreakdown: categoryBreakdown || [],
      recentRequests: recentRequests || [],
    })
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    res.status(500).json({ message: 'Failed to load dashboard summary' })
  }
})

// Inventory APIs
app.get('/api/inventory', (req, res) => {
  try {
    const inventory = db.prepare('SELECT * FROM inventory ORDER BY id DESC').all()
    res.json(inventory)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load inventory' })
  }
})

app.post('/api/inventory', (req, res) => {
  const {
    name,
    category,
    quantity,
    location,
    status,
    description,
    business,
  } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Product name is required' })
  }
  if (!category || !category.trim()) {
    return res.status(400).json({ message: 'Category is required' })
  }
  const parsedQty = Number(quantity)
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than zero' })
  }
  if (!location || !location.trim()) {
    return res.status(400).json({ message: 'Location is required' })
  }
  if (!business || !business.trim()) {
    return res.status(400).json({ message: 'Business name is required' })
  }

  try {
    const result = db
      .prepare(
        `INSERT INTO inventory
        (name, category, quantity, location, status, description, business)
        VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name.trim(),
        category.trim(),
        parsedQty,
        location.trim(),
        status || 'Available',
        description ? description.trim() : '',
        business.trim()
      )

    res.status(201).json({
      message: 'Inventory added successfully',
      id: result.lastInsertRowid,
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to add inventory' })
  }
})

app.patch('/api/inventory/:id', (req, res) => {
  const { id } = req.params
  const { quantity } = req.body

  const parsedQty = Number(quantity)
  if (quantity === undefined || isNaN(parsedQty) || parsedQty < 0) {
    return res.status(400).json({
      message: 'Please enter a valid quantity',
    })
  }

  try {
    const inventoryItem = db
      .prepare('SELECT * FROM inventory WHERE id = ?')
      .get(id)

    if (!inventoryItem) {
      return res.status(404).json({
        message: 'Inventory item not found',
      })
    }

    db.prepare(
      `UPDATE inventory
      SET quantity = ?,
      status = CASE
        WHEN ? = 0 THEN 'Unavailable'
        ELSE 'Available'
      END
      WHERE id = ?`
    ).run(parsedQty, parsedQty, id)

    res.json({
      message: 'Inventory updated successfully',
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update inventory' })
  }
})

app.delete('/api/inventory/:id', (req, res) => {
  const { id } = req.params

  try {
    const inventoryItem = db
      .prepare('SELECT * FROM inventory WHERE id = ?')
      .get(id)

    if (!inventoryItem) {
      return res.status(404).json({
        message: 'Inventory item not found',
      })
    }

    const requests = db
      .prepare(
        `SELECT COUNT(*) AS count
        FROM inventory_requests
        WHERE inventory_id = ?`
      )
      .get(id)

    if (requests.count > 0) {
      return res.status(409).json({
        message:
          'Cannot delete inventory because requests are associated with it.',
      })
    }

    db.prepare('DELETE FROM inventory WHERE id = ?').run(id)

    res.json({
      message: 'Inventory deleted successfully',
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete inventory' })
  }
})

// Request APIs
app.post('/api/requests', (req, res) => {
  const { inventory_id, requester_business, quantity, message } = req.body

  if (!inventory_id) {
    return res.status(400).json({ message: 'Inventory ID is required' })
  }

  try {
    const inventoryItem = db
      .prepare('SELECT * FROM inventory WHERE id = ?')
      .get(inventory_id)

    if (!inventoryItem) {
      return res.status(404).json({
        message: 'Inventory item not found',
      })
    }

    if (!requester_business || !requester_business.trim()) {
      return res.status(400).json({
        message: 'Please enter your business name',
      })
    }

    const parsedQty = Number(quantity)
    if (!quantity || isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        message: 'Please enter a valid quantity',
      })
    }

    if (parsedQty > inventoryItem.quantity) {
      return res.status(400).json({
        message: `Only ${inventoryItem.quantity} units are available`,
      })
    }

    const result = db
      .prepare(
        `INSERT INTO inventory_requests
        (inventory_id, requester_business, quantity, message)
        VALUES (?, ?, ?, ?)`
      )
      .run(
        inventory_id,
        requester_business.trim(),
        parsedQty,
        message ? message.trim() : ''
      )

    res.status(201).json({
      message: 'Request submitted successfully',
      id: result.lastInsertRowid,
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit request' })
  }
})

app.get('/api/requests', (req, res) => {
  try {
    const requests = db
      .prepare(
        `SELECT
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
        ORDER BY inventory_requests.id DESC`
      )
      .all()

    res.json(requests)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load requests' })
  }
})

app.get('/api/requests/my', (req, res) => {
  const { business } = req.query

  if (!business || !business.trim()) {
    return res.status(400).json({
      message: 'Business name is required',
    })
  }

  try {
    const requests = db
      .prepare(
        `SELECT
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
        ORDER BY inventory_requests.id DESC`
      )
      .all(business.trim())

    res.json(requests)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load requests' })
  }
})

app.patch('/api/requests/:id', (req, res) => {
  const { status } = req.body
  const { id } = req.params

  if (status !== 'Approved' && status !== 'Rejected') {
    return res.status(400).json({
      message: 'Invalid request status',
    })
  }

  try {
    const updateRequest = db.transaction(() => {
      const request = db
        .prepare('SELECT * FROM inventory_requests WHERE id = ?')
        .get(id)

      if (!request) {
        throw new Error('REQUEST_NOT_FOUND')
      }

      if (request.status !== 'Pending') {
        throw new Error('REQUEST_ALREADY_PROCESSED')
      }

      if (status === 'Approved') {
        const inventoryUpdate = db
          .prepare(
            `UPDATE inventory
            SET quantity = quantity - ?,
                status = CASE
                  WHEN quantity - ? = 0 THEN 'Unavailable'
                  ELSE 'Available'
                END
            WHERE id = ?
              AND quantity >= ?`
          )
          .run(
            request.quantity,
            request.quantity,
            request.inventory_id,
            request.quantity
          )

        if (inventoryUpdate.changes === 0) {
          throw new Error('INSUFFICIENT_STOCK')
        }
      }

      db.prepare('UPDATE inventory_requests SET status = ? WHERE id = ?').run(
        status,
        id
      )
    })

    updateRequest()

    res.json({
      message: `Request ${status.toLowerCase()} successfully`,
    })
  } catch (error) {
    if (error.message === 'REQUEST_NOT_FOUND') {
      return res.status(404).json({
        message: 'Request not found',
      })
    }

    if (error.message === 'REQUEST_ALREADY_PROCESSED') {
      return res.status(400).json({
        message: 'Request has already been processed',
      })
    }

    if (error.message === 'INSUFFICIENT_STOCK') {
      return res.status(409).json({
        message: 'Not enough inventory available',
      })
    }

    console.error('Failed to update request:', error)
    res.status(500).json({
      message: 'Failed to update request',
    })
  }
})

// Listen on all interfaces
const PORT = process.env.PORT || 5000
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`StockShare backend running on port ${PORT}`)
})

module.exports = { app, server }
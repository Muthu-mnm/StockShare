const assert = require('assert')
const fs = require('fs')
const path = require('path')
const http = require('http')

// Use isolated test database
const testDbPath = path.join(__dirname, 'test_isolated.db')
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath)
}

process.env.DB_PATH = testDbPath
process.env.PORT = '5001'

const { app, server } = require('./server')

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5001,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = ''
        res.on('data', (chunk) => (raw += chunk))
        res.on('end', () => {
          let parsed = null
          try {
            parsed = JSON.parse(raw)
          } catch (e) {
            parsed = raw
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed })
        })
      }
    )
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

async function runTests() {
  console.log('--- Starting Backend Integration Tests on Isolated DB ---')

  try {
    // 1. Health check
    const health = await request('GET', '/health')
    assert.strictEqual(health.status, 200, 'Health endpoint should return 200')
    assert.strictEqual(health.body.status, 'healthy', 'Status should be healthy')
    assert.strictEqual(health.body.database, 'connected', 'Database should be connected')
    console.log('✓ GET /health passed')

    // 2. Metrics check
    const metrics = await request('GET', '/metrics')
    assert.strictEqual(metrics.status, 200, 'Metrics endpoint should return 200')
    assert.ok(/stockshare_sqlite_up(\{[^}]*\})?\s+1/.test(metrics.body), 'stockshare_sqlite_up should be 1')
    assert.ok(metrics.body.includes('stockshare_inventory_items'), 'Should expose inventory_items')
    assert.ok(metrics.body.includes('http_requests_total'), 'Should expose http_requests_total')
    console.log('✓ GET /metrics passed')

    // 3. Dashboard summary check
    const summary = await request('GET', '/api/dashboard/summary')
    assert.strictEqual(summary.status, 200, 'Dashboard summary should return 200')
    assert.ok('totalInventoryItems' in summary.body, 'Summary should have totalInventoryItems')
    assert.ok('pendingRequests' in summary.body, 'Summary should have pendingRequests')
    console.log('✓ GET /api/dashboard/summary passed')

    // 4. Create inventory item
    const newInv = await request('POST', '/api/inventory', {
      name: 'Test Steel Bolts',
      category: 'Hardware',
      quantity: 100,
      location: 'Warehouse A',
      business: 'Test Supplier Corp',
      description: 'M8 high-strength bolts',
    })
    assert.strictEqual(newInv.status, 201, 'Create inventory should return 201')
    const createdId = newInv.body.id
    assert.ok(createdId, 'Should return created inventory id')
    console.log('✓ POST /api/inventory passed')

    // 5. Update inventory item
    const updateInv = await request('PATCH', `/api/inventory/${createdId}`, {
      quantity: 120,
    })
    assert.strictEqual(updateInv.status, 200, 'Update inventory should return 200')
    console.log('✓ PATCH /api/inventory/:id passed')

    // 6. Submit request for inventory
    const newReq = await request('POST', '/api/requests', {
      inventory_id: createdId,
      requester_business: 'Test Buyer Ltd',
      quantity: 20,
      message: 'Need bolts urgently',
    })
    assert.strictEqual(newReq.status, 201, 'Create request should return 201')
    const reqId = newReq.body.id
    console.log('✓ POST /api/requests passed')

    // 7. Verify My Requests
    const myReqs = await request('GET', '/api/requests/my?business=Test%20Buyer%20Ltd')
    assert.strictEqual(myReqs.status, 200, 'My requests should return 200')
    assert.strictEqual(myReqs.body.length, 1, 'Should find 1 request for Test Buyer Ltd')
    console.log('✓ GET /api/requests/my passed')

    // 8. Approve request and verify inventory decremented
    const approveReq = await request('PATCH', `/api/requests/${reqId}`, {
      status: 'Approved',
    })
    assert.strictEqual(approveReq.status, 200, 'Approve request should return 200')

    const invList = await request('GET', '/api/inventory')
    const updatedItem = invList.body.find((item) => item.id === createdId)
    assert.strictEqual(updatedItem.quantity, 100, 'Quantity should be decremented from 120 to 100')
    console.log('✓ PATCH /api/requests/:id Approval and stock decrement passed')

    // 9. Prevent duplicate processing
    const duplicateProcess = await request('PATCH', `/api/requests/${reqId}`, {
      status: 'Approved',
    })
    assert.strictEqual(duplicateProcess.status, 400, 'Already processed request should return 400')
    console.log('✓ Duplicate request processing prevention passed')

    // 10. Delete inventory with requests attached should fail with 409
    const deleteBlocked = await request('DELETE', `/api/inventory/${createdId}`)
    assert.strictEqual(deleteBlocked.status, 409, 'Delete with requests should return 409')
    console.log('✓ DELETE /api/inventory/:id conflict protection passed')

    console.log('ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!')
  } finally {
    server.close(() => {
      if (fs.existsSync(testDbPath)) {
        try {
          fs.unlinkSync(testDbPath)
        } catch (e) {}
      }
    })
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})

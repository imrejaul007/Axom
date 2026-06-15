# CLAUDE.md - BuzzLocal Bulk Order Service

## Project Overview

**Name:** BuzzLocal Bulk Order Service  
**Purpose:** Community Bulk Orders - NeighborAI for FreshMart  
**FreshMart Story:** 4PM - "Apartment society needs 200 milk packets → NeighborAI discovers → FreshMart fulfills"  
**Location:** `companies/Axom/buzzlocal/buzzlocal-bulkorder-service/`  
**Port:** 4019

---

## FreshMart Story Context

### 4 PM - Community Commerce

**Story:** Apartment society needs 200 milk packets, fruits, vegetables → NeighborAI discovers requirement → FreshMart fulfills demand

**How it works:**
1. Society creates bulk order request (200 milk packets, 50kg vegetables)
2. Neighbors join and add their items
3. When minimum threshold reached, order confirmed
4. NeighborAI discovers nearby FreshMart
5. FreshMart receives order and prepares delivery
6. Delivery pooled to reduce cost

---

## Architecture

```
buzzlocal-bulkorder-service/
├── src/
│   ├── index.js                    # Main entry (Port 4019)
│   ├── models/
│   │   └── bulkorder.model.js     # BulkOrderRequest, Participant
│   ├── services/
│   │   └── bulkorder.service.js   # Core logic
│   └── routes/
│       └── bulkorder.routes.js    # API routes
└── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/bulkorder/create` | Create bulk order request |
| POST | `/api/bulkorder/:id/join` | Join a bulk order |
| POST | `/api/bulkorder/:id/confirm` | Confirm (min reached) |
| POST | `/api/bulkorder/:id/fulfill` | Assign store fulfillment |
| GET | `/api/bulkorder/neighborhood/:name` | Get neighborhood orders |
| GET | `/api/bulkorder/store/:storeId` | Get store orders |
| GET | `/api/bulkorder/:id` | Get order details |
| DELETE | `/api/bulkorder/:id` | Cancel order |

---

## Data Models

### BulkOrderRequest
```javascript
{
  request_id: String,          // "BO-ABC123"
  requester_type: String,       // 'society' | 'apartment' | 'office'
  requester_name: String,
  location: {
    address: String,
    coordinates: { lat, lng },
    neighborhood: String
  },
  items: [{
    sku: String,
    name: String,
    quantity_requested: Number,
    quantity_confirmed: Number,
    unit: String
  }],
  aggregation: {
    started_at: Date,
    deadline: Date,
    minimum_count: 5,
    current_count: Number
  },
  fulfillment: {
    store_id: String,
    estimated_delivery: Date
  },
  status: 'pending' | 'collecting' | 'confirmed' | 'preparing' | 'delivered'
}
```

### BulkOrderParticipant
```javascript
{
  request_id: String,
  user_id: String,
  user_name: String,
  unit_number: String,
  items: [{ sku, name, quantity }],
  amount_owed: Number,
  payment_status: 'pending' | 'paid'
}
```

---

## FreshMart 4PM Flow

```
4:00 PM - Society creates bulk order
    ↓
POST /api/bulkorder/create
Body: {
  requester_type: "apartment",
  requester_name: "HSR Layout Society",
  items: [
    { sku: "milk-001", quantity: 200, unit: "packets" },
    { sku: "vegetables", quantity: 50, unit: "kg" }
  ]
}
    ↓
Request Created: BO-ABC123
    ↓
Neighbors join via BuzzLocal
    ↓
When 5+ households joined:
    ↓
POST /api/bulkorder/:id/confirm
    ↓
NeighborAI discovers FreshMart ✅
    ↓
FreshMart fulfills demand ✅
    ↓
Pooled delivery to society ✅
```

---

## Usage Examples

### Create bulk order
```bash
curl -X POST http://localhost:4019/api/bulkorder/create \
  -H "Content-Type: application/json" \
  -d '{
    "requester_type": "apartment",
    "requester_name": "HSR Layout Society",
    "location": { "neighborhood": "HSR Layout" },
    "items": [
      { "sku": "milk-001", "name": "Milk", "quantity_requested": 200, "unit": "packets" }
    ]
  }'
```

### Join bulk order
```bash
curl -X POST http://localhost:4019/api/bulkorder/BO-ABC123/join \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "name": "Karim",
    "unitNumber": "A-101",
    "items": [
      { "sku": "milk-001", "quantity": 4 }
    ]
  }'
```

---

## Integration

### With BuzzLocal
- Society creates via BuzzLocal app
- Notifications sent via BuzzLocal
- Neighborhood discovery

### With FreshMart / REZ-Mart
- Bulk orders sent to store
- Inventory check and fulfillment
- Delivery scheduling

### With Nexha
- Supplier notification for bulk quantities
- Procurement triggered for large orders

---

## Development

```bash
# Install dependencies
cd buzzlocal-bulkorder-service
npm install

# Start service
npm start  # Port 4019

# Or development mode
npm run dev
```

---

**Last Updated:** June 13, 2026

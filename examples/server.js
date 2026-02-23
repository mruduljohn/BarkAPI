const http = require('http');

// ── Fake data with INTENTIONAL drift from the spec ──────────────────────────

const users = {
  1: {
    id: 1,
    name: "Alice Johnson",
    email: 42,                    // DRIFT: spec says string, returning number
    role: "admin",
    avatar: "https://i.pravatar.cc/150?u=alice",  // DRIFT: extra field not in spec
    // DRIFT: missing "created_at" which spec marks as required
  },
  2: {
    id: 2,
    name: "Bob Smith",
    email: null,                  // DRIFT: spec says non-null string
    role: "user",
    avatar: "https://i.pravatar.cc/150?u=bob",
  },
};

const orders = [
  {
    id: 1,
    user_id: 1,
    status: "shipped",
    total: 59.99,
    currency: "USD",
    items: [
      { product: "Mechanical Keyboard", quantity: 1, price: 59.99 },
    ],
    created_at: "2025-12-01T10:30:00Z",
  },
  {
    id: 2,
    user_id: 2,
    status: "pending",
    total: 124.50,
    currency: "USD",
    items: [
      { product: "USB-C Hub", quantity: 2, price: 34.50 },
      { product: "Monitor Stand", quantity: 1, price: 55.50 },
    ],
    created_at: "2025-12-15T14:22:00Z",
  },
];

const products = [
  {
    id: 1,
    name: "Mechanical Keyboard",
    price: "59.99",               // DRIFT: spec says number, returning string
    in_stock: true,
    category: "peripherals",
  },
  {
    id: 2,
    name: "USB-C Hub",
    price: "34.50",
    in_stock: true,
    category: "accessories",
  },
  {
    id: 3,
    name: "Monitor Stand",
    price: "55.50",
    in_stock: false,
    category: "furniture",
  },
];

const healthData = {
  status: "ok",
  uptime: 99.97,
  version: "1.4.2",
};

// ── Router ──────────────────────────────────────────────────────────────────

function router(method, url) {
  // GET /api/health
  if (method === 'GET' && url === '/api/health') {
    return { status: 200, body: healthData };
  }

  // GET /api/users
  if (method === 'GET' && url === '/api/users') {
    return { status: 200, body: { data: Object.values(users), total: 2 } };
  }

  // GET /api/users/:id
  const userMatch = url.match(/^\/api\/users\/(\d+)$/);
  if (method === 'GET' && userMatch) {
    const user = users[userMatch[1]];
    if (!user) return { status: 404, body: { error: "User not found" } };
    return { status: 200, body: { data: user } };
  }

  // GET /api/orders
  if (method === 'GET' && url === '/api/orders') {
    return { status: 200, body: { data: orders, total: orders.length } };
  }

  // GET /api/orders/:id
  const orderMatch = url.match(/^\/api\/orders\/(\d+)$/);
  if (method === 'GET' && orderMatch) {
    const order = orders.find(o => o.id === parseInt(orderMatch[1]));
    if (!order) return { status: 404, body: { error: "Order not found" } };
    return { status: 200, body: { data: order } };
  }

  // GET /api/products
  if (method === 'GET' && url === '/api/products') {
    return { status: 200, body: { data: products, total: products.length } };
  }

  // GET /api/products/:id
  const productMatch = url.match(/^\/api\/products\/(\d+)$/);
  if (method === 'GET' && productMatch) {
    const product = products.find(p => p.id === parseInt(productMatch[1]));
    if (!product) return { status: 404, body: { error: "Product not found" } };
    return { status: 200, body: { data: product } };
  }

  return { status: 404, body: { error: "Not found" } };
}

// ── Server ──────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];  // strip query params
  const { status, body } = router(req.method, url);

  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));

  const icon = status < 400 ? '✓' : '✗';
  console.log(`  ${icon} ${req.method} ${url} → ${status}`);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  🐕 BarkAPI Example Server');
  console.log('  ─────────────────────────');
  console.log(`  Running on http://localhost:${PORT}`);
  console.log('');
  console.log('  Endpoints:');
  console.log('    GET /api/health');
  console.log('    GET /api/users');
  console.log('    GET /api/users/:id');
  console.log('    GET /api/orders');
  console.log('    GET /api/orders/:id');
  console.log('    GET /api/products');
  console.log('    GET /api/products/:id');
  console.log('');
  console.log('  Intentional drift:');
  console.log('    • /api/users/:id    → email is number (spec: string)');
  console.log('    • /api/users/:id    → missing created_at (spec: required)');
  console.log('    • /api/users/:id    → extra "avatar" field (not in spec)');
  console.log('    • /api/products/:id → price is string (spec: number)');
  console.log('');
});

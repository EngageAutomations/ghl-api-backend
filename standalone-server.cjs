const express = require('express');
const path = require('path');
const { createServer } = require('http');

const app = express();

// Basic middleware
app.use(express.json());

// Disable serving static files that might interfere
// app.use(express.static('public'));

// Simple HTML page with our React app
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoHighLevel API Management</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; font-family: system-ui, sans-serif; }
        .container { min-height: 100vh; background: #f8fafc; }
        .sidebar { width: 256px; background: #1e293b; color: white; padding: 24px; }
        .main { flex: 1; padding: 32px; }
        .card { background: white; border-radius: 8px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .btn { background: #3b82f6; color: white; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; }
        .btn:hover { background: #2563eb; }
        .debug-panel { background: #fef3c7; border: 1px dashed #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
        .status-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
    </style>
</head>
<body>
    <div id="root">
        <div class="container flex">
            <div class="sidebar">
                <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">GoHighLevel API</h1>
                <p style="font-size: 14px; opacity: 0.8; margin-bottom: 24px;">Management Dashboard</p>
                <nav>
                    <div style="padding: 12px; background: #3b82f6; border-radius: 6px; margin-bottom: 8px; cursor: pointer;">
                        📦 Products
                    </div>
                    <div style="padding: 12px; opacity: 0.7; border-radius: 6px; margin-bottom: 8px; cursor: pointer;">
                        💰 Prices
                    </div>
                    <div style="padding: 12px; opacity: 0.7; border-radius: 6px; margin-bottom: 8px; cursor: pointer;">
                        📁 Media
                    </div>
                    <div style="padding: 12px; opacity: 0.7; border-radius: 6px; margin-bottom: 8px; cursor: pointer;">
                        👥 Contacts
                    </div>
                    <div style="padding: 12px; opacity: 0.7; border-radius: 6px; margin-bottom: 8px; cursor: pointer;">
                        🎯 Opportunities
                    </div>
                    <div style="padding: 12px; opacity: 0.7; border-radius: 6px; margin-bottom: 8px; cursor: pointer;">
                        ⚡ Workflows
                    </div>
                </nav>
            </div>
            <div class="main">
                <div class="debug-panel">
                    <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">🔧 Debug Status</h3>
                    <div class="status-item">
                        <div class="status-dot"></div>
                        <span style="font-size: 14px;">Mock API Connected</span>
                    </div>
                    <div class="status-item">
                        <div class="status-dot"></div>
                        <span style="font-size: 14px;">Products Count: 3</span>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div>
                        <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Products Management</h2>
                        <p style="color: #64748b;">Manage your GoHighLevel products and catalog</p>
                    </div>
                    <button class="btn" onclick="handleCreateProduct()">
                        ➕ Create Product
                    </button>
                </div>
                
                <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; width: 300px;"
                        onchange="handleSearch(this.value)"
                    />
                    <button class="btn" onclick="handleRefresh()">🔄 Refresh</button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
                    <div class="card">
                        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">📦 Premium Consultation</h3>
                        <p style="color: #64748b; margin-bottom: 16px;">1-hour strategic business consultation</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Active</span>
                            <span style="font-size: 18px; font-weight: 600;">$150.00</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button style="background: #f3f4f6; color: #374151; padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;" onclick="handleEdit('prod_1')">✏️ Edit</button>
                            <button style="background: #f3f4f6; color: #374151; padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;" onclick="handleDelete('prod_1')">🗑️ Delete</button>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">📦 Digital Marketing Package</h3>
                        <p style="color: #64748b; margin-bottom: 16px;">Complete digital marketing solution</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Active</span>
                            <span style="font-size: 18px; font-weight: 600;">$999.00</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button style="background: #f3f4f6; color: #374151; padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;" onclick="handleEdit('prod_2')">✏️ Edit</button>
                            <button style="background: #f3f4f6; color: #374151; padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;" onclick="handleDelete('prod_2')">🗑️ Delete</button>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">📦 Website Development</h3>
                        <p style="color: #64748b; margin-bottom: 16px;">Custom website development service</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <span style="background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Inactive</span>
                            <span style="font-size: 18px; font-weight: 600;">$2,500.00</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button style="background: #f3f4f6; color: #374151; padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;" onclick="handleEdit('prod_3')">✏️ Edit</button>
                            <button style="background: #f3f4f6; color: #374151; padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;" onclick="handleDelete('prod_3')">🗑️ Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function handleCreateProduct() {
            console.log("🆕 CreateProduct: Button clicked");
            alert("Create Product functionality - check console for logs");
        }
        
        function handleEdit(productId) {
            console.log("✏️ Edit: Button clicked", productId);
            alert("Edit Product " + productId + " - check console for logs");
        }
        
        function handleDelete(productId) {
            console.log("🗑️ Delete: Button clicked", productId);
            if (confirm("Delete product " + productId + "?")) {
                console.log("✅ Delete confirmed for product", productId);
                alert("Product " + productId + " deleted - check console for logs");
            }
        }
        
        function handleSearch(term) {
            console.log("🔍 Search: Term changed", term);
        }
        
        function handleRefresh() {
            console.log("🔄 Refresh: Button clicked");
            alert("Refreshing products - check console for logs");
        }
        
        console.log("🎯 GoHighLevel API Management Interface Loaded");
        console.log("📦 Mock API with 3 sample products ready");
        console.log("🔧 Debug mode active - all button clicks will be logged");
    </script>
</body>
</html>
  `);
});

// API endpoints for testing
app.get('/api/products', (req, res) => {
  console.log('📦 API: GET /api/products');
  res.json({
    success: true,
    data: {
      products: [
        {
          id: 'prod_1',
          name: 'Premium Consultation',
          description: '1-hour strategic business consultation',
          price: 150,
          status: 'active',
          category: 'Services'
        },
        {
          id: 'prod_2',
          name: 'Digital Marketing Package',
          description: 'Complete digital marketing solution',
          price: 999,
          status: 'active',
          category: 'Marketing'
        },
        {
          id: 'prod_3',
          name: 'Website Development',
          description: 'Custom website development service',
          price: 2500,
          status: 'inactive',
          category: 'Development'
        }
      ]
    }
  });
});

app.post('/api/products', (req, res) => {
  console.log('📦 API: POST /api/products', req.body);
  res.json({
    success: true,
    data: {
      id: 'prod_new',
      name: req.body.name || 'New Product',
      description: req.body.description || '',
      price: req.body.price || 0,
      status: 'active',
      category: req.body.category || 'General'
    }
  });
});

const PORT = process.env.PORT || 5000;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GoHighLevel API Management: http://localhost:${PORT}`);
});
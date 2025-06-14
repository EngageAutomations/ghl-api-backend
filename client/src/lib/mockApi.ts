// Mock API handler for testing UI components without backend dependency

interface MockProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  status: 'active' | 'inactive';
  category: string;
  image?: string;
  createdAt: string;
}

interface MockPrice {
  id: string;
  productId: string;
  name: string;
  amount: number;
  currency: string;
  type: 'one-time' | 'recurring';
  interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

interface MockContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  source: string;
  createdAt: string;
}

interface MockMedia {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
}

// Mock data storage
let mockProducts: MockProduct[] = [
  {
    id: "prod_1",
    name: "Premium Consultation",
    description: "1-hour strategic business consultation",
    price: 150,
    status: "active",
    category: "Services",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_2", 
    name: "Digital Marketing Package",
    description: "Complete digital marketing solution",
    price: 999,
    status: "active",
    category: "Marketing",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_3",
    name: "Website Development",
    description: "Custom website development service",
    price: 2500,
    status: "inactive",
    category: "Development",
    createdAt: new Date().toISOString()
  }
];

let mockPrices: MockPrice[] = [
  {
    id: "price_1",
    productId: "prod_1",
    name: "Standard Rate",
    amount: 150,
    currency: "USD",
    type: "one-time"
  },
  {
    id: "price_2",
    productId: "prod_2",
    name: "Monthly Package",
    amount: 999,
    currency: "USD",
    type: "recurring",
    interval: "monthly"
  }
];

let mockContacts: MockContact[] = [
  {
    id: "contact_1",
    name: "John Smith",
    email: "john@example.com",
    phone: "+1-555-0123",
    tags: ["lead", "interested"],
    source: "website",
    createdAt: new Date().toISOString()
  },
  {
    id: "contact_2",
    name: "Sarah Johnson", 
    email: "sarah@company.com",
    phone: "+1-555-0456",
    tags: ["customer", "vip"],
    source: "referral",
    createdAt: new Date().toISOString()
  }
];

let mockMedia: MockMedia[] = [
  {
    id: "media_1",
    name: "company-logo.png",
    url: "/mock-images/logo.png",
    type: "image/png",
    size: 45678,
    createdAt: new Date().toISOString()
  },
  {
    id: "media_2",
    name: "product-demo.mp4",
    url: "/mock-videos/demo.mp4", 
    type: "video/mp4",
    size: 15678900,
    createdAt: new Date().toISOString()
  }
];

// Simulate API delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Products API
  products: {
    async list() {
      console.log("📦 Mock API: Fetching products");
      await delay(500);
      return { success: true, data: { products: mockProducts } };
    },

    async create(productData: Partial<MockProduct>) {
      console.log("📦 Mock API: Creating product", productData);
      await delay(800);
      const newProduct: MockProduct = {
        id: `prod_${Date.now()}`,
        name: productData.name || "Untitled Product",
        description: productData.description || "",
        price: productData.price || 0,
        status: productData.status || "active",
        category: productData.category || "General",
        createdAt: new Date().toISOString()
      };
      mockProducts.push(newProduct);
      return { success: true, data: newProduct };
    },

    async update(id: string, updates: Partial<MockProduct>) {
      console.log("📦 Mock API: Updating product", id, updates);
      await delay(600);
      const index = mockProducts.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error("Product not found");
      }
      mockProducts[index] = { ...mockProducts[index], ...updates };
      return { success: true, data: mockProducts[index] };
    },

    async delete(id: string) {
      console.log("📦 Mock API: Deleting product", id);
      await delay(400);
      const index = mockProducts.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error("Product not found");
      }
      mockProducts.splice(index, 1);
      return { success: true };
    }
  },

  // Prices API
  prices: {
    async list(productId?: string) {
      console.log("💰 Mock API: Fetching prices", productId ? `for product ${productId}` : "");
      await delay(400);
      const filteredPrices = productId ? 
        mockPrices.filter(p => p.productId === productId) : 
        mockPrices;
      return { success: true, data: { prices: filteredPrices } };
    },

    async create(priceData: Partial<MockPrice>) {
      console.log("💰 Mock API: Creating price", priceData);
      await delay(600);
      const newPrice: MockPrice = {
        id: `price_${Date.now()}`,
        productId: priceData.productId || "",
        name: priceData.name || "Untitled Price",
        amount: priceData.amount || 0,
        currency: priceData.currency || "USD",
        type: priceData.type || "one-time"
      };
      mockPrices.push(newPrice);
      return { success: true, data: newPrice };
    }
  },

  // Contacts API
  contacts: {
    async list() {
      console.log("👥 Mock API: Fetching contacts");
      await delay(450);
      return { success: true, data: { contacts: mockContacts } };
    },

    async create(contactData: Partial<MockContact>) {
      console.log("👥 Mock API: Creating contact", contactData);
      await delay(700);
      const newContact: MockContact = {
        id: `contact_${Date.now()}`,
        name: contactData.name || "Unnamed Contact",
        email: contactData.email || "",
        phone: contactData.phone || "",
        tags: contactData.tags || [],
        source: contactData.source || "manual",
        createdAt: new Date().toISOString()
      };
      mockContacts.push(newContact);
      return { success: true, data: newContact };
    }
  },

  // Media API
  media: {
    async list() {
      console.log("📁 Mock API: Fetching media files");
      await delay(500);
      return { success: true, data: { files: mockMedia } };
    },

    async upload(file: File) {
      console.log("📁 Mock API: Uploading file", file.name);
      await delay(1200);
      const newMedia: MockMedia = {
        id: `media_${Date.now()}`,
        name: file.name,
        url: `/mock-uploads/${file.name}`,
        type: file.type,
        size: file.size,
        createdAt: new Date().toISOString()
      };
      mockMedia.push(newMedia);
      return { success: true, data: newMedia };
    }
  },

  // Generic API for other endpoints
  generic: {
    async get(endpoint: string) {
      console.log(`🔗 Mock API: GET ${endpoint}`);
      await delay(400);
      return { 
        success: true, 
        data: { message: `Mock response for ${endpoint}`, endpoint },
        timestamp: new Date().toISOString()
      };
    },

    async post(endpoint: string, data: any) {
      console.log(`🔗 Mock API: POST ${endpoint}`, data);
      await delay(600);
      return { 
        success: true, 
        data: { message: `Mock response for ${endpoint}`, received: data },
        timestamp: new Date().toISOString()
      };
    }
  }
};
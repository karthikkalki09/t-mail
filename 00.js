// Function to fetch products from the backend
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Failed to fetch products');
    const products = await response.json();
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    showNotification('Failed to load products. Please try again later.', 'danger');
    return [];
  }
}

// Function to show a section
function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    section.classList.remove('fade-in');
    section.style.display = 'none';
  });
  const activeSection = document.getElementById(sectionId);
  if (sectionId === 'accountSection' && !currentUser) {
    // Guests -> professional account creation flow (no popup)
    showSection('signupSection');
    return;
  }
  if (activeSection) {
    activeSection.style.display = 'block';
    setTimeout(() => {
      activeSection.classList.add('fade-in');
    }, 10); // Delay to allow display change to take effect
  }
  updateUserActivity();
  if (sectionId === 'shopSection') {
    applyFilters();
  } else if (sectionId === 'menswearSection') {
    applyMenswearFilters();
  } else if (sectionId === 'accessoriesSection') {
    applyAccessoriesFilters();
  } else if (sectionId === 'accountSection') {
    updateAccountSection();
  } else if (sectionId === 'cartSection') {
    updateCartSection();
  } else if (sectionId === 'notificationsSection') {
    updateNotifications();
  } else if (sectionId === 'ordersSection') {
    updateOrdersList();
  } else if (sectionId === 'sellerDashboard' || sectionId === 'ownerDashboard') {
    if (currentUser && currentUser.email === 'tedpole.in@gmail.com') {
      sectionId === 'sellerDashboard' ? updateSellerDashboard() : updateOwnerDashboard();
    } else {
      showNotification('Access denied. Only the owner can view this dashboard.', 'danger');
      showSection('homeSection');
    }
  }
}

// Simple hash function for password hashing (for demonstration purposes)
function simpleHash(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}

// Global variables
let users = [];
let cart = [];
let orders = [];
let notifications = [];
let ownerNotifications = [];
let currentUser = null;
// Admin session (fixed credentials)
const ADMIN_EMAIL = "nxew.com@gmail.com";
const ADMIN_PASSWORD = "766183@Kk";
let currentAdmin = null;
let visitorPresenceInterval = null;
let adminRealtimeInterval = null;
let currentProductForPurchase = null;
let currentOrderIndex = null;
let activeFilters = {};
let menswearActiveFilters = {};
let accessoriesActiveFilters = {};
let recentSearches = [];
let validCoupons = [];
let searchTimeout = null;
let currentOrdersFilter = 'all';
let product = []; // Initialize as empty; will be populated by loadProducts

const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
const colorMap = { 'Blue': '#0000FF', 'Red': '#FF0000', 'Black': '#000000', 'Brown': '#8B4513', 'White': '#FFFFFF' };
let currentOrderIndexForMessage = null;
let shopSearchTimeout = null;

// Function to generate a random 8-character coupon code
function generateCouponCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}
// Save data to localStorage
function saveData() {
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('cart', JSON.stringify(cart));
  localStorage.setItem('orders', JSON.stringify(orders));
  localStorage.setItem('notifications', JSON.stringify(notifications));
  localStorage.setItem('ownerNotifications', JSON.stringify(ownerNotifications));
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  localStorage.setItem('validCoupons', JSON.stringify(validCoupons));
}
// Load data from localStorage
async function loadData() {
  users = JSON.parse(localStorage.getItem('users')) || [];
  cart = JSON.parse(localStorage.getItem('cart')) || [];
  orders = JSON.parse(localStorage.getItem('orders')) || [];
  notifications = JSON.parse(localStorage.getItem('notifications')) || [];
  ownerNotifications = JSON.parse(localStorage.getItem('ownerNotifications')) || [];
  currentUser = JSON.parse(localStorage.getItem('currentUser'));
  validCoupons = JSON.parse(localStorage.getItem('validCoupons')) || [];
  if (currentUser && currentUser.isLoggedIn) {
    const user = users.find(u => u.email === currentUser.email);
    if (user) {
      currentUser = { ...user, isLoggedIn: true, lastActivity: new Date().toISOString() };
    } else {
      currentUser = null;
    }
  } else {
    currentUser = null;
  }
  updateMenuAccountDetails();
  updateCartCountBadge();
  // Fetch products and update UI
  products = await loadProducts();
  generateProducts('shopProductContainer', products);
  generateProducts('menswearContainer', products.filter(p => p.category === 'Men\'s Wear'));
  generateProducts('accessoriesContainer', products.filter(p => p.category === 'Accessories'));
  generateProducts('featuredProductsContainer', products.slice(0, 100));
}
function setCurrentOrderIndex(index) {
  currentOrderIndexForMessage = index;
}
function confirmSendMessage() {
const message = document.getElementById("messageText").value.trim();
if (!message) {
  showNotification("Please enter a message.", "warning");
  return;
}
const order = orders[currentOrderIndexForMessage];
const user = users.find(u => u.email === order.buyer.email);
if (user) {
  if (!user.notifications) user.notifications = [];
  user.notifications.push({
    message: `Message from Owner: ${message}`,
    type: "info",
    title: "Message from Owner",
    date: new Date().toLocaleString()
  });
  showNotification(`Message sent to user: ${user.firstName} ${user.lastName}`, "success");
  saveData();
  const modal = bootstrap.Modal.getInstance(document.getElementById("sendMessageModal"));
  modal.hide();
  document.getElementById("messageText").value = "";
} else {
  showNotification("User not found.", "warning");
}
}
const products = [
{
  id: 1,
  name: "Light Pink Stripes Slim Fit Shirt",
  description: "A refined pink and white vertical stripe pattern",
  category: "Shirts",
  price: 599.99,
  discount: 20,
  size: "M, L, XL, XXL",
  color: "Light Pink with White Stripes",
  clothType: "100% Cotton",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Machine washable.This product is NewArrival",
  
  images: [
    "https://i.pinimg.com/736x/a7/5c/12/a75c12ce007b5d890e1e035cbf45525b.jpg",
    "https://i.pinimg.com/736x/10/4e/f9/104ef92ebe37ab5493d9bf98635d5a75.jpg",
    "https://i.pinimg.com/736x/97/a3/e7/97a3e7ed74a1bbfe355998c0113d22ac.jpg"
  ],
  colorImages: {
    "Light Pink with White Stripes": "https://i.pinimg.com/736x/df/1b/05/df1b05cdece12bd1a69567f29a24744f.jpg"
  },
  specifications: {
    Material: "100% Cotton",
    Fit: "Slim Fit",
    Sleeve: "Full Sleeve",
    Wear: "Casual, Formal",
    Collar: "Spread Collar with vertical stripes"
  }
},
{
  id: 2,
  name: "Men's White/Black Checked Shirt",
  description: "A regular fit shirt featuring a classic checked pattern in white and black",
  category: "Shirts",
  price: 499.99,
  discount: 25,
  size: "M, L, XL",
  color: "White/Black",
  clothType: "100% Cotton",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Machine washable and weatherproof",
  isNewArrival: false,
  isSoldOut: false,
  images: [
    "https://i.pinimg.com/736x/a7/fd/52/a7fd529d75dbf1c8e06c42387cae88ee.jpg",
    "https://i.pinimg.com/736x/6d/fb/3d/6dfb3d7ac8a5b14f0530f943fc7a9e17.jpg",
    "https://i.pinimg.com/736x/c9/94/57/c994578d6cf1ace1e172c2abc216a009.jpg",
    "https://i.pinimg.com/736x/01/2b/bd/012bbd2df7f2141e7cf4e32a294229a7.jpg"
  ],
  colorImages: {
    "White/Black": "https://i.pinimg.com/736x/01/2b/bd/012bbd2df7f2141e7cf4e32a294229a7.jpg"
  },
  specifications: {
    Material: "100% Cotton",
    Fit: "Regular Fit",
    Sleeve: "Full Sleeve",
    Wear: "Casual, Formal",
    Collar: "Spread Collar with checked pattern"
  }
},
// UPDATED PRODUCT (ID 3) - SET TO NEW ARRIVAL
{
id: 3,
name: "Men's Green-White Checked Shirt",
description: "A stylish green checked shirt perfect for casual wear",
category: "Shirts",
price: 599.99,
discount: 29,
size: "XL",
color: "Green",
clothType: "Cotton Polyester Blend",
deliveryTime: "3-5 days",
returnPolicy: "5 days return policy",
additionalDetails: "Men's Green Checked shirt.Fresh new arrival with premium fabric",
newArrivalPosition: 1,  
images: [
"https://i.pinimg.com/736x/a6/e6/b2/a6e6b20d7a02165ce7161b4baf2b8f95.jpg",
  "https://i.pinimg.com/736x/17/84/ae/1784ae9e700a2510f8352f48e50b3329.jpg",
    "https://i.pinimg.com/736x/54/8f/de/548fde66ecbb64c0ac2de4d872ddd063.jpg"
],
colorImages: {
  "Green":   "https://i.pinimg.com/736x/54/90/95/549095f6f3a913d6557cedb1ba01db21.jpg"
},
specifications: {
  Material: "Cotton Polyester Blend",
  Sleeve: "Full Sleeves",
  Collar: "Spread Collar",
  Occasion: "Formal",
  Pattern: "Checked"
}
},
// UPDATED PRODUCT (ID 4) - SET TO NEW ARRIVAL
{
id: 4,
name: "Men's Rust & Charcoal Plaid Shirt",
description: "The warm rust tones are layered with charcoal and black intersecting lines, accented by stark white buttons for a clean contrast, it offers a soft, lived-in feel perfect for casual or smart-casual wear.",
category: "Shirts",
price: 549.99,
discount: 25,
size: "XL",
color: "Rust Brown", // Updated to match the actual image
clothType: "Cotton",
deliveryTime: "3-5 days",
returnPolicy: "5 days return policy",
additionalDetails: "Men's Textured Check Shirt with White Contrast Buttons.Fresh new arrival with premium fabric",
 newArrivalPosition: 2,  
 images: [

    "https://i.pinimg.com/736x/76/23/66/7623668b878ad4d50906b5460c08c65c.jpg",

    "https://i.pinimg.com/736x/33/e9/c3/33e9c330a52d8e8908a3bf4712c487f5.jpg",

    "https://i.pinimg.com/736x/91/67/05/916705852ad7ebda61fd341e4ebf7609.jpg"

  ],

  colorImages: {

    "Gray": "https://i.pinimg.com/736x/91/67/05/916705852ad7ebda61fd341e4ebf7609.jpg"

  },
specifications: {
  Material: "Cotton",
  Sleeve: "Full Sleeves",
  Collar: "Pointed Collar", // Changed from Spread to Pointed based on the image
  Occasion: "Casual / Workwear", // Changed from Formal to match the style
  Pattern: "Plaid Checked"
}
},
{
  id: 5,
  name: "Men's Yellow with Brown strips  Shirt",
description: "A fresh, vibrant button-down featuring a multi-colored grid plaid pattern. Set against a creamy off-white base, the shirt is detailed with bold salmon-coral and light sky-blue intersecting lines. Designed with a tailored slim fit and a button-down collar, it offers a crisp, modern aesthetic perfect for warm-weather outings or semi-casual events.",
  category: "Shirts",
  price: 499.99,
  discount: 25,
  size: "L",
  color: "Charcoal",
  clothType: "Cotton Polyester Blend",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
additionalDetails: "Slim-fit checkered shirt with button-down collar and brand hem tag. Fresh new arrival with premium fabric",
  images: [
    "https://i.pinimg.com/736x/32/8b/00/328b00486a04dcb79bffd5c4513bfba2.jpg",
    "https://i.pinimg.com/736x/02/3c/a2/023ca2dd5d7af58f835dd36b0590fdbc.jpg",
    "https://i.pinimg.com/736x/9c/f7/98/9cf798afba247c114ed5279a4be88e19.jpg",
      "https://i.pinimg.com/736x/e2/cc/e6/e2cce66bef9b13a7e8736a4b9ae350ee.jpg"
  ],
  colorImages: {
    "Charcoal": "https://i.pinimg.com/736x/e2/cc/e6/e2cce66bef9b13a7e8736a4b9ae350ee.jpg"
  },
  specifications: {
  Material: "Cotton Blend",
  Sleeve: "Full Sleeves (Roll-up style)",
  Collar: "Button-Down Collar",
  Occasion: "Casual / Semi-Casual",
  Pattern: "Multi-Color Grid Plaid"
  }
},
{
  id: 6,
  name: "Men's Green-White plaid Shirt",
  description: "A fresh, vibrant button-down featuring a multi-colored grid plaid pattern,the shirt is detailed with light Green and white intersecting lines.",
  category: "Shirts",
  price: 449.99,
  discount: 25,
  size: "L",
  clothType: "Cotton  Blend",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Hustle formal shirt.Fresh new arrival with premium fabric",
    newArrivalPosition: 3,  

  images: [
    "https://i.pinimg.com/736x/a9/62/30/a96230d5db7689e7ec686ea3907654f9.jpg",
    "https://i.pinimg.com/736x/a0/d8/6c/a0d86c82dfb3c6cbc3aab1af7f7821e1.jpg",
    "https://i.pinimg.com/736x/41/5a/a7/415aa70bcdf7ce63abeefb5d0105436d.jpg",
"https://i.pinimg.com/736x/b3/32/c6/b332c6e7fbe2a4b8e3562de5bdb51368.jpg" 
  ],
  colorImages: {
    "Light Green & White Strips Plaid": "https://i.pinimg.com/736x/26/62/89/266289a61c2a7fe60e2a09bf27d4db4d.jpg",
    "Sky blue & Black Strips": "https://i.pinimg.com/736x/b3/32/c6/b332c6e7fbe2a4b8e3562de5bdb51368.jpg",
    
   "Black & White Strips Plaid":"https://i.pinimg.com/736x/a9/62/30/a96230d5db7689e7ec686ea3907654f9.jpg",
    
    "Dark Green & White Strips Plaid": "https://i.pinimg.com/736x/a0/d8/6c/a0d86c82dfb3c6cbc3aab1af7f7821e1.jpg"

  },
  specifications: {
   Material: "Cotton Blend",
  Sleeve: "Full Sleeves (Roll-up style)",
  Collar: "Button-Down Collar",
  Occasion: "Casual / Semi-Casual",
  Pattern: "Multi-Color Grid Plaid"
  }
},
{
  id: 7,
  name: "Men's Brown & White  Shirt",
  description: "A stylish brown and white checked shirt perfect for casual wear, both formal and casual occasions, featuring a classic checked pattern in brown and white, designed with a comfortable fit and made from a cotton blend fabric for all-day wear.",
  category: "Shirts",
  price: 549.99,
  discount: 25,
  size: "M,L,XL",
  color: "Brown & White",
  clothType: "Cotton Blend",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Hustle formal shirt.Fresh new arrival with premium fabric",
  newArrivalPosition: 4,  

  images: [
    "https://i.pinimg.com/736x/f5/d8/76/f5d8764b8fd14a270130395f5cd37034.jpg",
    "https://i.pinimg.com/736x/f8/66/95/f866952853f70e54e9ec5a7e6795cf9b.jpg",
    "https://i.pinimg.com/736x/0e/79/18/0e7918d4d24c0031b8dbcc6dd04aef94.jpg",
  ],
  colorImages: {
    "Brown & White": "https://i.pinimg.com/736x/f5/d8/76/f5d8764b8fd14a270130395f5cd37034.jpg"
  },
  specifications: {
    Material: "Cotton  Blend",
    Sleeve: "Full Sleeves",
    Collar: "Spread Collar",
    Occasion: "Formal",
    Pattern: "Solid"
  }
},
{
  id: 8,
  name: "Men's Brown and Charcoal Black Shirt",
  description: "This is a large-scale plaid with a brushed or distressed texture, giving it a soft, slightly rugged appearance rather than sharp, clean lines",
  category: "Shirts",
  price: 599.99,
  discount: 25,
  size: "XL",
  color: "Brown & Charcoal Black",
  clothType: "Cotton",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Hustle formal shirt.Fresh new arrival with premium fabric",
    newArrivalPosition: 8,
  images: [
    "https://i.pinimg.com/736x/69/8f/ea/698feaff5065bda0f3853221050356a7.jpg",
    "https://i.pinimg.com/736x/47/6c/2b/476c2b42e980dd580c8ddb11bd9ac4d7.jpg",
    "https://i.pinimg.com/736x/26/f4/8b/26f48b3d8d405e8cc37c4d19426634d8.jpg"
  ],
  colorImages: {
    "Ash Gray": "https://i.pinimg.com/736x/69/8f/ea/698feaff5065bda0f3853221050356a7.jpg"
  },
  specifications: {
    Material: "Cotton",
    Sleeve: "Full Sleeves",
    Collar: "Spread Collar",
    Pattern: "Solid",
      Closure: "Button Down",
    Occasion: "Casual / Smart Casual",
    FabricCare: "Machine Wash",
    Pocket: "Single Chest Pocket"
  }
},

{
  id: 9,
  name: "Men's Yellow & Black Checks Shirt",
  description: "Premium Yellow  and Black  checked casual shirt designed for a modern smart look. Soft fabric with a comfortable slim fit, perfect for daily wear and casual outings.",
  category: "Shirts",
  price: 499.99,
  discount: 25,
  size: "M,L,XL",
  color: "Yellow & Black Checks",
  clothType: "Cotton Blend",
  deliveryTime: "3-5 Business Days",
  returnPolicy: "5 Days Easy Return & Exchange",
  additionalDetails: "Breathable fabric, lightweight feel, and durable stitching. Perfect for college, office casual, and weekend styling.Fresh new arrival with premium fabric",
    newArrivalPosition: 12,
  images: [
    "https://i.pinimg.com/736x/c4/fe/49/c4fe495ac68d5eef0a30e9b8d61d9221.jpg",
    "https://i.pinimg.com/736x/86/79/cd/8679cd592544387cb30045b6ee323cbe.jpg",
          "https://i.pinimg.com/736x/90/3b/17/903b17482f9eb37e10f6fb788281a64d.jpg"

  ],
  colorImages: {
    "Yellow & Black Checks": "https://i.pinimg.com/736x/c4/fe/49/c4fe495ac68d5eef0a30e9b8d61d9221.jpg"
  },
  specifications: {
    Material: "Cotton Blend",
    Sleeve: "Full Sleeves",
    Collar: "Spread Collar",
    Fit: "Slim Fit",
    Pattern: "Checked",
    Closure: "Button Down",
    Occasion: "Casual / Smart Casual",
    FabricCare: "Machine Wash",
    Pocket: "Single Chest Pocket"
  }
},
{
  id: 10,
  name: "Men's Brown Slim Fit Shirt",
  description: "Designed in a slim fit, a look that bridges dressy and casual",
  category: "Shirts",
  price: 449.99,
  discount: 38,
  size: "M, L, XL",
  color: "Brown",
  clothType: "Cotton Blend",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Machine washable and weatherproof",

  images: [
    "https://i.pinimg.com/736x/fc/4c/b0/fc4cb0f29932d0a056ca0392153c8074.jpg",
    "https://i.pinimg.com/736x/e7/a7/08/e7a708c131c18d9b3d3dd1ca357d8eb5.jpg",
    "https://i.pinimg.com/736x/be/d9/1f/bed91fca532a37c9b8eed9d180ac4b1a.jpg"
  ],
  colorImages: {
    "Brown": "https://i.pinimg.com/736x/ab/b1/76/abb176e794b870037bbe70ef065fd844.jpg"
  },
  specifications: {
    Material: "Cotton Blend",
    Fit: "Slim Fit",
    Sleeve: "Full Sleeve",
    Wear: "Casual, Formal",
    Collar: "Spread Collar"
  }
},

{
  id: 11,
  name: "Men's Black Jordan Oversized T-Shirt",
  description: "Comfortable and stylish men's oversized t-shirt",
  category: "T-Shirts",
  price: 439.99,
  discount: 38,
  size: "L",
  color: "Black",
  clothType: "100% Cotton",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Machine washable and weatherproof.this product is sold out",
 
  images: [
    "https://i.pinimg.com/736x/99/df/c6/99dfc6172b5df9a97c22d2af93aac789.jpg",
    "https://i.pinimg.com/736x/71/ed/b3/71edb347dbbcc9f5708fb2e141b4e6c9.jpg",
    "https://i.pinimg.com/736x/5e/06/2f/5e062fb9641aeb3558304ee1bb93a1d5.jpg"
  ],
  colorImages: {
    "Black": "https://i.pinimg.com/736x/99/df/c6/99dfc6172b5df9a97c22d2af93aac789.jpg"
  },
  specifications: {
    Material: "100% Cotton",
    Fit: "Oversized",
    Sleeve: "Short",
    Neck: "Round Neck"
  }
},
{
  id: 12,
  name: "Nxew's Men's Oversized T-Shirt",
  description: "Comfortable and stylish men's oversized t-shirt",
  category: "T-Shirts",
  price: 399,
  discount: 42,
  size: "L",
  color: "Black",
  clothType: "100% Cotton",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Machine washable and weatherproof.this product is sold out",

  images: [
    "https://i.pinimg.com/736x/78/3e/39/783e39cca642ba73cd5455ce8be39608.jpg",
    "https://i.pinimg.com/736x/a8/03/b7/a803b71b74c0b3c7f70938556d480111.jpg",
    "https://i.pinimg.com/736x/26/94/be/2694be21bc82399c67208bf6d65068a4.jpg",
    "https://i.pinimg.com/736x/37/a7/e2/37a7e22ccccb2fd9e158db92d9fe094d.jpg",
    "https://i.pinimg.com/736x/ae/36/14/ae36149467f17d37a86ab84051b321f7.jpg"
  ],
  colorImages: {
    "Black": "https://i.pinimg.com/736x/78/3e/39/783e39cca642ba73cd5455ce8be39608.jpg"
  },
  specifications: {
    Material: "100% Cotton",
    Fit: "Oversized",
    Sleeve: "Short",
    Neck: "Round Neck"
  }
},
{
  id: 13,
  name: "Alien Men's Oversized T-Shirt",
  description: "Comfortable and stylish oversized t-shirt with alien graphic",
  category: "T-Shirts",
  price: 349,
  discount: 26,
  size: "L",
  color: "Black",
  clothType: "100% Cotton",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Machine washable and weatherproof.this product is sold out",

  images: [
    "https://i.pinimg.com/736x/22/3e/6e/223e6ec6ab0a025177a6502a10d4cceb.jpg",
    "https://i.pinimg.com/736x/1f/f9/3e/1ff93ece8aa88d219e7f653815af9968.jpg",
    "https://i.pinimg.com/736x/0a/71/e1/0a71e1b76821af8f9ef8ceb1d843a1b7.jpg",
    "https://i.pinimg.com/736x/ad/35/e2/ad35e2b64522a040c6fc3d0c64e8c09f.jpg"
  ],
  colorImages: {
    "Black": "https://i.pinimg.com/736x/22/3e/6e/223e6ec6ab0a025177a6502a10d4cceb.jpg"
  },
  specifications: {
    Material: "100% Cotton",
    Fit: "Oversized",
    Sleeve: "Short",
    Neck: "Round Neck"
  }
},
{
  id: 14,
  name: "Nxew's White Sweat T-Shirt",
  description: "Stylish and comfortable sweat t-shirt for cooler days",
  category: "Sweat T-Shirts",
  price: 449.99,
  discount: 32,
  size: "XL, XXL",
  color: "White",
  clothType: "100% Cotton",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "High-quality cotton, perfect for winter",

  images: [
    "https://i.pinimg.com/736x/f1/4f/81/f14f81d82a4cc1f45abc6f0a9f5deffe.jpg",
    "https://i.pinimg.com/736x/67/45/86/674586f94e1db394448a9ab0257cc729.jpg"
  ],
  colorImages: {
    "White": "https://i.pinimg.com/736x/f1/4f/81/f14f81d82a4cc1f45abc6f0a9f5deffe.jpg"
  },
  specifications: {
    Material: "100% Cotton",
    Fit: "Slim Fit",
    Sleeve: "Long Sleeve",
    Neck: "Collarless"
  }
},
{
  id: 15,
  name: "Nxew's Black Sweat T-Shirt",
  description: "Weatherproof black sweat t-shirt for versatile wear",
  category: "Sweat T-Shirts",
  price: 499.99,
  discount: 37,
  size: "XXL",
  color: "Black",
  clothType: "100% Cotton",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Breathable fabric, comfortable to wear",
 
  images: [
    "https://i.pinimg.com/736x/a8/28/16/a82816b8a65b325163dd0271d08780c4.jpg",
    "https://i.pinimg.com/736x/a7/00/04/a70004de24160bca35a5ce2a16012957.jpg"
  ],
  colorImages: {
    "Black": "https://i.pinimg.com/736x/68/41/79/684179f8e602a855fc3a87695ed47d76.jpg"
  },
  specifications: {
    Material: "100% Cotton",
    Fit: "Regular Fit",
    Sleeve: "Long Sleeve",
    Neck: "Collarless"
  }
},
{
  id: 16,
  name: "Nxew's Half Sleeve Embroidered Shirt",
  description: "Relaxed fit embroidered half-sleeve shirt",
  category: "Half Sleeve Shirts",
  price: 349.99,
  discount: 20,
  size: "L",
  color: "Blue",
  clothType: "Cotton Viscose",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Stylish and comfortable, perfect for casual outings.this product is sold out",

  images: [
    "https://i.pinimg.com/736x/ca/d0/dd/cad0dd3c7f3880dee714da8bdecdf723.jpg",
    "https://i.pinimg.com/736x/13/1d/aa/131daac4414ce7338ccdd6941ad7d130.jpg"
  ],
  colorImages: {
    "Blue": "https://i.pinimg.com/736x/ca/d0/dd/cad0dd3c7f3880dee714da8bdecdf723.jpg"
  },
  specifications: {
    Material: "Cotton Viscose",
    Fit: "Relaxed Fit",
    Sleeve: "Half Sleeves",
    Neck: "Cuban Collar"
  }
},
{
  id: 17,
  name: "Half Sleeve Acid Wash T-Shirt",
  description: "Relaxed fit embroidered acid wash t-shirt",
  category: "T-Shirts",
  price: 249.99,
  discount: 24,
  size: "L",
  color: "Blue",
  clothType: "100% Cotton",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Men's Blue Hustle Typography Oversized Acid Wash T-shirt",

  images: [
    "https://i.pinimg.com/736x/8b/0b/21/8b0b21072e783ba7534c8975519f2d85.jpg",
    "https://i.pinimg.com/736x/81/91/62/81916265cf66a6079ff353528add0773.jpg",
    "https://i.pinimg.com/736x/03/ab/0c/03ab0c096a7b92e5609cd7b72ec585f6.jpg"
  ],
  colorImages: {
    "Blue": "https://i.pinimg.com/736x/8b/0b/21/8b0b21072e783ba7534c8975519f2d85.jpg"
  },
  specifications: {
    Material: "100% Cotton",
    Fit: "Relaxed Fit",
    Sleeve: "Half Sleeves",
    Neck: "Round Neck"
  }
},
 
 {
  id: 18,
  name: "White and Blue Checked Shirt",
  description: "A classic checked pattern in white and blue",
  category: "Shirts",
  price: 449.99,
  discount: 25,
  size: "M, L, XL",
  color: "White/Blue",
  clothType: "100% Cotton",
  deliveryTime: "3-5 days",
  returnPolicy: "5 days return policy",
  additionalDetails: "Machine washable and weatherproof",

  images: [
    "https://i.pinimg.com/736x/21/18/fd/2118fdf81834bed89278637cc28a4b6b.jpg",
    "https://i.pinimg.com/736x/a9/6a/4d/a96a4d91674df0aa24b501cfd3ed0a7f.jpg",
    "https://i.pinimg.com/736x/de/50/26/de50269b67041f424977c20648f7f695.jpg",
    "https://i.pinimg.com/736x/ca/fb/cd/cafbcd9c7bff346dfc123b50a8c78949.jpg"
  ],
  colorImages: {
    "White/Blue": "https://i.pinimg.com/736x/21/18/fd/2118fdf81834bed89278637cc28a4b6b.jpg"
  },
  specifications: {
    Material: "100% Cotton",
    Fit: "Regular Fit",
    Sleeve: "Full Sleeve",
    Wear: "Casual, Formal",
    Collar: "Spread Collar with checked pattern"
  }
},

{
  "id": 19,
  "name": "Men's White & Red Strips Shirt",
  "description": "Classic white and red striped shirt for versatile casual wear and formal wear. The shirt features a timeless design with bold red stripes on a crisp white background, making it a stylish choice for both casual and formal occasions.",
  "category": "Shirts",
  "price": 499.99,
  "discount": 25,
  "size": "L",
  "color": "White & Red Strips",
  "clothType": "Cotton Polyester Blend",
  "deliveryTime": "3-5 days",
  "returnPolicy": "5 days return policy",
  "additionalDetails": "Hustle formal shirt.Fresh new arrival with premium fabric",
  "newArrivalPosition": 7,
  "images": [
      "https://i.pinimg.com/736x/34/09/94/340994bc43fd681c0072fdeec6d1d193.jpg",
      "https://i.pinimg.com/736x/7a/70/33/7a7033f40afb242e07b98aa1f71d205e.jpg",
      "https://i.pinimg.com/736x/89/93/2f/89932f5a6eb4a7d3a4d232667886dcc2.jpg",
      "https://i.pinimg.com/736x/44/6b/85/446b852960757c1a001a98beccd9aa1e.jpg",
      "https://i.pinimg.com/736x/2f/ce/4c/2fce4c851a0679d57798395f7068ee67.jpg",
  ],
  "colorImages": {
      "White & Red Strips": "https://i.pinimg.com/736x/34/09/94/340994bc43fd681c0072fdeec6d1d193.jpg",
      "Blue & Red Strips": "https://i.pinimg.com/736x/44/6b/85/446b852960757c1a001a98beccd9aa1e.jpg",
  },
  "specifications": {
      "Material": "Cotton Polyester Blend",
      "Sleeve": "Full Sleeves",
      "Collar": "Spread Collar",
      "Occasion": "Formal and informal",
      "Pattern": "Striped",
      "FabricCare": "Machine Wash",
      "Pocket": "Single Chest Pocket"
  }
}
];
// Save data to localStorage
function saveData() {
localStorage.setItem("users", JSON.stringify(users));
localStorage.setItem("cart", JSON.stringify(cart));
localStorage.setItem("orders", JSON.stringify(orders));
localStorage.setItem("notifications", JSON.stringify(notifications));
localStorage.setItem("ownerNotifications", JSON.stringify(ownerNotifications));
localStorage.setItem("currentUser", JSON.stringify(currentUser));
}
// Load data from localStorage
function loadData() {
users = JSON.parse(localStorage.getItem("users")) || [];
cart = JSON.parse(localStorage.getItem("cart")) || [];
orders = JSON.parse(localStorage.getItem("orders")) || [];
notifications = JSON.parse(localStorage.getItem("notifications")) || [];
ownerNotifications = JSON.parse(localStorage.getItem("ownerNotifications")) || [];
currentUser = JSON.parse(localStorage.getItem("currentUser"));
trackWebsiteVisit();
startVisitorPresenceHeartbeat();
try {
  const adminSession = JSON.parse(localStorage.getItem("currentAdmin"));
  currentAdmin = adminSession && adminSession.email === ADMIN_EMAIL ? adminSession : null;
} catch (e) {
  currentAdmin = null;
}
if (currentUser && currentUser.isLoggedIn) {
  const user = users.find(u => u.email === currentUser.email);
  if (user) {
    currentUser = { ...user, isLoggedIn: true, lastActivity: new Date().toISOString() };
  } else {
    currentUser = null;
  }
} else {
  currentUser = null;
}
updateMenuAccountDetails();
updateCartCountBadge();
generateProducts("shopProductContainer", products);
generateProducts("menswearContainer", products.filter(p => p.category === "Men's Wear"));
generateProducts("accessoriesContainer", products.filter(p => p.category === "Accessories"));
generateProducts("featuredProductsContainer", products.slice(0, 100));
}
// Show notification function
function showNotification(message, type = "success", options = {}) {
const { title = type.charAt(0).toUpperCase() + type.slice(1), duration = 3000, persist = false } = options;
const toastEl = document.createElement("div");
toastEl.className = `toast text-white bg-${type} border-0`;
toastEl.setAttribute("role", "alert");
toastEl.setAttribute("aria-live", "polite");
toastEl.setAttribute("aria-atomic", "true");
toastEl.setAttribute("aria-label", `${title} notification`);
const icons = {
  success: "bi-check-circle-fill",
  danger: "bi-exclamation-triangle-fill",
  warning: "bi-exclamation-circle-fill",
  info: "bi-info-circle-fill",
};
const iconClass = icons[type] || "bi-bell-fill";

toastEl.innerHTML = `
  <div class="toast-header">
    <i class="bi ${iconClass} notification-icon"></i>
    <strong class="toast-title">${title}</strong>
    <small>${new Date().toLocaleTimeString()}</small>
    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
  </div>
  <div class="toast-body">
    ${message}
  </div>
`;

document.getElementById("toastContainer").appendChild(toastEl);
const toastOptions = persist ? { autohide: false } : { delay: duration };
const toast = new bootstrap.Toast(toastEl, toastOptions);
toast.show();

toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());

notifications.push({ message, type, title, date: new Date().toLocaleString() });
saveData();
}

// Show popup message
function showPopupMessage(message) {
document.getElementById("popupMessageContent").innerHTML = message;
const popupModal = new bootstrap.Modal(document.getElementById("popupMessageModal"));
popupModal.show();
}
// Update user activity
function updateUserActivity() {
if (currentUser) {
  currentUser.lastActivity = new Date().toISOString();
  const userIndex = users.findIndex(u => u.email === currentUser.email);
  if (userIndex !== -1) users[userIndex].lastActivity = currentUser.lastActivity;
  saveData();
}
}
// Get active users (last 5 minutes)
function getActiveUsers() {
const now = new Date();
const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
return users.filter(user => new Date(user.lastActivity) > fiveMinutesAgo).length;
}

// Get live users (last 1 minute)
function getLiveUsers() {
const now = new Date();
const oneMinuteAgo = new Date(now - 1 * 60 * 1000);
return users.filter(user => new Date(user.lastActivity) > oneMinuteAgo).length;
}

// =====================================================
// NXew Real-time Visitor Presence (local-only)
// =====================================================
function getOrCreateVisitorId() {
  const key = "nxewVisitorId";
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = `v_${Math.random().toString(16).slice(2)}_${Date.now()}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch (e) {
    // If localStorage is not available, fall back to a volatile id.
    return `v_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
}

function updateVisitorPresence() {
  try {
    const presenceKey = "nxewPresence";
    const visitorId = getOrCreateVisitorId();
    const now = Date.now();

    const presence = JSON.parse(localStorage.getItem(presenceKey)) || {};
    presence[visitorId] = now;

    // Cleanup entries older than 2 minutes
    const cutoff = now - 2 * 60 * 1000;
    Object.keys(presence).forEach(id => {
      const ts = Number(presence[id]);
      if (!Number.isFinite(ts) || ts < cutoff) delete presence[id];
    });

    localStorage.setItem(presenceKey, JSON.stringify(presence));
  } catch (e) {
    // Ignore tracking errors.
  }
}

function startVisitorPresenceHeartbeat() {
  if (visitorPresenceInterval) return;
  updateVisitorPresence();
  visitorPresenceInterval = setInterval(updateVisitorPresence, 15000); // heartbeat every 15s
}

function getLiveVisitors() {
  try {
    const presenceKey = "nxewPresence";
    const presence = JSON.parse(localStorage.getItem(presenceKey)) || {};
    const now = Date.now();
    const cutoff = now - 1 * 60 * 1000;
    return Object.keys(presence).filter(id => {
      const ts = Number(presence[id]);
      return Number.isFinite(ts) && ts > cutoff;
    }).length;
  } catch (e) {
    return 0;
  }
}

function getActiveVisitors() {
  try {
    const presenceKey = "nxewPresence";
    const presence = JSON.parse(localStorage.getItem(presenceKey)) || {};
    const now = Date.now();
    const cutoff = now - 5 * 60 * 1000;
    return Object.keys(presence).filter(id => {
      const ts = Number(presence[id]);
      return Number.isFinite(ts) && ts > cutoff;
    }).length;
  } catch (e) {
    return 0;
  }
}

// =====================================================
// NXew Admin Analytics (local-only)
// =====================================================
function getTodayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function trackWebsiteVisit() {
  try {
    const statsKey = "nxewVisitorStats";
    const now = new Date();
    const todayKey = getTodayKey();

    const stats = JSON.parse(localStorage.getItem(statsKey)) || {};
    stats.totalVisits = Number(stats.totalVisits) || 0;
    stats.todayVisits = Number(stats.todayVisits) || 0;

    if (stats.todayKey !== todayKey) {
      stats.todayKey = todayKey;
      stats.todayVisits = 0;
    }

    stats.totalVisits += 1;
    stats.todayVisits += 1;
    stats.lastVisit = now.toISOString();

    localStorage.setItem(statsKey, JSON.stringify(stats));
    // Update real-time presence as well (for this device/browser tabs)
    updateVisitorPresence();
  } catch (e) {
    // Ignore tracking errors (localStorage unavailable, etc.)
  }
}

function getVisitorStats() {
  const stats = JSON.parse(localStorage.getItem("nxewVisitorStats")) || {};
  return {
    totalVisits: Number(stats.totalVisits) || 0,
    todayVisits: Number(stats.todayVisits) || 0,
    lastVisit: stats.lastVisit || null
  };
}

function formatINR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${n.toFixed(2)}`;
}

function updateAdminDashboard() {
  if (!currentAdmin) return;

  const visits = getVisitorStats();
  const activeVisitors = typeof getActiveVisitors === "function" ? getActiveVisitors() : 0;
  const liveVisitors = typeof getLiveVisitors === "function" ? getLiveVisitors() : 0;

  const totalOrders = Array.isArray(orders) ? orders.length : 0;
  const totalRevenue = (orders || []).reduce((sum, o) => {
    const val = parseFloat(o?.totalAmount);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);

  const conversionRate = visits.totalVisits > 0 ? (totalOrders / visits.totalVisits) * 100 : 0;

  // Metrics
  document.getElementById("adminTotalVisits").textContent = visits.totalVisits;
  document.getElementById("adminTodayVisitsSub").textContent = `Today: ${visits.todayVisits}`;
  document.getElementById("adminActiveUsers").textContent = activeVisitors;
  document.getElementById("adminLiveUsers").textContent = liveVisitors;
  document.getElementById("adminTotalOrders").textContent = totalOrders;
  document.getElementById("adminTotalRevenue").textContent = formatINR(totalRevenue);
  document.getElementById("adminConversionRate").textContent = `${conversionRate.toFixed(1)}%`;

  const totalMembers = Array.isArray(users) ? users.length : 0;
  const todayKey = getTodayKey();
  const todayMembers = (users || []).filter(u => {
    const ts = u.createdAt || u.lastActivity;
    if (!ts) return false;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return false;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return key === todayKey;
  }).length;
  document.getElementById("adminTotalMembers").textContent = totalMembers;
  document.getElementById("adminTodayMembers").textContent = todayMembers;

  // Recent users
  const recentUsers = [...(users || [])]
    .sort((a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0))
    .slice(0, 5);

  const recentUsersEl = document.getElementById("adminRecentUsers");
  if (recentUsersEl) {
    recentUsersEl.innerHTML = recentUsers.length
      ? recentUsers
          .map(u => {
            const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
            const dateStr = u.lastActivity ? new Date(u.lastActivity).toLocaleString() : "";
            return `
              <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                <div>
                  <div class="fw-bold">${fullName || "User"}</div>
                  <div class="small text-muted">${u.email || ""}</div>
                </div>
                <div class="small text-muted">${dateStr}</div>
              </div>
            `;
          })
          .join("")
      : `<div class="text-muted">No users yet.</div>`;
  }

  // Recent orders
  const recentOrders = [...(orders || [])].slice(-5).reverse();
  const recentOrdersEl = document.getElementById("adminRecentOrders");
  if (recentOrdersEl) {
    recentOrdersEl.innerHTML = recentOrders.length
      ? recentOrders
          .map(o => {
            const productName = o?.product?.name || "Order";
            const buyerEmail = o?.buyer?.email || "";
            const dateStr = o?.date ? String(o.date) : "";
            return `
              <div class="mb-3 pb-3 border-bottom">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="fw-bold">${productName}</div>
                  <div class="fw-bold">${formatINR(o?.totalAmount || 0)}</div>
                </div>
                <div class="small text-muted">${buyerEmail}</div>
                <div class="small text-muted">${dateStr}</div>
              </div>
            `;
          })
          .join("")
      : `<div class="text-muted">No orders yet.</div>`;
  }

  // Orders chart (last 7 days)
  const barsEl = document.getElementById("adminOrders7dBars");
  if (barsEl) {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days.push({ key, label });
    }

    const counts = new Array(days.length).fill(0);
    for (const o of orders || []) {
      const od = o?.date ? new Date(o.date) : null;
      if (!od || isNaN(od.getTime())) continue;
      const yyyy = od.getFullYear();
      const mm = String(od.getMonth() + 1).padStart(2, "0");
      const dd = String(od.getDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      const idx = days.findIndex(d => d.key === key);
      if (idx >= 0) counts[idx] += 1;
    }

    const max = Math.max(...counts, 1);
    barsEl.innerHTML = counts
      .map((c, i) => {
        const pct = Math.round((c / max) * 100);
        const height = Math.max(6, pct);
        return `
          <div class="admin-bar-item">
            <div class="admin-bar" style="height: ${height}%;"></div>
            <div class="admin-bar-label">${days[i].label}</div>
          </div>
        `;
      })
      .join("");
  }
}

function startAdminRealtimeUpdates() {
  if (adminRealtimeInterval) return;
  updateAdminDashboard();
  adminRealtimeInterval = setInterval(() => {
    // Only update while admin is on dashboard
    if (currentAdmin) updateAdminDashboard();
  }, 2000);
}

function stopAdminRealtimeUpdates() {
  if (adminRealtimeInterval) {
    clearInterval(adminRealtimeInterval);
    adminRealtimeInterval = null;
  }
}

function adminLogout() {
  currentAdmin = null;
  stopAdminRealtimeUpdates();
  try {
    localStorage.removeItem("currentAdmin");
  } catch (e) {}
  showNotification("Admin logged out.", "info");
  showSection("loginSection");
}
// Hide menu
function hideMenu() {
const menuCanvas = bootstrap.Offcanvas.getInstance(document.getElementById("menuCanvas"));
if (menuCanvas) menuCanvas.hide();
}

function getProductRating(productId) {
const productOrders = orders.filter(order => order.product.id === productId && order.rating !== null);
if (productOrders.length === 0) {
  return null;
}
const totalRating = productOrders.reduce((sum, order) => sum + order.rating, 0);
const averageRating = totalRating / productOrders.length;
return { average: averageRating.toFixed(1), count: productOrders.length };
}

// Toggle search bar visibility
function toggleSearchBar() {
const searchBarContainer = document.getElementById("searchBarContainer");
if (searchBarContainer.style.display === "none" || searchBarContainer.style.display === "") {
  searchBarContainer.style.display = "flex";
  document.getElementById("searchSectionInput").focus();
  performSearch();
} else {
  searchBarContainer.style.display = "none";
}
}

// Handle search input with debounce
function handleSearchInput() {
clearTimeout(searchTimeout);
searchTimeout = setTimeout(() => {
  performSearch();
  showSearchSuggestions();
}, 300); // 300ms debounce delay
}

// Show search suggestions
function showSearchSuggestions() {
const input = document.getElementById("searchSectionInput").value.toLowerCase();
const suggestionsContainer = document.getElementById("searchSuggestions");

if (input.length < 2) {
  suggestionsContainer.style.display = "none";
  return;
}

const suggestions = products.filter(product =>
  product.name.toLowerCase().includes(input) ||
  product.description.toLowerCase().includes(input) ||
  product.category.toLowerCase().includes(input)
).slice(0, 50);

if (suggestions.length === 0) {
  suggestionsContainer.style.display = "none";
  return;
}

let html = '';
suggestions.forEach(product => {
  html += `
    <div class="search-suggestion-item" onclick="document.getElementById('searchSectionInput').value='${product.name}'; performSearch(); document.getElementById('searchSuggestions').style.display='none';">
      ${product.name} - ${product.category}
    </div>
  `;
});

suggestionsContainer.innerHTML = html;
suggestionsContainer.style.display = "block";
}

function showAllProductsInSearch() {
const input = document.getElementById("searchSectionInput");
if (input) input.value = "";
const suggestionsContainer = document.getElementById("searchSuggestions");
if (suggestionsContainer) suggestionsContainer.style.display = "none";
if (typeof displaySearchResults === "function") {
  displaySearchResults(products);
}
}

// Perform search with all filters activated
function performSearch() {
const query = document.getElementById("searchSectionInput").value.toLowerCase();
const category = document.getElementById("searchCategory")?.value || "";
const priceRange = document.getElementById("searchPrice")?.value || "";
const minRating = document.getElementById("searchRating")?.value || "";
const sortBy = document.getElementById("searchSort")?.value || "relevance";
const size = document.getElementById("searchSize")?.value || "";
const color = document.getElementById("searchColor")?.value || "";

let filteredProducts = [...products];

if (query) {
  filteredProducts = filteredProducts.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query)
  );
}

if (category) {
  filteredProducts = filteredProducts.filter(p => p.category === category);
}

if (priceRange) {
  const [min, max] = priceRange.split("-").map(Number);
  filteredProducts = filteredProducts.filter(p => {
    if (max) return p.price >= min && p.price <= max;
    return p.price >= min;
  });
}

if (minRating) {
  filteredProducts = filteredProducts.filter(p => {
    const ratingInfo = getProductRating(p.id);
    return ratingInfo && ratingInfo.average >= parseInt(minRating);
  });
}

if (size) {
  filteredProducts = filteredProducts.filter(p =>
    p.size.split(",").map(s => s.trim().toLowerCase()).includes(size.toLowerCase())
  );
}

if (color) {
  filteredProducts = filteredProducts.filter(p =>
    p.color.split(",").map(c => c.trim().toLowerCase()).includes(color.toLowerCase())
  );
}

switch (sortBy) {
  case "price-low":
    filteredProducts.sort((a, b) => a.price - b.price);
    break;
  case "price-high":
    filteredProducts.sort((a, b) => b.price - a.price);
    break;
  case "rating":
    filteredProducts.sort((a, b) => {
      const ratingA = getProductRating(a.id)?.average || 0;
      const ratingB = getProductRating(b.id)?.average || 0;
      return ratingB - ratingA;
    });
    break;
  case "newest":
    filteredProducts.sort((a, b) => b.id - a.id);
    break;
  default:
    if (query) {
      filteredProducts.sort((a, b) => {
        const aMatches = a.name.toLowerCase().includes(query) ? 1 : 0;
        const bMatches = b.name.toLowerCase().includes(query) ? 1 : 0;
        return bMatches - aMatches;
      });
    }
}

displaySearchResults(filteredProducts);
updateSearchActiveFilters(query, category, priceRange, minRating, size, color, sortBy);
}
// Display search results
function displaySearchResults(results) {
const container = document.getElementById("searchResultsContainer");
const countElement = document.getElementById("searchResultsCount");

countElement.textContent = `${results.length} products found`;

if (results.length === 0) {
  container.innerHTML = "<p>No products found.</p>";
  return;
}

container.innerHTML = "";
results.forEach(product => {
  const discount = product.discount || 0;
  const originalPrice = discount > 0 ? (product.price / (1 - discount / 100)).toFixed(2) : product.price.toFixed(2);
  const isSoldOut = product.additionalDetails.toLowerCase().includes("sold out"); // Check for sold out
  
  const card = `
    <div class="col-6 mb-4">
      <div class="card shadow-sm product-card" style="position: relative;" onclick="showProductDetails(${product.id})">
        <img src="${product.images && product.images.length ? product.images[0] : 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.name)}" 
             class="card-img-top" alt="${product.name}">
        ${discount > 0 ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2">${discount}% OFF</span>` : ''}
        ${isSoldOut ? `<span class="badge bg-dark position-absolute top-0 end-0 m-2">Sold Out</span>` : `
        `}
        <div class="card-body">
          <h5 class="card-title">${product.name}</h5>
          <p class="card-text">
            <span class="fw-bold">₹${product.price.toFixed(2)}</span>
            ${discount > 0 ? `<small class="text-decoration-line-through text-muted ms-1">₹${originalPrice}</small>` : ''}
          </p>
        </div>
      </div>
    </div>
  `;
  container.innerHTML += card;
});
}
// Voice search functionality
function startVoiceSearch() {
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  showNotification("Voice search is not supported in your browser.", "warning");
  return;
}

const recognition = new SpeechRecognition();
const voiceSearchBtn = document.getElementById("voiceSearchButton");

recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = "en-US";

recognition.onstart = function() {
  voiceSearchBtn.classList.add("active");
  showNotification("Listening... Please speak clearly.", "info", { duration: 2000 });
};

recognition.onresult = function(event) {
  const results = event.results[0];
  let transcript = results[0].transcript.trim().toLowerCase();
  transcript = cleanTranscript(transcript);

  document.getElementById("searchSectionInput").value = transcript;
  toggleSearchBar();
  addToSearchHistory(transcript);
  performSearch();
  showNotification(`Searching for: "${transcript}"`, "success");

  resetVoiceSearchButton();
};

recognition.onerror = function(event) {
  resetVoiceSearchButton();
  let errorMessage = "An error occurred during voice search.";
  switch (event.error) {
    case "no-speech":
      errorMessage = "No speech detected. Please try again.";
      break;
    case "not-allowed":
    case "service-not-allowed":
      errorMessage = "Microphone access denied. Please enable it in your browser settings.";
      break;
    case "audio-capture":
      errorMessage = "No microphone detected. Please ensure one is connected.";
      break;
    default:
      errorMessage = `Voice search error: ${event.error}`;
  }
  showNotification(errorMessage, "danger");
};

recognition.onend = function() {
  resetVoiceSearchButton();
  showNotification("Voice search completed.", "info", { duration: 1500 });
};

try {
  recognition.start();
} catch (e) {
  resetVoiceSearchButton();
  showNotification("Failed to start voice search. Please try again.", "danger");
}
}

// Helper function to clean up the transcript
function cleanTranscript(transcript) {
const fillers = ["um", "uh", "like", "you know"];
let cleaned = transcript.split(" ").filter(word => !fillers.includes(word)).join(" ");

const corrections = {
  "t shirt": "t-shirt",
  "jeans": "denim jeans",
  "sun glasses": "sunglasses",
  "watch": "wrist watch",
  "accessory": "accessories",
};
Object.keys(corrections).forEach(mistake => {
  if (cleaned.includes(mistake)) {
    cleaned = cleaned.replace(mistake, corrections[mistake]);
  }
});

return cleaned;
}

// Helper function to reset the voice search button
function resetVoiceSearchButton() {
const voiceSearchBtn = document.getElementById("voiceSearchButton");
voiceSearchBtn.classList.remove("active");
voiceSearchBtn.innerHTML = '<i class="bi bi-mic"></i>';
}

// Generate products function with support for different layouts
function generateProducts(containerId, productList) {
const container = document.getElementById(containerId);

if (!container) return; // Exit if container not found

// Update results count if applicable
const countElement = document.getElementById(`${containerId.replace("Container", "")}ResultsCount`);
if (countElement) {
  const query = document.getElementById("searchInput")?.value.trim();
  countElement.textContent = query ? 
    `${productList.length} products found` : 
    "All products";
}

// Handle empty product list
if (productList.length === 0) {
  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <i class="bi bi-search" style="font-size: 3rem; color: #ccc;"></i>
      <h4 class="mt-3">No products found</h4>
      <p>Try adjusting your search</p>
    </div>
  `;
  return;
}

container.innerHTML = "";
}
// Generate products function with fixed discount
function generateProducts(containerId, productList, showDiscount = true) {
const container = document.getElementById(containerId);

if (!container) return;

// Update results count if applicable (unchanged)
if (containerId !== "featuredProductsContainer") {
  const countElement = document.getElementById(`${containerId.replace("Container", "")}ResultsCount`);
  if (countElement) {
    const query = document.getElementById("searchInput")?.value.trim();
    countElement.textContent = query ? 
      `${productList.length} products found` : 
      "All products";
  }
}

// Handle empty product list (unchanged)
if (productList.length === 0) {
  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <i class="bi bi-search" style="font-size: 3rem; color: #ccc;"></i>
      <h4 class="mt-3">No products found</h4>
      <p>Try adjusting your search</p>
    </div>
  `;
  return;
}

container.innerHTML = "";

productList.forEach(product => {
  const discount = product.discount || 0;
  const originalPrice = discount > 0 ? (product.price / (1 - discount / 100)).toFixed(2) : product.price.toFixed(2);
  const ratingInfo = getProductRating(product.id);    
  if (containerId === "featuredProductsContainer") {
    const card = `
      <div class="col-6 col-md-4 col-lg-3 mb-4">
        <div class="card shadow-sm product-card" onclick="showProductDetails(${product.id})">
          <div style="position: relative;">
            <img src="${product.images && product.images.length ? product.images[0] : 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.name)}" 
                 class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
            ${showDiscount && discount > 0 ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2">${discount}% OFF</span>` : ''}
            </button>
          </div>
          <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text text-muted" style="font-size: 0.9rem;">${product.description}</p>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span class="fw-bold">₹${product.price.toFixed(2)}</span>
                ${showDiscount && discount > 0 ? `<small class="text-decoration-line-through text-muted ms-1">₹${originalPrice}</small>` : ''}
              </div>
              ${ratingInfo ? `
                <div class="d-flex align-items-center">
                  <i class="bi bi-star-fill text-warning me-1"></i>
                  <small>${ratingInfo.average}</small>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += card;
  } else {
    const card = `
      <div class="col-6 mb-4">
        <div class="card shadow-sm product-card" style="position: relative;" onclick="showProductDetails(${product.id})">
          <img src="${product.images && product.images.length ? product.images[0] : 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.name)}" 
               class="card-img-top" alt="${product.name}">
          ${showDiscount && discount > 0 ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2">${discount}% OFF</span>` : ''}
          <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text">${product.description}</p>
            <p class="card-text">
              <span class="fw-bold">₹${product.price.toFixed(2)}</span>
              ${showDiscount && discount > 0 ? `<small class="text-decoration-line-through text-muted ms-1">₹${originalPrice}</small>` : ''}
            </p>
            ${ratingInfo ? `
              <p class="card-text">
                <i class="bi bi-star-fill text-warning"></i> 
                ${ratingInfo.average} (${ratingInfo.count} reviews)
              </p>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    container.innerHTML += card;
  }
});
}
// Get recommended products
function getRecommendedProducts(currentProductId) {
const currentProduct = products.find(p => p.id === currentProductId);
if (!currentProduct) return [];

let recommendations = products.filter(p =>
  p.category === currentProduct.category &&
  p.id !== currentProductId
);

if (recommendations.length < 20) {
  const otherProducts = products.filter(p =>
    p.category !== currentProduct.category &&
    p.id !== currentProductId
  );
  recommendations = [...recommendations, ...otherProducts.slice(0, 100 - recommendations.length)];
}

return recommendations.slice(0, 100);
}

// Generate recommended products with fixed discount
function generateRecommendedProducts(recommendations) {
if (recommendations.length === 0) return '';

let html = `
  <div class="recommendations-section">
    <h3 class="recommendations-title">You May Also Like</h3>
    <div class="row">
`;

recommendations.forEach(product => {
  const discount = product.discount || 0;
  const originalPrice = discount > 0 ? (product.price / (1 - discount / 100)).toFixed(2) : product.price.toFixed(2);
  const discountedPrice = product.price.toFixed(2);

  html += `
    <div class="col-6 col-md-3">
      <div class="card recommendation-card" onclick="showProductDetails(${product.id})">
        <div class="recommendation-media">
          <img src="${product.images && product.images.length ? product.images[0] : 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.name)}"
               class="recommendation-img" alt="${product.name}">
          ${discount > 0 ? `<span class="recommendation-badge">${discount}% OFF</span>` : ''}
        </div>
        <div class="card-body">
          <h5 class="card-title">${product.name}</h5>
          <p class="card-text">
            <span class="fw-bold">₹${discountedPrice}</span>
            ${discount > 0 ? `<small class="text-decoration-line-through text-muted ms-1">₹${originalPrice}</small>` : ''}
          </p>
        </div>
      </div>
    </div>
  `;
});

html += `
    </div>
  </div>
`;

return html;
}
// Show product details with fixed discount
function showProductDetails(productId) {
const product = products.find(p => p.id === productId);
if (!product) return;

const sizes = product.size.split(",").map(s => s.trim());
const colorsFromField = (product.color || '').split(",").map(c => c.trim()).filter(Boolean);
const colorsFromImages = Object.keys(product.colorImages || {});
const colors = [...new Set([...colorsFromField, ...colorsFromImages].map(c => c.trim()).filter(Boolean))];
const defaultColor = colors[0] || product.color || 'Default';
const discount = product.discount || 0;
const originalPrice = discount > 0 ? (product.price / (1 - discount / 100)).toFixed(2) : product.price.toFixed(2);
const ratingInfo = getProductRating(productId);

// Generate carousel HTML for scrollable images
let carouselHtml = `
  <div id="productCarousel" class="carousel slide carousel-fade" data-bs-ride="carousel">
    <div class="carousel-inner">
`;
product.images.forEach((img, index) => {
  carouselHtml += `
    <div class="carousel-item ${index === 0 ? 'active' : ''}">
      <img ${index === 0 ? 'id="mainProductImage"' : ''} src="${img}" class="d-block w-100 product-detail-img" alt="${product.name}">
    </div>
  `;
});
carouselHtml += `
    </div>
    <button class="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev">
      <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Previous</span>
    </button>
    <button class="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next">
      <span class="carousel-control-next-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Next</span>
    </button>
  </div>
`;

// Generate color image thumbnails (like the screenshot)
const colorThumbnails = (colors.length ? colors : [defaultColor]).map(color => {
  const imageUrl =
    product.colorImages?.[color] ||
    (product.images && product.images.length ? product.images[0] : 'https://via.placeholder.com/200x200?text=' + encodeURIComponent(product.name));
  return `
    <button type="button"
            class="color-thumb ${color === defaultColor ? 'selected' : ''}"
            data-color="${color}"
            onclick="selectColor('${color.replace(/'/g, "\\'")}')"
            title="${color}"
            aria-label="Select color ${color}">
      <img src="${imageUrl}" alt="${color}">
    </button>
  `;
}).join("");

// Generate size buttons
let sizeButtons = sizes.map(size => `
  <button type="button" class="btn btn-outline-secondary size-btn ${size === sizes[0] ? 'active' : ''}" 
          data-size="${size}" onclick="selectSize('${size}')">${size}</button>
`).join("");

// Specifications table
const specifications = product.specifications || {
  "Material": product.clothType,
  "Fit": "Regular",
  "Sleeve": "N/A",
  "Neck": "N/A"
};
const specTable = Object.entries(specifications).map(([key, value]) => `
  <tr><td>${key}</td><td>${value}</td></tr>
`).join("");

// Recommended products
const recommendations = getRecommendedProducts(productId);
const recommendationsHTML = generateRecommendedProducts(recommendations);

// Full product detail content
const detailContent = `
  <div class="container">
    <div class="row">
      <div class="col-md-6">
        ${carouselHtml}
        <div class="color-selection mt-3">
          <div class="colors-title">COLORS</div>
          <div class="colors-row" role="list" aria-label="Available colors">
            ${colorThumbnails}
          </div>
          <div class="selected-meta text-center mt-2">Selected: <span id="selectedColorText">${defaultColor}</span></div>
        </div>
      </div>
      <div class="col-md-6">
        <h2 class="mb-3">${product.name}</h2>
        <div class="ratings mb-2">
          ${ratingInfo ? `
            <span class="badge bg-success me-2">
              <i class="bi bi-star-fill text-white"></i> ${ratingInfo.average}
            </span>
            <span class="text-muted">(${ratingInfo.count} ratings)</span>
          ` : '<span class="text-muted">No ratings yet</span>'}
        </div>
        <div class="price mb-3">
          <span class="current-price" style="font-size: 1.8rem; color: #e74c3c;">
            ₹${product.price.toFixed(2)}
          </span>
          ${discount > 0 ? `
            <span class="original-price text-muted ms-2" style="text-decoration: line-through;">
              ₹${originalPrice}
            </span>
            <span class="discount badge bg-success ms-2">${discount}% off</span>
          ` : ''}
        </div>
        <div class="mb-3">
          <label class="form-label"><strong>Size:</strong></label><br>
          <div class="d-flex flex-wrap gap-2">
            ${sizeButtons}
          </div>
        </div>
        <div class="actions mb-4 d-flex gap-2">
          <button class="btn btn-primary flex-grow-1" 
                  onclick="addToCartWithSelection(${product.id})">
            <i class="bi bi-cart-plus me-1"></i> Add to Bag
          </button>
          <button class="btn btn-success flex-grow-1" 
                  onclick="buyProductWithSelection(${product.id})">
            <i class="bi bi-lightning-charge me-1"></i> Buy Now
          </button>
        </div>
        <div class="description mb-4">
          <h4 class="mb-2">Description</h4>
          <p>${product.description} ${product.additionalDetails}</p>
        </div>
        <div class="specifications mb-4">
          <h4 class="mb-2">Specifications</h4>
          <table class="table table-bordered">
            ${specTable}
          </table>
        </div>
        <div class="delivery-return">
          <h4 class="mb-2">Delivery & Return</h4>
          <p><i class="bi bi-truck me-2"></i> Delivery: ${product.deliveryTime}</p>
          <p><i class="bi bi-arrow-counterclockwise me-2"></i> Return: ${product.returnPolicy}</p>
        </div>
      </div>
    </div>
    <div class="row mt-5">
      ${recommendationsHTML}
    </div>
  </div>
`;

document.getElementById("productDetailPage").innerHTML = detailContent;
document.getElementById("productDetailSection").dataset.productId = productId;
document.getElementById("productDetailSection").dataset.selectedColor = defaultColor;
document.getElementById("productDetailSection").dataset.selectedSize = sizes[0];
showSection("productDetailSection");

// Push state to history for navigation
history.pushState({ section: 'productDetailSection', productId: productId }, '', `#productDetailSection-${productId}`);
}
// Select size
function selectSize(size) {
document.querySelectorAll(".size-btn").forEach(btn => btn.classList.remove("active"));
const button = document.querySelector(`.size-btn[data-size="${size}"]`);
if (button) button.classList.add("active");
document.getElementById("productDetailSection").dataset.selectedSize = size;
}

// Select color
function selectColor(color) {
const productId = parseInt(document.getElementById("productDetailSection").dataset.productId);
const product = products.find(p => p.id === productId);
if (!product) return;

document.querySelectorAll(".color-thumb").forEach(el => el.classList.remove("selected"));
const thumbnail = document.querySelector(`.color-thumb[data-color="${CSS.escape(color)}"]`);
if (thumbnail) thumbnail.classList.add("selected");

const imageUrl = product.colorImages?.[color] || (product.images && product.images.length ? product.images[0] : 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.name));
const mainImg = document.getElementById("mainProductImage");
if (mainImg) mainImg.src = imageUrl;
const selectedText = document.getElementById("selectedColorText");
if (selectedText) selectedText.textContent = color;
document.getElementById("productDetailSection").dataset.selectedColor = color;
}
// Add to cart with selection
function addToCartWithSelection(productId) {
const selectedSize = document.getElementById("sizeSelect")?.value || document.getElementById("productDetailSection").dataset.selectedSize;
const selectedColor = document.getElementById("productDetailSection").dataset.selectedColor;
if (!selectedSize || !selectedColor) {
  showNotification("Please select size and color.", "warning");
  return;
}
const product = products.find(p => p.id === productId);
if (product) {
  const cartItem = { ...product, selectedSize, selectedColor };
  cart.push(cartItem);
  showNotification(`${product.name} added to your bag with size ${selectedSize} and color ${selectedColor}.`, "info");
  updateCartCountBadge();
  saveData();
}
}
// Buy product with selection
function buyProductWithSelection(productId) {
if (!currentUser) {
  // Professional prompt when user isn't logged in
  showNotification("Create your NXew account to place orders faster.", "warning");
  // No popup/modal: redirect to signup page
  showSection("signupSection");
  return;
}
const selectedSize = document.getElementById("sizeSelect")?.value || document.getElementById("productDetailSection").dataset.selectedSize;
const selectedColor = document.getElementById("productDetailSection").dataset.selectedColor;
if (!selectedSize || !selectedColor) {
  showNotification("Please select size and color.", "warning");
  return;
}
const product = products.find(p => p.id === productId);
if (product) {
  currentProductForPurchase = { ...product, selectedSize, selectedColor };
  const daysRange = product.deliveryTime.match(/\d+-\d+/)[0];
  const maxDays = parseInt(daysRange.split("-")[1]);
  const today = new Date();
  const estimatedDeliveryDate = new Date(today);
  estimatedDeliveryDate.setDate(today.getDate() + maxDays);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = estimatedDeliveryDate.toLocaleDateString('en-US', options);
  document.getElementById("modalProductName").textContent = product.name;
  document.getElementById("modalProductSize").textContent = selectedSize;
  document.getElementById("modalProductColor").textContent = selectedColor;
  document.getElementById("modalProductPrice").textContent = product.price.toFixed(2);
  document.getElementById("modalDeliveryTime").textContent = formattedDate;
  document.getElementById("modalTotalAmount").textContent = (product.price + 5).toFixed(2); // Assuming +5 for shipping
  
  // Fill hidden fields for EmailJS
  document.getElementById("emailProduct").value = product.name;
  document.getElementById("emailPrice").value = product.price.toFixed(2);
  document.getElementById("emailSize").value = selectedSize;
  document.getElementById("emailColor").value = selectedColor;

  // Clear user fields
  const form = document.getElementById("buyForm");
  if (form) {
    form.reset();
  }

  // Show modal
  const buyModal = new bootstrap.Modal(document.getElementById("buyModal"));
  buyModal.show();
}
}
// EmailJS integration for Buy Now modal order form
document.addEventListener('DOMContentLoaded', function() {
// Initialize EmailJS
if (typeof emailjs !== 'undefined') {
  emailjs.init("uNU6LHQHe2zyexNEo"); // Your EmailJS public key
}

const buyFormModal = document.getElementById("buyForm");
if (buyFormModal) {
  buyFormModal.addEventListener("submit", function (e) {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    // Get form values
    const address = document.getElementById("shippingAddress").value;
    const mobile = document.getElementById("mobileNumber").value;
    const details = document.getElementById("additionalDetails").value;
    const product = currentProductForPurchase;
// Send form via EmailJS with proper parameters for BUY NOW
    emailjs.send("service_t95u5og", "template_ciqxjv9", {
      address: address,
      phone: mobile,
      details: details,
      product: product.name,
      price: product.price.toFixed(2),
      size: product.selectedSize,
      color: product.selectedColor,
      buyer_name: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Guest",
      buyer_email: currentUser ? currentUser.email : "No email provided",
      message_type: "new_order"
    })
      .then(function () {
        showNotification("✅ Order placed successfully!", "success");
        buyFormModal.reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById("buyModal"));
        if (modal) modal.hide();
      }, function (error) {
        showNotification("❌ Failed to send order. Please try again.", "danger");
        console.error("EmailJS Error:", error);
      })
      .finally(function() {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      });
  });
}
});
// Buy form submission with enhanced thank-you card
document.getElementById("buyForm").addEventListener("submit", function(e) {
e.preventDefault();

if (!currentUser) {
  showNotification("Create your NXew account to place orders faster.", "warning");
  // No popup/modal: redirect to signup page
  showSection("signupSection");
  return;
}

// Retrieve form values
const address = document.getElementById("shippingAddress").value;
const mobile = document.getElementById("mobileNumber").value;
const details = document.getElementById("additionalDetails").value;
const couponCode = document.getElementById("couponCode").value.trim();
const product = currentProductForPurchase;

// Calculate discount if a valid coupon is applied
let discount = 0;
if (couponCode && validCoupons.includes(couponCode)) {
  discount = 0.20; // 20% discount
  validCoupons = validCoupons.filter(code => code !== couponCode);
  saveData();
}
const finalPrice = product.price * (1 - discount);

// Calculate estimated delivery date
const daysRange = product.deliveryTime.match(/\d+-\d+/)[0];
const maxDays = parseInt(daysRange.split("-")[1]);
const orderDate = new Date();
const estimatedDeliveryDate = new Date(orderDate);
estimatedDeliveryDate.setDate(orderDate.getDate() + maxDays);
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const formattedDate = estimatedDeliveryDate.toLocaleDateString('en-INDIA', options);

// Create order object with estimatedDelivery
const order = {
product: currentProductForPurchase,
address,
mobile,
details,
payment: "Cash on Delivery",
date: orderDate.toLocaleString(),
cancelled: false,
cancellationReason: "",
trackingStatus: "Order Confirmed",
buyer: currentUser,
qrData: `Order #${orders.length + 1}\nProduct: ${currentProductForPurchase.name}\nSize: ${currentProductForPurchase.selectedSize}\nColor: ${currentProductForPurchase.selectedColor}\nAddress: ${address}\nMobile: ${mobile}\nBuyer: ${currentUser.firstName} ${currentUser.lastName}\nDate: ${orderDate.toLocaleString()}\nTotal Amount: ₹${finalPrice.toFixed(2)}` ,
received: false,
receivedDate: null,
shipped: false,
shippedDate: null,
departed: false,
departedDate: null,
rating: null,
review: null,
totalAmount: finalPrice.toFixed(2),
couponUsed: couponCode || null,
estimatedDelivery: formattedDate 
};

orders.push(order);
const orderIndex = orders.length - 1;

// Generate a new coupon code
const newCouponCode = generateCouponCode();
validCoupons.push(newCouponCode);
saveData();

// Display thank-you message
showPopupMessage(`
  <h5>Thank You for Your Order!</h5>
  <img src="${currentProductForPurchase.images[0]}" alt="${currentProductForPurchase.name}" style="max-width: 100px; margin-bottom: 10px;">
  <p><strong>Product:</strong> ${currentProductForPurchase.name}</p>
  <p><strong>Size:</strong> ${currentProductForPurchase.selectedSize}</p>
  <p><strong>Color:</strong> ${currentProductForPurchase.selectedColor}</p>
  <p><strong>Estimated Delivery:</strong> ${formattedDate}</p>
  <p><strong>Shipping Address:</strong> ${address}</p>
  <p><strong>Total Amount:</strong> ₹${finalPrice.toFixed(2)}</p>
  <p>Your order has been placed successfully. We will deliver it to you soon.</p>
  <h6>Coupon for Your Next Order</h6>
  <p><strong>Code:</strong> ${newCouponCode}</p>
  <p>Use this code on your next purchase to get 20% off!</p>
  <button class="btn btn-primary mt-3" data-bs-dismiss="modal" onclick="showOrderDetailPage(${orderIndex})">View Order Details</button>
`);

notifyOwner(`New order placed by: ${currentUser.firstName} ${currentUser.lastName} (${currentUser.email}) for product: ${order.product.name} (Size: ${order.product.selectedSize}, Color: ${order.product.selectedColor}) at ₹${finalPrice.toFixed(2)} - Order #${orderIndex + 1}`);

saveData();
const buyModal = bootstrap.Modal.getInstance(document.getElementById("buyModal"));
buyModal.hide();
});

// Update cart count badge
function updateCartCountBadge() {
document.getElementById("footerBagBadge").textContent = cart.length;
}

// Update cart section
function updateCartSection() {
const cartContent = document.getElementById("cartContent");
if (cart.length === 0) {
  cartContent.innerHTML = `
    <div class="card nxew-cart-empty border-0 shadow-sm">
      <div class="card-body text-center">
        <div class="nxew-cart-empty-icon">
          <i class="bi bi-bag-x"></i>
        </div>
        <h4 class="mt-3 mb-1">Your NXew Bag is Empty</h4>
        <p class="text-muted mb-3">Explore colorful picks and add something new to your cart.</p>
        <button class="btn btn-primary" onclick="showSection('shopSection')">
          Continue Shopping
        </button>
      </div>
    </div>
  `;
  return;
}
let html = "";
cart.forEach((item, index) => {
  html += `
    <div class="card mb-3 shadow-sm product-card" onclick="showProductDetails(${item.id})" style="cursor: pointer;">
      <div class="row g-0">
        <div class="col-4">
          <img src="${item.images && item.images.length ? item.images[0] : 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(item.name)}" class="img-fluid rounded-start" alt="${item.name}">
        </div>
        <div class="col-8">
          <div class="card-body">
            <h5 class="card-title">${item.name}</h5>
            <p class="card-text">Size: ${item.selectedSize}, Color: ${item.selectedColor}</p>
            <p class="card-text"><small class="text-muted">${item.category} |  ₹${(item.price * 1.2).toFixed(2)}₹${item.price.toFixed(2)}</small></p>
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); removeFromCart(${index})"><i class="bi bi-trash me-1"></i> Remove</button>
          </div>
        </div>
      </div>
    </div>
  `;
});
cartContent.innerHTML = html;
}

// Remove from cart
function removeFromCart(index) {
if (confirm("Are you sure you want to remove this item from your bag?")) {
  cart.splice(index, 1);
  updateCartSection();
  updateCartCountBadge();
  showNotification("Item removed from bag.", "info");
  saveData();
}
}

// Update account section
function updateAccountSection() {
const accountContent = document.getElementById("accountContent");
if (currentUser) {
  const bagCount = Array.isArray(cart) ? cart.length : 0;
  const myOrdersCount = Array.isArray(orders)
    ? orders.filter(o => o?.buyer?.email === currentUser.email).length
    : 0;

  accountContent.innerHTML = `
    <div class="card nxew-cart-empty border-0 shadow-sm">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <div class="website-branding mb-2">
              <i class="bi bi-star-fill"></i>
              <span>NXew</span>
            </div>
            <h3 class="mb-1">Welcome, ${currentUser.firstName} ${currentUser.lastName}</h3>
            <p class="mb-2 text-muted">
              <i class="bi bi-envelope me-2"></i>${currentUser.email}
            </p>
            <p class="mb-3 text-muted">
              <i class="bi bi-telephone me-2"></i>${currentUser.mobile || "Not provided"}
            </p>
          </div>
          <div class="text-end">
            <div class="mb-2"><strong>${bagCount}</strong> item(s) in your bag</div>
            <div><strong>${myOrdersCount}</strong> order(s) placed</div>
          </div>
        </div>

        <div class="row g-2 mt-3">
          <div class="col-12 col-md-4">
            <button class="btn btn-primary w-100" onclick="showSection('shopSection')">
              Continue Shopping
            </button>
          </div>
          <div class="col-12 col-md-4">
            <button class="btn btn-outline-secondary w-100" onclick="showSection('ordersSection')">
              View Orders
            </button>
          </div>
          <div class="col-12 col-md-4">
            <button class="btn btn-danger w-100" onclick="logout()">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
} else {
  accountContent.innerHTML = `
    <div class="card nxew-cart-empty border-0 shadow-sm">
      <div class="card-body text-center">
        <div class="nxew-cart-empty-icon">
          <i class="bi bi-person-plus"></i>
        </div>
        <h4 class="mt-3 mb-1">Create your NXew account</h4>
        <p class="text-muted mb-3">Faster checkout, order tracking, and a better lifestyle shopping experience.</p>
        <button class="btn btn-primary" onclick="showSection('signupSection')">
          Create Account
        </button>
      </div>
    </div>
  `;
}
}

// Calculate estimated delivery dates
function calculateDeliveryDate(orderDate, deliveryTime) {
const [minDays, maxDays] = deliveryTime.split('-').map(s => parseInt(s.trim().replace(' days', '')));
const orderDateObj = new Date(orderDate);
const minDeliveryDate = new Date(orderDateObj);
minDeliveryDate.setDate(orderDateObj.getDate() + minDays);
const maxDeliveryDate = new Date(orderDateObj);
maxDeliveryDate.setDate(orderDateObj.getDate() + maxDays);
return {
  min: minDeliveryDate.toLocaleDateString(),
  max: maxDeliveryDate.toLocaleDateString()
};
}
// Update orders list
function updateOrdersList(filter = currentOrdersFilter) {
const ordersList = document.getElementById('ordersList');
if (!currentUser) {
  ordersList.innerHTML = `
    <div class="text-center py-5">
      <i class="bi bi-box-seam" style="font-size: 3rem; color: #ddd;"></i>
      <h5 class="mt-3">No orders found</h5>
      <p>Please log in to view your orders</p>
      <button class="btn btn-primary mt-2" onclick="showSection('loginSection')">Log In</button>
    </div>
  `;
  return;
}

const userOrders = orders.filter(order => order.buyer.email === currentUser.email);
let filteredOrders = [];

switch (filter) {
  case 'active':
    filteredOrders = userOrders.filter(order => !order.cancelled && !order.received && !order.returned);
    break;
  case 'completed':
    filteredOrders = userOrders.filter(order => order.received && !order.returned);
    break;
  case 'cancelled':
    filteredOrders = userOrders.filter(order => order.cancelled);
    break;
  case 'returned':
    filteredOrders = userOrders.filter(order => order.returned);
    break;
  default:
    filteredOrders = userOrders;
}

if (filteredOrders.length === 0) {
  let message = filter === 'active' ? 'You have no active orders' :
                filter === 'completed' ? 'You have no completed orders' :
                filter === 'cancelled' ? 'You have no cancelled orders' :
                filter === 'returned' ? 'You have no returned orders' :
                'You have not placed any orders yet';
  ordersList.innerHTML = `
    <div class="text-center py-5">
      <i class="bi bi-box-seam" style="font-size: 3rem; color: #ddd;"></i>
      <h5 class="mt-3">${message}</h5>
      <button class="btn btn-primary mt-2" onclick="showSection('shopSection')">Start Shopping</button>
    </div>
  `;
  return;
}

let html = '';
filteredOrders.forEach((order, index) => {
  const originalIndex = orders.findIndex(o => o === order);
  const productImage = order.product.images && order.product.images.length > 0 ?
    order.product.images[0] : 'https://via.placeholder.com/100x100?text=No+Image';
  const discount = order.product.discount || 0;
  const originalPrice = discount > 0 ? (order.product.price / (1 - discount / 100)).toFixed(2) : order.product.price.toFixed(2);

  let statusBadgeClass, statusText;
  if (order.cancelled) {
    statusBadgeClass = 'order-status-cancelled';
    statusText = 'Cancelled';
  } else if (order.returned) {
    statusBadgeClass = 'order-status-returned';
    statusText = 'Returned';
  } else if (order.received) {
    statusBadgeClass = 'order-status-delivered';
    statusText = 'Delivered';
  } else if (order.shipped) {
    statusBadgeClass = 'order-status-shipped';
    statusText = 'Shipped';
  } else {
    statusBadgeClass = 'order-status-confirmed';
    statusText = 'Confirmed';
  }

  html += `
    <div class="card order-card mb-3 ${order.cancelled ? 'cancelled-order' : order.returned ? 'returned-order' : ''}"
         onclick="showOrderDetailPage(${originalIndex})">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <span class="fw-bold">Order #${originalIndex + 1}</span>
          <span class="text-muted ms-2">${order.date}</span>
        </div>
        <span class="order-status-badge ${statusBadgeClass}">${statusText}</span>
      </div>
      <div class="card-body">
        ${!order.cancelled && !order.received && !order.returned ? `
          <p class="small text-muted mb-2">Estimated Delivery: By ${order.estimatedDelivery}</p>
        ` : ''}
        <div class="row align-items-center">
          <div class="col-4 col-md-2">
            <img src="${productImage}"
                 class="order-card-image"
                 alt="${order.product.name}"
                 onclick="event.stopPropagation(); showProductImagesModal(${order.product.id})">
          </div>
          <div class="col-8 col-md-10">
            <h6>${order.product.name}</h6>
            <p class="mb-1">Size: ${order.product.selectedSize}, Color: ${order.product.selectedColor}</p>
            <p class="mb-1">Qty: 1</p>
            <p class="fw-bold">₹${order.product.price.toFixed(2)}</p>
            ${discount > 0 ? `<p class="text-muted"> ₹${originalPrice}  (${discount}% off)</p>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
});
ordersList.innerHTML = html;
}
// Filter orders
function filterOrders(filter) {
currentOrdersFilter = filter;
updateOrdersList(filter);
}

// **Generate Track Bar Function**
function generateTrackBar(order) {
let steps = [];
if (order.cancelled) {
  steps = [
    { title: 'Order Placed', active: true },
    { title: 'Cancelled', active: true }
  ];
} else if (order.returned) {
  steps = [
    { title: 'Order Placed', active: true },
    { title: 'Shipped', active: true },
    { title: 'Delivered', active: true },
    { title: 'Returned', active: true }
  ];
} else {
  steps = [
    { title: 'Order Placed', active: true },
    { title: 'Shipped', active: order.shipped || order.received },
    { title: 'Delivered', active: order.received }
  ];
}

let html = '<div class="track-bar">';
steps.forEach((step, index) => {
  html += `
    <div class="track-step ${step.active ? 'active' : ''}">
      <span class="step-icon">${index + 1}</span>
      <p>${step.title}</p>
    </div>
  `;
  if (index < steps.length - 1) {
    const lineActive = step.active && steps[index + 1].active;
    html += `<div class="track-line ${lineActive ? 'active' : ''}"></div>`;
  }
});
html += '</div>';
return html;
}
function showOrderDetailPage(orderIndex) {
currentOrderIndex = orderIndex;
const order = orders[orderIndex];
const productImage = order.product.images && order.product.images.length > 0 ?
  order.product.images[0] :
  'https://via.placeholder.com/400x300?text=' + encodeURIComponent(order.product.name);

// Parse dates for comparison
const estimatedDeliveryDate = new Date(order.estimatedDelivery);
const currentDate = new Date();
const isPastEstimatedDelivery = currentDate > estimatedDeliveryDate;
const product = order.product;

// Cancel button logic: disable if past estimated delivery
let cancelDisabled = '';
if (isPastEstimatedDelivery) {
  cancelDisabled = 'disabled';
}

// Return button logic: disable if no return allowed or past return deadline
let returnDisabled = '';
if (order.received) {
  const allowsReturn = /\d+ days return policy/.test(product.returnPolicy);
  if (!allowsReturn) {
    returnDisabled = 'disabled';
  } else {
    const returnDays = parseInt(product.returnPolicy.match(/\d+/)[0]);
    const receivedDate = new Date(order.receivedDate);
    const returnDeadline = new Date(receivedDate);
    returnDeadline.setDate(receivedDate.getDate() + returnDays);
    if (currentDate > returnDeadline) {
      returnDisabled = 'disabled';
    }
  }
}

// Delete button for cancelled or returned orders
let deleteButton = '';
if (order.cancelled || order.returned) {
  deleteButton = `
    <button class="btn btn-danger mt-3" onclick="deleteOrder(${orderIndex})">
      <i class="bi bi-trash me-1"></i> Delete Order
    </button>
  `;
}

// Status badge logic
let statusBadgeClass, statusText;
if (order.cancelled) {
  statusBadgeClass = 'order-status-cancelled';
  statusText = 'Cancelled';
} else if (order.returned) {
  statusBadgeClass = 'order-status-returned';
  statusText = 'Returned';
} else if (order.received) {
  statusBadgeClass = 'order-status-delivered';
  statusText = 'Delivered';
} else if (order.shipped) {
  statusBadgeClass = 'order-status-shipped';
  statusText = 'Shipped';
} else {
  statusBadgeClass = 'order-status-confirmed';
  statusText = 'Confirmed';
}

// Timeline items
let timelineItems = [];
if (order.cancelled) {
  timelineItems = [
    { date: order.date, title: 'Order Placed', description: 'Your order was placed', active: true },
    { date: order.cancellationDate || order.date, title: 'Order Cancelled', description: 'Your order was cancelled', active: true }
  ];
} else if (order.returned) {
  timelineItems = [
    { date: order.date, title: 'Order Placed', description: 'Your order was placed', active: true },
    ...(order.shipped ? [{ date: order.shippedDate || order.date, title: 'Shipped', description: 'Your order was shipped', active: true }] : []),
    ...(order.received ? [{ date: order.receivedDate || order.date, title: 'Delivered', description: 'Your order was delivered', active: true }] : []),
    { date: order.returnDate || order.date, title: 'Returned', description: 'Your order was returned', active: true }
  ];
} else {
  timelineItems = [
    { date: order.date, title: 'Order Placed', description: 'Your order has been confirmed', active: true }
  ];
  if (order.shipped) {
    timelineItems.push({
      date: order.shippedDate || order.date,
      title: 'Shipped',
      description: 'Your order has been shipped',
      active: true
    });
  }
  if (order.received) {
    timelineItems.push({
      date: order.receivedDate || order.date,
      title: 'Delivered',
      description: 'Your order has been delivered',
      active: true
    });
  } else {
    timelineItems.push({
      date: '',
      title: 'Estimated Delivery',
      description: `By ${order.estimatedDelivery}`,
      active: false
    });
  }
}

let timelineHtml = '';
timelineItems.forEach((item) => {
  timelineHtml += `
    <div class="timeline-item ${item.active ? 'active' : ''}">
      <h6>${item.title}</h6>
      <p class="mb-1">${item.description}</p>
      ${item.date ? `<p class="timeline-date text-muted">${item.date}</p>` : ''}
    </div>
  `;
});

// Action buttons with dynamic disabling
let actionButtons = '';
if (!order.cancelled && !order.received && !order.returned) {
  actionButtons += `
    <div class="d-flex gap-2">
      <button class="btn btn-success flex-grow-1" onclick="markAsReceived(${orderIndex})">
        <i class="bi bi-check-circle me-1"></i> Mark as Received
      </button>
      <button class="btn btn-outline-danger flex-grow-1"
              data-bs-toggle="modal"
              data-bs-target="#cancelOrderModal"
              ${cancelDisabled}>
        <i class="bi bi-x-circle me-1"></i> Cancel Order
      </button>
    </div>
  `;
}
if (order.received && !order.returned) {
  actionButtons += `
    <button class="btn btn-warning mt-2" data-bs-toggle="modal" data-bs-target="#returnOrderModal" ${returnDisabled}>
      <i class="bi bi-arrow-return-left me-1"></i> Return Order
    </button>
  `;
  if (!order.rating) {
    actionButtons += `
      <button class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#reviewOrderModal">
        <i class="bi bi-star me-1"></i> Rate & Review
      </button>
    `;
  } else {
    actionButtons += `
      <button class="btn btn-outline-primary mt-2" data-bs-toggle="modal" data-bs-target="#viewReviewModal">
        <i class="bi bi-star-fill me-1"></i> View Your Review
      </button>
    `;
  }
}

const trackBarHtml = generateTrackBar(order);

// Full detail content
const detailContent = `
  <div class="row">
    <div class="col-md-8">
      <div class="order-detail-section">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4>Order #${orderIndex + 1}</h4>
          <span class="order-status-badge ${statusBadgeClass}">${statusText}</span>
        </div>
        ${order.received ? `
          <p class="text-muted"><strong>Delivered on:</strong> ${order.receivedDate}</p>
        ` : `
          <p class="text-muted"><strong>Estimated Delivery:</strong> By ${order.estimatedDelivery}</p>
        `}
        ${trackBarHtml}
        <div class="order-timeline">
          ${timelineHtml}
        </div>
        ${order.cancelled && order.cancellationReason ? `
          <div class="alert alert-danger mt-3">
            <h6>Cancellation Reason</h6>
            <p>${order.cancellationReason}</p>
          </div>
        ` : ''}
        ${order.returned ? `
          <div class="alert alert-warning mt-3">
            <h6>Return Details</h6>
            <p><strong>Reason:</strong> ${order.returnReason}</p>
            ${order.returnComments ? `<p><strong>Comments:</strong> ${order.returnComments}</p>` : ''}
            <p><strong>Returned on:</strong> ${order.returnDate}</p>
          </div>
        ` : ''}
      </div>
      <div class="order-actions mt-4">
        ${actionButtons}
        ${deleteButton}
      </div>
    </div>
    <div class="col-md-4">
      <div class="order-detail-section">
        <h5 class="mb-3">Order Summary</h5>
        <div class="d-flex mb-3">
          <img src="${productImage}" class="rounded me-3" style="width: 150px; height: 150px; object-fit: cover; cursor: pointer;"
               alt="${order.product.name}" onclick="showProductImagesModal(${order.product.id})">
          <div>
            <h6>${order.product.name}</h6>
            <p class="mb-1 small">Size: ${order.product.selectedSize}, Color: ${order.product.selectedColor}</p>
            <p class="mb-1 small">Qty: 1</p>
            <p class="fw-bold">₹${order.product.price.toFixed(2)}</p>
          </div>
        </div>
        <hr>
        <div class="mb-2 d-flex justify-content-between">
          <span>Subtotal:</span>
          <span>₹${order.product.price.toFixed(2)}</span>
        </div>
        <div class="mb-2 d-flex justify-content-between">
          <span>Shipping:</span>
          <span>FREE</span>
        </div>
        <div class="mb-3 d-flex justify-content-between">
          <span>Tax:</span>
          <span>₹0.00</span>
        </div>
        <hr>
        <div class="d-flex justify-content-between fw-bold">
          <span>Total:</span>
          <span>₹${order.product.price.toFixed(2)}</span>
        </div>
        <hr>
        <h6 class="mb-2">Payment Method</h6>
        <p class="mb-3">${order.payment}</p>
        <h6 class="mb-2">Shipping Address</h6>
        <p class="mb-1">${order.address}</p>
        <p class="mb-3">Phone: ${order.mobile}</p>
        <button class="btn btn-outline-primary w-100" onclick="showProductDetails(${order.product.id})">
          <i class="bi bi-cart me-1"></i> Buy Again
        </button>
      </div>
    </div>
  </div>
`;

document.getElementById("orderDetailPage").innerHTML = detailContent;
showSection("orderDetailSection");
}
// Delete order
function deleteOrder(orderIndex) {
if (confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
  orders.splice(orderIndex, 1);
  saveData();
  showNotification("Order deleted successfully.", "success");
  showSection("ordersSection");
  updateOrdersList();
}
}

function markAsReceived(orderIndex) {
orders[orderIndex].received = true;
orders[orderIndex].receivedDate = new Date().toLocaleString();
showNotification('Order marked as received', 'success');
saveData();
showOrderDetailPage(orderIndex);
updateOrdersList(currentOrdersFilter);
}

function confirmCancelOrder() {
const reasonSelect = document.getElementById('cancelReason');
const otherReason = document.getElementById('otherReason');
const address = document.getElementById('cancelAddress').value;
const mobile = document.getElementById('cancelMobile').value;
const details = document.getElementById('cancelDetails').value;

let reason = reasonSelect.value;

if (reason === '') {
  showNotification('Please select a cancellation reason', 'warning');
  return;
}

if (reason === 'Other') {
  reason = otherReason.value.trim();
  if (reason === '') {
    showNotification('Please specify the cancellation reason', 'warning');
    return;
  }
}

if (!address.trim()) {
  showNotification('Please enter your address', 'warning');
  return;
}

if (!mobile.trim()) {
  showNotification('Please enter your mobile number', 'warning');
  return;
}

// Show loading state
const submitBtn = document.querySelector('#cancelOrderModal .btn-danger');
const originalText = submitBtn.textContent;
submitBtn.textContent = "Sending...";
submitBtn.disabled = true;

const order = orders[currentOrderIndex];
const product = order.product;
// Send cancellation request via EmailJS with CANCEL template
emailjs.send("service_t95u5og", "template_yalbgw5", {
  address: address,
  phone: mobile,
  details: details,
  product: product.name,
  price: product.price.toFixed(2),
  size: product.selectedSize,
  color: product.selectedColor,
  buyer_name: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Guest",
  buyer_email: currentUser ? currentUser.email : "No email provided",
  cancellation_reason: reason,
  order_id: currentOrderIndex + 1,
  message_type: "cancellation_request"
})
  .then(function () {
    showNotification("✅ Cancellation request sent successfully!", "success");
    
    // Update order status
    orders[currentOrderIndex].cancelled = true;
    orders[currentOrderIndex].cancellationReason = reason;
    orders[currentOrderIndex].cancellationDate = new Date().toLocaleString();
    orders[currentOrderIndex].cancellationAddress = address;
    orders[currentOrderIndex].cancellationMobile = mobile;
    orders[currentOrderIndex].cancellationDetails = details;

    notifyOwner(`Order #${currentOrderIndex + 1} cancellation requested by: ${currentUser.firstName} ${currentUser.lastName} (${currentUser.email}) for product: ${product.name} with reason: ${reason}`);

    saveData();

    const modal = bootstrap.Modal.getInstance(document.getElementById('cancelOrderModal'));
    modal.hide();

    setTimeout(() => {
      showOrderDetailPage(currentOrderIndex);
      updateOrdersList(currentOrdersFilter);
    }, 500);
  }, function (error) {
    showNotification("❌ Failed to send cancellation request. Please try again.", "danger");
    console.error("EmailJS Error:", error);
  })
  .finally(function() {
    // Reset button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  });
}


// Handle cancel reason select change
document.getElementById('cancelReason')?.addEventListener('change', function() {
const otherReasonContainer = document.getElementById('otherReasonContainer');
if (this.value === 'Other') {
  otherReasonContainer.style.display = 'block';
} else {
  otherReasonContainer.style.display = 'none';
}
});

// Initialize rating when review modal is shown
document.getElementById('reviewOrderModal')?.addEventListener('show.bs.modal', function() {
const order = orders[currentOrderIndex];
const ratingStars = document.getElementById('ratingStars');

ratingStars.querySelectorAll('span').forEach(star => {
  star.textContent = '☆';
});

if (order.rating) {
  highlightStars(order.rating);
}

document.getElementById('ratingText').textContent = 'Tap to rate';

document.getElementById('reviewTitle').value = '';
document.getElementById('reviewText').value = '';
});

// Handle star rating selection
document.getElementById('ratingStars')?.addEventListener('click', function(e) {
if (e.target.tagName === 'SPAN') {
  const value = parseInt(e.target.getAttribute('data-value'));
  highlightStars(value);

  const ratingText = document.getElementById('ratingText');
  ratingText.textContent = `${value} star${value !== 1 ? 's' : ''}`;
  ratingText.style.color = '#000';

  document.getElementById('ratingStars').dataset.selectedRating = value;
}
});

// Function to highlight stars up to the selected value
function highlightStars(value) {
const stars = document.getElementById('ratingStars').querySelectorAll('span');
stars.forEach((star, index) => {
  const starValue = parseInt(star.getAttribute('data-value'));
  star.textContent = starValue <= value ? '★' : '☆';
  star.style.color = starValue <= value ? 'gold' : '#000';
});
}

// Submit review function
function submitReview() {
const ratingStars = document.getElementById('ratingStars');
const selectedRating = ratingStars.dataset.selectedRating;
const reviewTitle = document.getElementById('reviewTitle').value.trim();
const reviewText = document.getElementById('reviewText').value.trim();

if (!selectedRating) {
  showNotification('Please select a rating by tapping the stars', 'warning');
  return;
}

if (!reviewTitle) {
  showNotification('Please enter a title for your review', 'warning');
  return;
}

if (!reviewText) {
  showNotification('Please write your review', 'warning');
  return;
}

const order = orders[currentOrderIndex];
order.rating = parseInt(selectedRating);
order.reviewTitle = reviewTitle;
order.review = reviewText;
order.reviewDate = new Date().toLocaleString();

saveData();

const modal = bootstrap.Modal.getInstance(document.getElementById('reviewOrderModal'));
modal.hide();

showNotification('Thank you for your review!', 'success');

showOrderDetailPage(currentOrderIndex);
}

// Confirm return order function
function confirmReturnOrder() {
const returnReason = document.getElementById('returnReason').value;
const returnOtherReason = document.getElementById('returnOtherReason').value.trim();
const returnComments = document.getElementById('returnComments').value.trim();

let reason = returnReason;
if (returnReason === 'Other') {
  if (!returnOtherReason) {
    showNotification('Please specify the return reason', 'warning');
    return;
  }
  reason = returnOtherReason;
}

const order = orders[currentOrderIndex];
order.returned = true;
order.returnReason = reason;
order.returnComments = returnComments;
order.returnDate = new Date().toLocaleString();

notifyOwner(`Order #${currentOrderIndex + 1} returned by: ${currentUser.firstName} ${currentUser.lastName} (${currentUser.email}) with reason: ${reason}`);

saveData();

const modal = bootstrap.Modal.getInstance(document.getElementById('returnOrderModal'));
modal.hide();

showNotification('Your return request has been submitted', 'success');

showOrderDetailPage(currentOrderIndex);
}

// Update the view review modal when shown
document.getElementById('viewReviewModal')?.addEventListener('show.bs.modal', function() {
const order = orders[currentOrderIndex];
const modal = document.getElementById('viewReviewModal');

if (!order.rating) return;

modal.querySelector('.modal-title').textContent = `Your Review of ${order.product.name}`;

const starsContainer = modal.querySelector('.rating-stars');
starsContainer.innerHTML = '';
for (let i = 1; i <= 5; i++) {
  starsContainer.innerHTML += i <= order.rating ? '★' : '☆';
}

modal.querySelector('h5').textContent = order.reviewTitle || 'Your Review';
modal.querySelector('p').textContent = order.review || 'No review text provided.';
modal.querySelector('.small').textContent = `Reviewed on ${order.reviewDate || 'Unknown date'}`;
});

// Show section
function showSection(sectionId) {
document.querySelectorAll(".section").forEach(section => section.classList.remove("active-section", "fade-in"));
const targetSection = document.getElementById(sectionId);
targetSection.classList.add("active-section", "fade-in");
if (sectionId !== "productDetailSection") {
  delete document.getElementById("productDetailSection").dataset.selectedSize;
  delete document.getElementById("productDetailSection").dataset.selectedColor;
}
updateUserActivity();
if (sectionId === "shopSection") {
  applyFilters();
} else if (sectionId === "menswearSection") {
  applyMenswearFilters();
} else if (sectionId === "accessoriesSection") {
  applyAccessoriesFilters();
} else if (sectionId === "accountSection") {
  updateAccountSection();
} else if (sectionId === "cartSection") {
  updateCartSection();
} else if (sectionId === "notificationsSection") {
  updateNotifications();
} else if (sectionId === "ordersSection") {
  updateOrdersList();
} else if (sectionId === "sellerDashboard" || sectionId === "ownerDashboard") {
  if (currentUser && currentUser.email === "tedpole.in@gmail.com") {
    sectionId === "sellerDashboard" ? updateSellerDashboard() : updateOwnerDashboard();
  } else {
    showNotification("Access denied. Only the owner can view this dashboard.", "danger");
    showSection("homeSection");
  }
}
}

// Generate product image HTML
function generateProductImageHTML(product) {
const defaultColor = product.color.split(",")[0].trim();
const defaultImage = product.colorImages[defaultColor];
return `<img id="mainProductImage" src="${defaultImage}" class="product-detail-img" alt="${product.name}" style="cursor: pointer;" onclick="showProductImagesModal(${product.id})">`;
}

// Update menu account details
           function updateMenuAccountDetails() {
             const container = document.getElementById("menuAccountDetails");
             if (currentUser) {
               container.innerHTML = `<i class="bi bi-person-circle me-2"></i><h4 class="d-inline">${currentUser.firstName} ${currentUser.lastName}</h4><br><small>${currentUser.email}</small>`;
               if (currentUser.email === "tedpole.in@gmail.com") {
                 document.getElementById("sellerDashboardMenuItem").style.display = "block";
                 document.getElementById("ownerDashboardMenuItem").style.display = "block";
               }
             } else {
               container.innerHTML = `<h4>Welcome Guest</h4>`;
               document.getElementById("sellerDashboardMenuItem").style.display = "none";
               document.getElementById("ownerDashboardMenuItem").style.display = "none";
             }
           }
       
           // Logout
           function logout() {
             if (currentUser) {
               currentUser.isLoggedIn = false;
               currentUser.lastActivity = new Date().toISOString();
             }
             currentUser = null;
             showNotification("You have been logged out.", "info");
             saveData();
             updateMenuAccountDetails();
             showSection("homeSection");
           }
       // Feedback form submission
document.getElementById("feedbackForm")?.addEventListener("submit", function(e) {
e.preventDefault();
const feedbackMessage = document.getElementById("feedbackMessage").value.trim();
if (!feedbackMessage) {
  showNotification("Please enter your feedback.", "warning");
  return;
}
const feedback = {
  user: currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.email})` : "Guest",
  message: feedbackMessage,
  date: new Date().toLocaleString()
};
notifyOwner(`New feedback received from ${feedback.user}: ${feedback.message}`);
showNotification("Thank you for your feedback!", "success");
this.reset();
showSection("homeSection");
});
           // Enhanced search functionality (legacy duplicate)
       function showSearchSuggestionsAlt() {
         const input = document.getElementById("searchSectionInput").value.toLowerCase();
         const suggestionsContainer = document.getElementById("searchSuggestions");
         
         if (input.length < 2) {
           suggestionsContainer.style.display = "none";
           return;
         }
         
         const suggestions = products.filter(product => 
           product.name.toLowerCase().includes(input) || 
           product.description.toLowerCase().includes(input) ||
           product.category.toLowerCase().includes(input)
         ).slice(0, 50);
         
         if (suggestions.length === 0) {
           suggestionsContainer.style.display = "none";
           return;
         }
         
         let html = '';
         suggestions.forEach(product => {
           html += `
             <a href="#" class="list-group-item list-group-item-action" 
                onclick="event.preventDefault(); document.getElementById('searchSectionInput').value='${product.name}'; suggestionsContainer.style.display='none';">
               <div class="d-flex align-items-center">
                 <img src="${product.images[0]}" alt="${product.name}" style="width: 40px; height: 40px; object-fit: cover; margin-right: 10px;">
                 <div>
                   <h6 class="mb-0">${product.name}</h6>
                   <small class="text-muted">${product.category}</small>
                 </div>
               </div>
             </a>
           `;
         });
         
         suggestionsContainer.innerHTML = html;
         suggestionsContainer.style.display = "block";
       }
       
       function performSearchAlt() {
         const query = document.getElementById("searchSectionInput").value.toLowerCase();
         const category = document.getElementById("searchCategory").value;
         const priceRange = document.getElementById("searchPrice").value;
         const minRating = document.getElementById("searchRating").value;
         const sortBy = document.getElementById("searchSort").value;
         
         let filteredProducts = [...products];
         
         // Apply search query
         if (query) {
           filteredProducts = filteredProducts.filter(p => 
             p.name.toLowerCase().includes(query) || 
             p.description.toLowerCase().includes(query)
         )}
         
         // Apply category filter
         if (category) {
           filteredProducts = filteredProducts.filter(p => p.category === category);
         }
         
         // Apply price range filter
         if (priceRange) {
           const [min, max] = priceRange.split("-").map(Number);
           filteredProducts = filteredProducts.filter(p => {
             if (max) return p.price >= min && p.price <= max;
             return p.price >= min;
           });
         }
         
         // Apply rating filter
         if (minRating) {
           filteredProducts = filteredProducts.filter(p => {
             const ratingInfo = getProductRating(p.id);
             return ratingInfo && ratingInfo.average >= minRating;
           });
         }
         
         // Apply sorting
         switch(sortBy) {
           case "price-low":
             filteredProducts.sort((a, b) => a.price - b.price);
             break;
           case "price-high":
             filteredProducts.sort((a, b) => b.price - a.price);
             break;
           case "rating":
             filteredProducts.sort((a, b) => {
               const ratingA = getProductRating(a.id)?.average || 0;
               const ratingB = getProductRating(b.id)?.average || 0;
               return ratingB - ratingA;
             });
             break;
           case "newest":
             // Assuming newer products have higher IDs
             filteredProducts.sort((a, b) => b.id - a.id);
             break;
           default:
             // Relevance - products matching query come first
             if (query) {
               filteredProducts.sort((a, b) => {
                 const aMatches = a.name.toLowerCase().includes(query) ? 1 : 0;
                 const bMatches = b.name.toLowerCase().includes(query) ? 1 : 0;
                 return bMatches - aMatches;
               });
             }
         }
         
         displaySearchResultsAlt(filteredProducts);
         updateSearchActiveFilters(query, category, priceRange, minRating);
       }
       
       function displaySearchResultsAlt(results) {
         const container = document.getElementById("searchResultsContainer");
         const countElement = document.getElementById("searchResultsCount");
         
         countElement.textContent = `${results.length} ${results.length === 1 ? 'product' : 'products'} found`;
         
         if (results.length === 0) {
           container.innerHTML = `
             <div class="col-12 text-center py-5">
               <i class="bi bi-search" style="font-size: 3rem; color: #ccc;"></i>
               <h4 class="mt-3">No </h4>
               <p>Try adjusting your search or filters</p>
               <button class="btn btn-primary" onclick="clearSearchFilters()">Clear all filters</button>
             </div>
           `;
           return;
         }
         
         container.innerHTML = "";
         results.forEach(product => {
           const ratingInfo = getProductRating(product.id);
           const originalPrice = (product.price * 1.2).toFixed(2);
           const discount = ((originalPrice - product.price) / originalPrice * 100).toFixed(0);
           
           const card = `
             <div class="col-6 col-md-4 col-lg-3 mb-4">
               <div class="card h-100 product-card" onclick="showProductDetails(${product.id})">
                 <div style="position: relative;">
                   <img src="${product.images[0]}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
          ${discount > 0 ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2">${discount}% OFF</span>` : ''}
                   </button>
                 </div>
                 <div class="card-body">
                  <h5 class="card-title">${product.name}</h5>
                   <div class="d-flex justify-content-between align-items-center">
                     <div>
                       <span class="fw-bold">₹${product.price.toFixed(2)}</span>
                       ${discount > 0 ? `<small class="text-decoration-line-through text-muted ms-1">₹${originalPrice}</small>` : ''}
                     </div>
                     ${ratingInfo ? `
                       <div class="d-flex align-items-center">
                         <i class="bi bi-star-fill text-warning me-1"></i>
                         <small>${ratingInfo.average}</small>
                       </div>
                     ` : ''}
                   </div>
                 </div>
               </div>
             </div>
           `;
           container.innerHTML += card;
         });
       }
       
       function updateSearchActiveFilters(query, category, priceRange, minRating) {
         const container = document.getElementById("searchActiveFilters");
         let html = '';
         
         if (query) html += `<span class="badge bg-secondary me-2">Search: ${query}</span>`;
         if (category) html += `<span class="badge bg-primary me-2">Category: ${category}</span>`;
         if (priceRange) {
           const label = priceRange === "0-100" ? "Under ₹100" : 
                        priceRange === "100-200" ? "₹100-₹200" :
                        priceRange === "200-300" ? "₹200-₹300" : "₹300-₹500";
           html += `<span class="badge bg-info me-2">Price: ${label}</span>`;
         }
         if (minRating) html += `<span class="badge bg-warning me-2">Rating: ${minRating}+</span>`;
         
         container.innerHTML = html;
       }
       
       function clearSearchFilters() {
         document.getElementById("searchSectionInput").value = "";
         document.getElementById("searchCategory").value = "";
         document.getElementById("searchPrice").value = "";
         document.getElementById("searchRating").value = "";
         document.getElementById("searchSort").value = "relevance";
         document.getElementById("searchActiveFilters").innerHTML = "";
         displaySearchResults(products);
         document.getElementById("searchResultsCount").textContent = `${products.length} `;
       }
       
           // Login form submission
           document.getElementById("loginForm")?.addEventListener("submit", function(e) {
               e.preventDefault();
             
               // Retrieve input values
               const email = document.getElementById("loginEmail").value;
               const password = document.getElementById("loginPassword").value;

              // Admin login (fixed credentials)
              if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                currentAdmin = { email: ADMIN_EMAIL, isLoggedIn: true, lastActivity: new Date().toISOString() };
                try { localStorage.setItem("currentAdmin", JSON.stringify(currentAdmin)); } catch (err) {}
                showNotification("Admin login successful!", "success");
                showSection("adminDashboardSection");
                return;
              }

              // If admin is not logging in, clear any old admin session on this device
              currentAdmin = null;
              try { localStorage.removeItem("currentAdmin"); } catch (err) {}
             
               // Check if the user exists and the password matches
               const user = users.find(u => u.email === email && u.password === password);
             
               if (user) {
                 // Set current user and update properties
                 currentUser = user;
                 currentUser.isLoggedIn = true;
                 currentUser.lastActivity = new Date().toISOString();
             
                 // Show notification for successful login
                 showNotification("Login successful!", "success");
             
                 // Notify owner about the successful login with user's details
                 notifyOwner(`User logged in: ${currentUser.firstName} ${currentUser.lastName} (${currentUser.email})`);
             
                 // Persist data and update the UI accordingly
                 saveData();
                 updateMenuAccountDetails();
                 showSection("homeSection");
               } else {
                 // Show warning if credentials are invalid
                 showNotification("Invalid email or password. Please sign up if you don't have an account.", "warning");
               }
             });
             
       
        // Sign up form submission
   document.getElementById("signupForm")?.addEventListener("submit", function(e) {
       e.preventDefault();
     
       // Retrieve form values
       const firstName = document.getElementById("firstName").value;
       const lastName = document.getElementById("lastName").value;
       const mobile = document.getElementById("mobileNumberSignUp").value;
       const email = document.getElementById("signupEmail").value;
       const password = document.getElementById("signupPassword").value;
       const confirmPassword = document.getElementById("confirmPassword").value;
     
       // Validate password matching
       if (password !== confirmPassword) {
         showNotification("Passwords do not match!", "warning");
         return;
       }
     
       // Check if user already exists by email
       if (users.some(u => u.email === email)) {
         showNotification("User with this email already exists. Please log in.", "warning");
         return;
       }
     
       // Create new user object with additional attributes
       currentUser = { 
         firstName, 
         lastName, 
         email, 
         mobile, 
         password, 
         isLoggedIn: true, 
         lastActivity: new Date().toISOString(), 
         createdAt: new Date().toISOString(),
         location: locations[Math.floor(Math.random() * locations.length)],
         notifications: [] // Initialize notifications array
       };
     
       // Add user to users array
       users.push(currentUser);
     
       // Notify about the new user sign-up
       showNotification("Sign Up successful!", "success");
       notifyOwner(`New user signed up: ${currentUser.firstName} ${currentUser.lastName} (${currentUser.email})`);
     
       // Persist data and update the UI
       saveData();
       updateMenuAccountDetails();
       showSection("homeSection");
     });
           // Contact form submission
           document.getElementById("contactForm")?.addEventListener("submit", function(e) {
             e.preventDefault();
             showNotification("Message was sent", "success");
             this.reset();
           });
       
            // Apply filters for Shop section
         function applyFilters() {
           const size = document.getElementById("filterSize").value;
           const color = document.getElementById("filterColor").value;
           const price = document.getElementById("filterPrice").value;
           activeFilters = {};
           if (size) activeFilters.size = size;
           if (color) activeFilters.color = color;
           if (price) activeFilters.price = price;
           let filteredProducts = [...products];
           if (activeFilters.size) {
             filteredProducts = filteredProducts.filter(p => p.size.split(",").map(s => s.trim().toLowerCase()).includes(activeFilters.size.toLowerCase()));
           }
           if (activeFilters.color) {
             filteredProducts = filteredProducts.filter(p => p.color.split(",").map(c => c.trim().toLowerCase()).includes(activeFilters.color.toLowerCase()));
           }
           if (activeFilters.price) {
             const [min, max] = activeFilters.price.split("-").map(Number);
             filteredProducts = filteredProducts.filter(p => p.price >= min && p.price <= max);
           }
           generateProducts("shopProductContainer", filteredProducts);
           displayActiveFilters();
         }
       
         // Display active filters for Shop section
         function displayActiveFilters() {
           const activeFilterDisplay = document.getElementById("activeFilterDisplay");
           let html = "";
           if (Object.keys(activeFilters).length > 0) {
             html += '<div class="filter-tags">';
             if (activeFilters.size) html += `<span class="badge bg-primary me-2" style="cursor: pointer;" onclick="removeFilter('size')">Size: ${activeFilters.size} <i class="bi bi-x"></i></span>`;
             if (activeFilters.color) html += `<span class="badge bg-primary me-2" style="cursor: pointer;" onclick="removeFilter('color')">Color: ${activeFilters.color} <i class="bi bi-x"></i></span>`;
             if (activeFilters.price) html += `<span class="badge bg-primary me-2" style="cursor: pointer;" onclick="removeFilter('price')">Price: ${activeFilters.price} <i class="bi bi-x"></i></span>`;
             html += '</div>';
           }
           activeFilterDisplay.innerHTML = html;
         }
       
         // Remove filter for Shop section
         function removeFilter(filterType) {
           if (filterType === 'size') document.getElementById('filterSize').value = '';
           else if (filterType === 'color') document.getElementById('filterColor').value = '';
           else if (filterType === 'price') document.getElementById('filterPrice').value = '';
           applyFilters();
         }
       
         // Clear all filters for Shop section
         function clearAllFilters() {
           document.getElementById('filterSize').value = '';
           document.getElementById('filterColor').value = '';
           document.getElementById('filterPrice').value = '';
           activeFilters = {};
           generateProducts("shopProductContainer", products);
           displayActiveFilters();
         }
             // Notify owner
             function notifyOwner(message) {
               ownerNotifications.push({ message, date: new Date().toLocaleString() });
               saveData();
             }  
         // Initialize
         loadData();
       document.getElementById("sendMessageModal").addEventListener("hidden.bs.modal", function () {
         document.getElementById("messageText").value = "";
       });
             // Reset modal fields when shown
document.getElementById('buyModal').addEventListener('shown.bs.modal', function () {
document.getElementById('couponCode').value = '';
document.getElementById('couponMessage').textContent = '';
const product = currentProductForPurchase;
document.getElementById('modalTotalAmount').textContent = product.price.toFixed(2);
document.getElementById('finalPrice').value = product.price.toFixed(2);
});

// Handle coupon application
document.getElementById('applyCouponButton').addEventListener('click', function () {
const couponCode = document.getElementById('couponCode').value.trim();
const product = currentProductForPurchase;
let message = '';
let totalAmount = product.price;

if (couponCode && validCoupons.includes(couponCode)) {
  const discount = 0.20; // 20% discount
  totalAmount = product.price * (1 - discount);
  message = 'Coupon applied! 20% discount.';
} else if (couponCode) {
  message = 'Invalid coupon code.';
} else {
  message = '';
}

document.getElementById('couponMessage').textContent = message;
document.getElementById('modalTotalAmount').textContent = totalAmount.toFixed(2);
document.getElementById('finalPrice').value = totalAmount.toFixed(2);
});

   // Request Product form submission
        document.getElementById("requestProductForm")?.addEventListener("submit", function(e) {
         e.preventDefault();
     
         // Retrieve form values
         const category = document.getElementById("requestCategory").value;
         const clothType = document.getElementById("requestClothType").value;
         const size = document.getElementById("requestSize").value;
         const color = document.getElementById("requestColor").value;
         const message = document.getElementById("requestMessage").value;
     
         // Create a request object
         const request = {
           category,
           clothType,
           size,
           color,
           message,
           user: currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.email})` : "Guest",
           date: new Date().toLocaleString()
         };
     
         // Notify the owner
         notifyOwner(`New product request: Category - ${category}, Cloth Type - ${clothType}, Size - ${size}, Color - ${color}, Message - ${message || 'None'}, From - ${request.user}`);
     
         // Show notification to the user
         showNotification("Your product request has been sent to the owner.", "success");
     
         // Reset the form
         this.reset();
     
         // Return to home section
         showSection("homeSection");
       });
        // QR Code Generation and Download Functionality
function generateQRCode(content) {
document.getElementById("qrcode").innerHTML = "";

const qrcode = new QRCode(document.getElementById("qrcode"), {
  text: content,
  width: 200,
  height: 200,
  colorDark: "#000000",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H
});

document.getElementById("downloadQRCodeButton").onclick = function() {
  const canvas = document.querySelector("#qrcode canvas");
  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "TEDPOLE_QRCode.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
}

// Function to show QR code modal with specific content
function showQRCodeModal(content) {
generateQRCode(content);
const qrModal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
qrModal.show();
}

// Example usage for order QR code
function showOrderQRCode(orderId) {
const orderDetailsUrl = `https://tedpole.in/order/${orderId}`;
showQRCodeModal(orderDetailsUrl);
}

// Event listener for QR code display
document.addEventListener('DOMContentLoaded', function() {
document.querySelectorAll('.show-qr-code').forEach(button => {
  button.addEventListener('click', function() {
    const orderId = this.getAttribute('data-order-id');
    showOrderQRCode(orderId);
  });
});
});

// Reset message modal on hide
document.getElementById("sendMessageModal")?.addEventListener("hidden.bs.modal", function () {
document.getElementById("messageText").value = "";
});

// Initialize QR code with default content and load data
window.onload = function() {
generateQRCode("https://tedpole.in");
loadData();
};
function filterShopByCategory(category) {
// Hide the search bar container
document.getElementById("searchBarContainer").style.display = "none";

// Filter products by category
const filteredProducts = products.filter(p => p.category === category);

// Update the shop section with filtered products
document.getElementById('shopResultsCount').textContent = `${filteredProducts.length} ${category} products`;

// Call generateProducts with hideDiscounts flag set to true
generateProducts("shopProductContainer", filteredProducts, true);

// Show the shop section
showSection('shopSection');

// Scroll to the top of the shop section
document.getElementById('shopSection').scrollIntoView({ behavior: 'smooth' });
}
// Updated generateProducts function with compact layout
function generateProducts(containerId, productList, showDiscount = true) {
const container = document.getElementById(containerId);

if (!container) return;

// Update results count for non-featured containers
if (containerId !== "featuredProductsContainer") {
  const countElement = document.getElementById(`${containerId.replace("Container", "")}ResultsCount`);
  if (countElement) {
    countElement.textContent = `${productList.length} products`;
  }
}

if (productList.length === 0) {
  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <i class="bi bi-search" style="font-size: 3rem; color: #ccc;"></i>
      <h4 class="mt-3">No products found</h4>
      <p>Try adjusting your search</p>
    </div>
  `;
  return;
}

container.innerHTML = "";

productList.forEach(product => {
  const discount = product.discount || 0;
  const originalPrice = discount > 0 ? (product.price / (1 - discount / 100)).toFixed(2) : product.price.toFixed(2);
  const isSoldOut = product.additionalDetails.toLowerCase().includes("sold out");
  
  // Compact product card similar to second screenshot
  const card = `
    <div class="col-6 col-md-4 col-lg-3 mb-3">
      <div class="card border-0" onclick="showProductDetails(${product.id})" style="cursor: pointer;">
        <div style="position: relative; overflow: hidden; aspect-ratio: 3/4;">
          <img src="${product.images && product.images.length ? product.images[0] : 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.name)}" 
               class="card-img-top w-100 h-100 object-fit-cover" alt="${product.name}">
          ${showDiscount && discount > 0 ? `
            <span class="badge bg-danger position-absolute top-0 start-0 m-1" style="font-size: 0.7rem;">
              ${discount}% OFF
            </span>
          ` : ''}
          ${isSoldOut ? `
            <span class="badge bg-dark position-absolute top-0 end-0 m-1" style="font-size: 0.7rem;">
              Sold Out
            </span>
          ` : ''}
        </div>
        <div class="card-body p-2">
          <h6 class="card-title mb-1" style="font-size: 0.9rem; line-height: 1.2;">${product.name}</h6>
          <div class="d-flex justify-content-between align-items-center mt-1">
            <div>
              <span class="fw-bold" style="font-size: 0.95rem;">₹${product.price.toFixed(2)}</span>
              ${showDiscount && discount > 0 ? `
                <small class="text-decoration-line-through text-muted ms-1" style="font-size: 0.8rem;">
                  ₹${originalPrice}
                </small>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML += card;
});
}
// Share product function
function shareProduct(productId) {
const product = products.find(p => p.id === productId);
if (!product) return;

const shareUrl = `https://nxew.netlify.app/?product=${productId}`;
const shareText = `Check out this ${product.name} from NXew: ${product.description}`;

if (navigator.share) {
  navigator.share({
    title: product.name,
    text: shareText,
    url: shareUrl
  }).catch(err => {
    console.log('Error sharing:', err);
    fallbackShare(shareUrl, shareText);
  });
} else {
  fallbackShare(shareUrl, shareText);
}
}

// Fallback share function for browsers without Web Share API
function fallbackShare(url, text) {
const shareModalContent = `
  <div class="modal fade" id="shareModal" tabindex="-1" aria-labelledby="shareModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="shareModalLabel">Share Product</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="shareLink" class="form-label">Share this link:</label>
            <div class="input-group">
              <input type="text" class="form-control" id="shareLink" value="${url}" readonly>
              <button class="btn btn-outline-secondary" onclick="copyShareLink()">
                <i class="bi bi-clipboard"></i>
              </button>
            </div>
          </div>
          <div class="social-share-buttons d-flex justify-content-around mt-3">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" 
               target="_blank" class="btn btn-primary">
              <i class="bi bi-facebook"></i> Facebook
            </a>
            <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}" 
               target="_blank" class="btn btn-info text-white">
              <i class="bi bi-twitter"></i> Twitter
            </a>
            <a href="https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}" 
               target="_blank" class="btn btn-success">
              <i class="bi bi-whatsapp"></i> WhatsApp
            </a>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
`;

if (!document.getElementById('shareModal')) {
  document.body.insertAdjacentHTML('beforeend', shareModalContent);
}

const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
shareModal.show();
}

// Copy share link to clipboard
function copyShareLink() {
const shareLink = document.getElementById('shareLink');
shareLink.select();
shareLink.setSelectionRange(0, 99999);
document.execCommand('copy');
showNotification('Link copied to clipboard!', 'success');
}

// Handle URL parameters on page load for product redirection
window.addEventListener('load', function() {
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('product');
if (productId) {
  const id = parseInt(productId);
  if (!isNaN(id) && products.find(p => p.id === id)) {
    showProductDetails(id);
  } else {
    showNotification('Invalid product link.', 'warning');
    showSection('homeSection');
  }
}
});
// ====================== COMPLETE UPDATED CODE ======================

// Function to fetch products from the backend (kept as-is)
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Failed to fetch products');
    const products = await response.json();
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    showNotification('Failed to load products. Please try again later.', 'danger');
    return [];
  }
}

// ==================== UPDATED FILTER FUNCTION (THIS IS THE KEY CHANGE) ====================
function filterShopByCategory(category) {
const searchBarContainer = document.getElementById("searchBarContainer");

let filteredProducts = [...products];
let countText = `${products.length} products`;

if (category && category !== 'All') {
  // Specific category → hide search bar (original behavior)
  searchBarContainer.style.display = "none";
  filteredProducts = products.filter(p => p.category === category);
  countText = `${filteredProducts.length} ${category} products`;
} else {
  // "All" clicked → SHOW search bar + filters
  searchBarContainer.style.display = "flex";
  activeFilters = {};                    // reset any previous filters
  countText = `${products.length} products`;
}

// Update count
const countEl = document.getElementById('shopResultsCount');
if (countEl) countEl.textContent = countText;

// Generate products
generateProducts("shopProductContainer", filteredProducts, true);

// Show shop section (this also calls applyFilters() for full filter support)
showSection('shopSection');

// Scroll to top
document.getElementById('shopSection').scrollIntoView({ behavior: 'smooth' });
}

// ==================== REST OF YOUR CODE (cleaned & deduplicated) ====================

// Show section
function showSection(sectionId) {
const sections = document.querySelectorAll('.section');
sections.forEach(section => {
  section.classList.remove('fade-in');
  section.style.display = 'none';
});
const activeSection = document.getElementById(sectionId);
if (activeSection) {
  activeSection.style.display = 'block';
  setTimeout(() => activeSection.classList.add('fade-in'), 10);
}

updateUserActivity();

if (sectionId !== 'adminDashboardSection') {
  stopAdminRealtimeUpdates();
}

if (sectionId === 'adminDashboardSection') {
  if (currentAdmin && currentAdmin.email === ADMIN_EMAIL) {
    startAdminRealtimeUpdates();
  } else {
    showNotification("Access denied. Admin login required.", "danger");
    showSection("loginSection");
  }
} else if (sectionId === 'shopSection') {
  applyFilters();
} else if (sectionId === 'menswearSection') {
  applyMenswearFilters();
} else if (sectionId === 'accessoriesSection') {
  applyAccessoriesFilters();
} else if (sectionId === 'accountSection') {
  if (!currentUser) {
    // Guests -> professional account creation flow (no popup)
    showSection("signupSection");
    return;
  }
  updateAccountSection();
} else if (sectionId === 'searchSection') {
  // Always show all products when user opens the search page
  showAllProductsInSearch();
} else if (sectionId === 'cartSection') {
  updateCartSection();
} else if (sectionId === 'notificationsSection') {
  updateNotifications();
} else if (sectionId === 'ordersSection') {
  updateOrdersList();
} else if (sectionId === 'sellerDashboard' || sectionId === 'ownerDashboard') {
  if (currentUser && currentUser.email === 'tedpole.in@gmail.com') {
    sectionId === 'sellerDashboard' ? updateSellerDashboard() : updateOwnerDashboard();
  } else {
    showNotification('Access denied. Only the owner can view this dashboard.', 'danger');
    showSection('homeSection');
  }
}
}

// ==================== UPDATED FILTER FUNCTION (CUSTOM PLACEMENT SUPPORT) ====================
function filterShopByCategory(category) {
const searchBarContainer = document.getElementById("searchBarContainer");
let filteredProducts = [...products];
let countText = `${products.length} products`;

if (category === 'New Arrivals') {
  // Special case: Show only products marked as "New Arrival" in additionalDetails
  // Hide search bar for focused view
  searchBarContainer.style.display = "none";
  filteredProducts = products.filter(p => 
    p.additionalDetails && 
    p.additionalDetails.toLowerCase().includes('new arrival')
  ).sort((a, b) => {
    // ✅ CUSTOM SORT: Use newArrivalPosition (low to high) or fallback to ID descending
    const posA = a.newArrivalPosition || a.id;
    const posB = b.newArrivalPosition || b.id;
    return posA - posB;  // Ascending: Lower position first (or higher ID if no position)
  });
  countText = `${filteredProducts.length} New Arrivals`;
} else if (category && category !== 'All') {
  // Existing category behavior
  searchBarContainer.style.display = "none";
  filteredProducts = products.filter(p => p.category === category);
  countText = `${filteredProducts.length} ${category} products`;
} else {
  // "All" clicked → SHOW search bar + filters
  searchBarContainer.style.display = "flex";
  activeFilters = {}; // reset any previous filters
  countText = `${products.length} products`;
}

// Update count
const countEl = document.getElementById('shopResultsCount');
if (countEl) countEl.textContent = countText;

// Generate products
generateProducts("shopProductContainer", filteredProducts, true);

// Show shop section (this also calls applyFilters() for full filter support)
showSection('shopSection');

// Scroll to top
document.getElementById('shopSection').scrollIntoView({ behavior: 'smooth' });
}
/* =====================================================
 NXew - Professional Animations & Enhancements JS
 ===================================================== */

 (function () {
  'use strict';

  // =====================================================
  // RIPPLE EFFECT on all buttons
  // =====================================================
  function createRipple(e) {
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;
    const rect = btn.getBoundingClientRect();

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add('ripple-wave');

    const existing = btn.querySelector('.ripple-wave');
    if (existing) existing.remove();

    btn.appendChild(circle);
    circle.addEventListener('animationend', () => circle.remove());
  }

  function attachRippleToAll() {
    const selectors = 'button, .btn, .custom-menu-item, .nav-link, .category-item, [role="button"]';
    document.querySelectorAll(selectors).forEach(el => {
      if (!el.dataset.ripple) {
        el.addEventListener('click', createRipple);
        el.dataset.ripple = 'true';
      }
    });
  }

  // Also observe DOM changes to attach ripple to dynamically created buttons
  const rippleObserver = new MutationObserver(() => attachRippleToAll());
  rippleObserver.observe(document.body, { childList: true, subtree: true });

  // =====================================================
  // FLY TO CART ANIMATION
  // =====================================================
  function flyToCart(imgSrc, startEl) {
    const cartIcon = document.getElementById('footerBagBadge');
    if (!cartIcon) return;

    const cartRect = cartIcon.getBoundingClientRect();
    const startRect = startEl.getBoundingClientRect();

    // Create flying element
    const flyer = document.createElement('div');
    flyer.classList.add('fly-to-cart');
    flyer.innerHTML = imgSrc
      ? `<img src="${imgSrc}" alt="cart">`
      : `<i class="bi bi-bag-plus fly-to-cart-icon"></i>`;

    document.body.appendChild(flyer);

    // Start position = button center
    const startX = startRect.left + startRect.width / 2 - 25;
    const startY = startRect.top + startRect.height / 2 - 25;

    flyer.style.left = startX + 'px';
    flyer.style.top = startY + 'px';

    // Force reflow
    flyer.getBoundingClientRect();

    // Target position = cart icon
    const endX = cartRect.left + cartRect.width / 2 - 25;
    const endY = cartRect.top + cartRect.height / 2 - 25;

    // Animate using Web Animations API
    const keyframes = [
      {
        left: startX + 'px',
        top: startY + 'px',
        transform: 'scale(1)',
        opacity: 1,
        borderRadius: '50%'
      },
      {
        left: (startX + endX) / 2 - 40 + 'px',
        top: Math.min(startY, endY) - 80 + 'px',
        transform: 'scale(0.9)',
        opacity: 0.9
      },
      {
        left: endX + 'px',
        top: endY + 'px',
        transform: 'scale(0.2)',
        opacity: 0
      }
    ];

    const timing = { duration: 700, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' };
    const anim = flyer.animate(keyframes, timing);

    anim.onfinish = () => {
      flyer.remove();
      // Pop the badge
      const badge = document.getElementById('footerBagBadge');
      if (badge) {
        badge.classList.remove('badge-pop');
        void badge.offsetWidth; // reflow
        badge.classList.add('badge-pop');
        badge.addEventListener('animationend', () => badge.classList.remove('badge-pop'), { once: true });
      }
      // Shake the bag icon
      const bagIcon = document.querySelector('.footer-nav [aria-label="Your Bag"] i');
      if (bagIcon) {
        bagIcon.classList.add('cart-shake');
        bagIcon.addEventListener('animationend', () => bagIcon.classList.remove('cart-shake'), { once: true });
      }
    };
  }

  // Expose flyToCart globally for use by nxewQuickAdd in 00.js
  window.nxewFlyToCart = flyToCart;

  // =====================================================
  // INTERCEPT addToCartWithSelection to trigger animation
  // (deferred so 00.js is fully evaluated first)
  // =====================================================
  function patchFunctions() {

  const _origAddToCartWithSelection = window.addToCartWithSelection;
  window.addToCartWithSelection = function (productId, buttonEl) {
    // Get the product image for animation
    if (typeof products !== 'undefined') {
      const prod = products.find(p => p.id === productId);
      const imgSrc = prod && prod.images && prod.images[0] ? prod.images[0] : null;

      // Find the button that was clicked
      const btn = buttonEl || document.querySelector(`[onclick*="addToCartWithSelection(${productId})"]`);
      if (btn) {
        // Add loading state to button
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Adding...';
        btn.classList.add('adding');
        btn.style.pointerEvents = 'none';

        setTimeout(() => {
          btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Added!';
          btn.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)';
        }, 300);

        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.background = '';
          btn.style.pointerEvents = '';
          btn.classList.remove('adding');
        }, 1400);

        flyToCart(imgSrc, btn);
      }
    }

    // Call original
    if (typeof _origAddToCartWithSelection === 'function') {
      _origAddToCartWithSelection(productId);
    }
  };

  // =====================================================
  // INTERCEPT addToCart (if used on cards)
  // =====================================================
  const _origAddToCart = window.addToCart;
  if (typeof _origAddToCart === 'function') {
    window.addToCart = function (productId, event) {
      if (event) {
        event.stopPropagation();
        const btn = event.currentTarget || event.target;
        const prod = (typeof products !== 'undefined') ? products.find(p => p.id === productId) : null;
        const imgSrc = prod && prod.images && prod.images[0] ? prod.images[0] : null;
        flyToCart(imgSrc, btn);
      }
      _origAddToCart(productId, event);
    };
  }

  // =====================================================
  // BUY NOW BUTTON ANIMATION
  // =====================================================
  const _origBuyProductWithSelection = window.buyProductWithSelection;
  window.buyProductWithSelection = function (productId) {
    const btn = document.querySelector(`[onclick*="buyProductWithSelection(${productId})"]`);
    if (btn) {
      btn.style.transform = 'scale(0.96)';
      setTimeout(() => { btn.style.transform = ''; }, 200);
    }
    if (typeof _origBuyProductWithSelection === 'function') {
      _origBuyProductWithSelection(productId);
    }
  };

  // =====================================================
  // SCROLL PROGRESS BAR
  // =====================================================
  const scrollBar = document.createElement('div');
  scrollBar.className = 'scroll-progress';
  document.body.prepend(scrollBar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollBar.style.width = pct + '%';
  }, { passive: true });

  // =====================================================
  // STAGGERED PRODUCT CARD ENTRANCE
  // =====================================================
  function applyProductStagger(container) {
    const cards = container.querySelectorAll('.col-6, .col-md-4, .col-md-3, .col-lg-3');
    cards.forEach((card, i) => {
      card.style.animationDelay = `${i * 0.05}s`;
      card.classList.add('product-stagger');
    });
  }

  // Observe product containers for new content
  const productContainers = ['shopProductContainer', 'featuredProductsContainer', 'menswearContainer', 'accessoriesContainer', 'searchResultsContainer'];
  productContainers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      const obs = new MutationObserver(() => applyProductStagger(container));
      obs.observe(container, { childList: true });
    }
  });

  // =====================================================
  // SECTION TRANSITION - smooth scroll to top
  // =====================================================
  const _origShowSection = window.showSection;
  window.showSection = function (sectionId) {
    // Animate active nav item
    document.querySelectorAll('.footer-nav .nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.section === sectionId) {
        link.classList.add('active');
        const icon = link.querySelector('i');
        if (icon) {
          icon.style.transform = 'scale(0.8)';
          setTimeout(() => { icon.style.transform = ''; }, 200);
        }
      }
    });

    // Home section special handling
    if (sectionId === 'homeSection') {
      document.body.classList.add('home-section-active');
    } else {
      document.body.classList.remove('home-section-active');
    }

    if (typeof _origShowSection === 'function') {
      _origShowSection(sectionId);
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =====================================================
  // ENHANCED DARK MODE TOGGLE
  // =====================================================
  const _origToggleDarkMode = window.toggleDarkMode;
  window.toggleDarkMode = function () {
    document.body.classList.toggle('dark-mode');
    const toggle = document.querySelector('.dark-mode-toggle');
    if (toggle) {
      const isDark = document.body.classList.contains('dark-mode');
      toggle.innerHTML = isDark ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
      toggle.style.transform = 'scale(1.3) rotate(20deg)';
      setTimeout(() => { toggle.style.transform = ''; }, 300);
    }
    if (typeof _origToggleDarkMode === 'function') {
      _origToggleDarkMode();
    }
  };

  // =====================================================
  // ACTIVE NAV HIGHLIGHT
  // =====================================================
  document.querySelectorAll('.footer-nav .nav-link').forEach(link => {
    link.addEventListener('click', function () {
      document.querySelectorAll('.footer-nav .nav-link').forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // =====================================================
  // PRODUCT CARD - hover quick-add (for featured grid)
  // =====================================================
  function enhanceProductCards(container) {
    container.querySelectorAll('[onclick*="showProductDetails"]').forEach(card => {
      if (card.dataset.enhanced) return;
      card.dataset.enhanced = 'true';
      const wrapper = card.closest('.col-6, .col-md-4, .col-md-3, .col-lg-3');
      if (!wrapper) return;
      wrapper.style.position = 'relative';
    });
  }

  // Apply to existing containers
  productContainers.forEach(id => {
    const container = document.getElementById(id);
    if (container) enhanceProductCards(container);
  });

  // Also enhance dynamically added cards
  const cardObserver = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          enhanceProductCards(node);
          attachRippleToAll();
        }
      });
    });
  });
  cardObserver.observe(document.body, { childList: true, subtree: true });

  // =====================================================
  // REMOVE FROM CART ANIMATION
  // =====================================================
  const _origRemoveFromCart = window.removeFromCart;
  window.removeFromCart = function (index) {
    const cartItems = document.querySelectorAll('#cartContent .card');
    if (cartItems[index]) {
      cartItems[index].style.transition = 'all 0.35s ease';
      cartItems[index].style.transform = 'translateX(100%) scale(0.8)';
      cartItems[index].style.opacity = '0';
      setTimeout(() => {
        if (typeof _origRemoveFromCart === 'function') {
          _origRemoveFromCart(index);
        }
      }, 350);
    } else {
      if (typeof _origRemoveFromCart === 'function') {
        _origRemoveFromCart(index);
      }
    }
  };

  } // end patchFunctions

  // =====================================================
  // INIT
  // =====================================================
  document.addEventListener('DOMContentLoaded', function () {
    // Patch functions after 00.js is loaded
    patchFunctions();

    attachRippleToAll();

    // Set home as active nav
    const homeLink = document.querySelector('[data-section="homeSection"]');
    if (homeLink) homeLink.classList.add('active');

    // Entrance animation for initial section
    const activeSection = document.querySelector('.active-section');
    if (activeSection) {
      activeSection.style.animation = 'none';
      setTimeout(() => {
        activeSection.style.animation = '';
      }, 10);
    }

    console.log('%cNXew Enhanced ✦', 'color: #e94560; font-size: 18px; font-weight: bold; font-family: serif;');
  });

})();

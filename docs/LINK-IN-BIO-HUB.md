# 🔗 Link-in-Bio Hub

Transform your go4me domain into a powerful link-in-bio page with WalletConnect authentication.

## ✨ Features

### 🎯 **Custom Links**
- Add unlimited custom links with titles, descriptions, and icons
- 19 predefined icons (🌐 website, 🐦 Twitter, 📷 Instagram, etc.)
- Click tracking ready for analytics

### 🔒 **Wallet Authentication**
- All actions require WalletConnect signature verification
- Ownership verified by matching connected wallet to domain address
- Secure message signing with timestamp validation

### 📱 **User Experience**
- Responsive design works on all devices
- Real-time updates after adding links
- Loading states and error handling
- Empty states with helpful guidance

## 🚀 How to Use

### **For Domain Owners:**

1. **Visit your domain page** (e.g., `yourname.go4.me`)
2. **Connect your wallet** using WalletConnect
3. **Click the "Links" tab** in the navigation
4. **Click "Add Link"** to create your first link
5. **Sign the request** with your wallet to authenticate
6. **Your link appears instantly** for visitors to see

### **For Visitors:**
- Simply click any link to visit the destination
- Links open in new tabs for seamless browsing
- Clean, professional presentation

## 🛠️ Technical Implementation

### **Components**
- `LinkHub` - Main component displaying links
- `AddLinkModal` - Modal for adding/editing links
- Enhanced `JsonRpcContext` with signing functions

### **API Endpoints**
- `GET /api/links/[username]` - Retrieve user's links
- `POST /api/links/create` - Create new link with signature verification

### **Authentication Flow**
1. User connects wallet via WalletConnect
2. System verifies wallet address matches domain owner
3. User creates/signs message for link creation
4. Server verifies signature and timestamp
5. Link is stored and displayed immediately

## 💰 Monetization Opportunities

### **Immediate Revenue**
- **Premium themes** and customization options
- **Advanced analytics** and click tracking
- **Custom domains** and branding

### **Future Features**
- **Affiliate tracking** with revenue sharing
- **Sponsored links** and advertising
- **E-commerce integration** for direct sales
- **Subscription content** behind paywalls

## 🔧 Development

### **Current Storage**
- In-memory storage for development
- Ready for database integration (PostgreSQL recommended)

### **Production Readiness**
- Complete TypeScript types
- Error handling and validation
- Rate limiting and security measures
- Signature verification with Chia cryptography

### **Database Schema** (for production)
```sql
CREATE TABLE user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(32) NOT NULL,
  title VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  description VARCHAR(200),
  icon VARCHAR(10),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_links_username ON user_links(username);
CREATE INDEX idx_user_links_active ON user_links(username, is_active, order_index);
```

## 🎨 Customization

### **Icon Library**
19 predefined icons covering common use cases:
- 🌐 Website, 🐦 Twitter, 📷 Instagram
- 💻 GitHub, 💼 LinkedIn, 💬 Discord
- 🛒 Shop, 📝 Blog, 🎨 Portfolio
- 🎵 Music, 🎙️ Podcast, 📚 Book
- 🎮 Game, 🖼️ NFT, ₿ Crypto
- 📧 Email, 📱 Telegram, 🔗 Custom

### **Themes** (coming soon)
- Default, Minimal, Gradient, Dark
- Custom CSS support for advanced users
- Brand color customization

## 🚀 Getting Started

The Link-in-Bio Hub is now integrated into all domain pages. Users just need to:

1. **Connect their wallet** on their domain page
2. **Click the "Links" tab**
3. **Start adding links!**

Transform your go4me domain from a simple profile into a powerful, monetizable landing page! 🎉

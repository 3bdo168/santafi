<<<<<<< HEAD
# 🔥 santafi - Premium Fast Food Restaurant Web App

A modern, visually stunning restaurant menu website built with React.js, Tailwind CSS, and Framer Motion.

## 🎯 Features

### Visual Design
- **Dark Theme with Fire Aesthetic**: Orange and red accents throughout the UI
- **3D Card Tilt Effects**: Mouse-tracking perspective transforms on hover
- **Smooth Animations**: Powered by Framer Motion for buttery smooth 60fps animations
- **Glass Morphism**: Modern glassmorphism effects with backdrop blur
- **Responsive Design**: Mobile-first approach that works on all devices

### Components
- **Navbar**: Sticky navigation with mobile menu
- **Menu Cards**: Interactive cards with 3D tilt, pricing options, and "NEW" badges
- **Category Sections**: Organized menu by chicken sandwiches, beef sandwiches, and sides
- **Animated Elements**: Floating cards, fadeIn animations, staggered children
- **Toast Notifications**: User feedback system for actions
- **Loader**: Beautiful spinning loader animation

### Interactive Features
- **Add to Cart**: Functional cart system with toast notifications
- **Price Variants**: Single, Double, and Triple pricing options
- **Hover Effects**: Scale, glow, and shadow effects on all interactive elements
- **Parallax Sections**: Subtle parallax effects for depth
- **Custom Hooks**: `useTilt3D` for reusable 3D tilt functionality

## 📁 Project Structure

```
src/
├── assets/
│   └── images/           # Menu images (placeholder emojis)
├── components/
│   ├── Navbar.jsx        # Main navigation component
│   ├── MenuCard.jsx      # Individual menu item card
│   ├── CategorySection.jsx # Section for menu categories
│   ├── AnimatedCard3D.jsx # 3D animated card wrapper
│   ├── Loader.jsx        # Loading spinner animation
│   └── Toast.jsx         # Toast notification component
├── pages/
│   ├── Home.jsx          # Home page with hero section
│   └── Menu.jsx          # Full menu page with categories
├── data/
│   └── menuData.js       # Menu structure and categories
├── hooks/
│   └── useTilt3D.js      # Custom hook for 3D tilt effects
├── animations/
│   └── motionVariants.js # Framer Motion animation variants
├── styles/
│   └── globals.css       # Global styles and Tailwind imports
├── App.js                # Main app component with routing
└── index.js              # React entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Navigate to the project directory**
   ```bash
   cd f:\santafi0.1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   - The app will automatically open at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

## 📦 Tech Stack

- **React.js 18**: Modern web framework with hooks
- **React Router DOM**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Powerful animation library
- **Three.js**: 3D graphics (included in package, ready for advanced features)
- **Zustand**: Lightweight state management (installed, ready to use)

## 🎨 Design Features

### Color Palette
- **Primary Orange**: `#dc2626`
- **Accent Red**: `#ef4444`
- **Dark Background**: `#111827`
- **Dark Secondary**: `#1f2937`

### Key Animations
1. **Card Hover Tilt**: 3D perspective rotation based on mouse position
2. **Float Animation**: Subtle up-down floating motion
3. **Glow Effect**: Neon-like box shadow that pulses
4. **Fade In**: Staggered entrance animations for lists
5. **Scale on Hover**: Interactive buttons and cards

### Effects
- **Backdrop Blur**: Glass morphism panels
- **Gradient Text**: Orange to red gradient headings
- **Box Shadow Glow**: Neon-like shadows on buttons
- **Perspective Transform**: 3D depth effects

## 📝 Menu Data Structure

Each menu item includes:
```javascript
{
  id: 1,
  name: "Item Name",
  description: "Item description",
  price_single: 5.99,
  price_double: 9.99,
  price_triple: 14.99,  // Optional
  image: "🍔",           // Emoji or image path
  isNew: false
}
```

### Menu Categories
- **Chicken Sandwiches** (5 items)
- **Beef Sandwiches** (5 items)
- **Side Items** (6 items)

## 🔧 Customization

### Add New Menu Items
Edit `src/data/menuData.js` and add items to the appropriate category array.

### Modify Colors
Update the Tailwind config in `tailwind.config.js` under the `colors` theme section.

### Animation Speeds
All animation durations can be modified in `src/animations/motionVariants.js`.

### Change Tilt Intensity
Adjust the `intensity` prop in `AnimatedCard3D.jsx` or the calculations in `useTilt3D.js`.

## 🚀 Performance Optimizations

- **React.memo**: Components wrapped with React.memo to prevent unnecessary re-renders
- **Lazy Image Loading**: (Can be implemented with React.lazy and Suspense)
- **Framer Motion Optimization**: Hardware-accelerated transforms
- **CSS Classes**: Tailwind's purge feature removes unused styles in production

## 📱 Responsive Breakpoints

- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md)
- Desktop: > 1024px (lg)

## 🎯 Future Enhancements

- [ ] Real image integration (replace emoji placeholders)
- [ ] Product filtering by category
- [ ] Search functionality
- [ ] Shopping cart with persistent storage
- [ ] Checkout flow
- [ ] User authentication
- [ ] Order history
- [ ] Three.js 3D menu visualization
- [ ] Social media integration
- [ ] Reviews and ratings

## 📄 License

This project is open source and available under the MIT License.

## 👥 Contributing

Feel free to fork this project and submit pull requests for any improvements!

## 📞 Support

For questions or issues, please open an issue in the repository.

---

**Built with ❤️ and 🔥 using React.js**
=======
"# santafi" 
>>>>>>> 2a79269d1a9a28f91d279ccad6776398955698c4

# 🔧 INSTALLATION & TROUBLESHOOTING GUIDE

## 🚀 Quick Start (Most Common Setup)

### Windows Command Prompt Method (Recommended)

1. **Open Command Prompt** (not PowerShell)
   - Press `Win + R`
   - Type `cmd`
   - Press Enter

2. **Navigate to project**
   ```cmd
   cd F:\santafi0.1
   ```

3. **Install dependencies**
   ```cmd
   npm install
   ```
   This will take 3-5 minutes

4. **Start development server**
   ```cmd
   npm start
   ```

5. **Browser will open automatically**
   - If not, go to: http://localhost:3000

### That's it! 🎉

---

## 🆘 If You Get Errors

### Error: "npm is not recognized"

**Solution 1: Install Node.js**
1. Download from: https://nodejs.org/
2. Choose LTS version
3. Install with all defaults
4. Restart Command Prompt
5. Try `npm start` again

**Solution 2: Add Node to PATH**
1. Right-click This PC → Properties
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under System variables, click "Path" → Edit
5. Add: `C:\Program Files\nodejs`
6. Click OK and restart Command Prompt

### Error: "react-scripts is not recognized"

**Solution 1: Clear npm cache**
```cmd
cd F:\santafi0.1
npm cache clean --force
del node_modules /s /q
del package-lock.json
npm install
npm start
```

**Solution 2: Use yarn instead (if npm fails)**
```cmd
npm install -g yarn
cd F:\santafi0.1
yarn install
yarn start
```

**Solution 3: Use npx directly**
```cmd
cd F:\santafi0.1
npx webpack serve
```

### Error: "Port 3000 is already in use"

**Solution 1: Use a different port**
```cmd
set PORT=3001
npm start
```

**Solution 2: Kill the process using port 3000**
```cmd
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
npm start
```

### Error: "webpack not found"

```cmd
cd F:\santafi0.1
npm install webpack webpack-cli --save-dev
npm install webpack-dev-server --save-dev
npm start
```

### Error: "Module not found"

```cmd
cd F:\santafi0.1
npm install
npm start
```

### Memory/Heap errors during build

```cmd
node --max-old-space-size=4096 node_modules/react-scripts/bin/react-scripts.js start
```

---

## 📋 Verification Checklist

Before running `npm start`, verify:

```
✅ Node.js installed: node --version
✅ npm installed: npm --version
✅ In correct folder: cd F:\santafi0.1
✅ package.json exists: dir package.json
✅ Can see package.json: type package.json
```

### All Should Output:
- `node --version` → v14.0.0 or higher
- `npm --version` → v6.0.0 or higher

---

## 💻 Alternative Methods to Start

### Method 1: Using VS Code Terminal
1. Open VS Code
2. Open folder: `F:\santafi0.1`
3. Terminal → New Terminal
4. Run: `npm start`

### Method 2: Using Git Bash
1. Install Git Bash from https://git-scm.com/
2. Open Git Bash
3. Run:
   ```bash
   cd /f/santafi0.1
   npm install
   npm start
   ```

### Method 3: Using Windows Subsystem for Linux (WSL)
```bash
wsl
cd /mnt/f/santafi0.1
npm install
npm start
```

### Method 4: Manual Node.js Execution
```cmd
cd F:\santafi0.1
node node_modules/react-scripts/bin/react-scripts.js start
```

### Method 5: Using Webpack Dev Server Directly
```cmd
cd F:\santafi0.1
npx webpack serve --mode development
```

---

## 🔍 Debugging Steps

### Step 1: Check Node Installation
```cmd
node --version
npm --version
which node
which npm
```

Should show:
- v14+
- v6+
- Path to node executable
- Path to npm executable

### Step 2: Check npm Configuration
```cmd
npm config list
npm root
npm root -g
```

### Step 3: Verify Project Files
```cmd
cd F:\santafi0.1
dir src
dir public
type package.json
```

### Step 4: Check Node Modules
```cmd
cd F:\santafi0.1
dir node_modules | findstr react
```

Should list react, react-dom, react-scripts, etc.

### Step 5: Test npm Scripts
```cmd
npm run build
```

If build succeeds, try:
```cmd
npm start
```

---

## 📊 System Requirements

### Minimum
- Node.js v14.0+
- npm v6.0+
- 1GB available disk space
- 2GB RAM minimum

### Recommended
- Node.js v16.0+
- npm v8.0+
- 2GB SSD space
- 4GB RAM
- Modern browser (Chrome/Firefox)

---

## 🌐 Firewall/Proxy Issues

If behind corporate firewall/proxy:

### Set npm Registry
```cmd
npm config set registry https://registry.npmjs.org/
npm config set fetch-timeout 120000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
```

### Set proxy (if needed)
```cmd
npm config set proxy http://[username:password@]proxy.company.com:8080
npm config set https-proxy https://[username:password@]proxy.company.com:8080
```

### Reset to defaults
```cmd
npm config set registry https://registry.npmjs.org/
npm config delete proxy
npm config delete https-proxy
```

---

## 🧹 Cleanup & Fresh Start

If all else fails, do a complete clean install:

```cmd
REM Remove everything
cd F:\santafi0.1
rmdir /s /q node_modules
del package-lock.json

REM Clear npm cache
npm cache clean --force
npm cache verify

REM Fresh install
npm install

REM Start
npm start
```

---

## ✅ Testing the Installation

Once `npm start` runs, you should see:
```
> react-scripts start

Starting the development server...

Compiled successfully!

You can now view santafi-restaurant in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### In Browser:
- [x] Page loads without errors
- [x] Logo/title visible
- [x] Navigation bar showing
- [x] Colors look orange/red themed
- [x] Can click buttons
- [x] Can navigate to menu page
- [x] Cards are interactive

---

## 📱 Testing Features

### After Launch, Test These:

**Navigation**
- [ ] Click logo → goes to home
- [ ] Click "Menu" → goes to menu page
- [ ] Click "Home" → goes back
- [ ] Navbar is sticky when scrolling

**Animations**
- [ ] Hover over cards → cards tilt
- [ ] Hover over buttons → buttons glow
- [ ] Loading animation plays smoothly
- [ ] Toast notifications appear

**Responsiveness**
- [ ] Open DevTools (F12)
- [ ] Toggle Device Toolbar (Ctrl+Shift+M)
- [ ] Try mobile sizes
- [ ] Try tablet sizes
- [ ] Try desktop sizes

**Functionality**
- [ ] Click "Add to Cart" → toast appears
- [ ] Click prices → price toggles
- [ ] NEW badges visible
- [ ] Scroll is smooth

---

## 🛑 When Nothing Works

### Nuclear Option (Complete Reset)

```cmd
REM Create backup
copy F:\santafi0.1 F:\santafi0.1-backup /s /i

REM Delete everything except src, public, package.json
cd F:\santafi0.1
rmdir /s /q node_modules
del package-lock.json

REM Reinstall from scratch
npm install --save-dev

REM Try with legacy peer deps flag
npm install --legacy-peer-deps

REM Start
npm start
```

### If Still Failing

Check online resources:
- React Docs: https://create-react-app.dev/docs/getting-started/
- Stack Overflow: https://stackoverflow.com/questions/tagged/create-react-app
- GitHub Issues: https://github.com/facebook/create-react-app/issues

---

## 📞 Common Issues Summary

| Issue | Command to Fix |
|-------|-----------------|
| npm not found | Install Node.js from nodejs.org |
| Port in use | set PORT=3001 && npm start |
| webpack missing | npm install webpack --save-dev |
| Module not found | npm install |
| Cache corrupt | npm cache clean --force |
| Global issue | npm config reset |
| Build fails | npm run build (to see errors) |
| Slow installation | npm install --prefer-offline |

---

## ⏱️ Installation Time Estimates

| Action | Time |
|--------|------|
| npm install | 3-10 minutes |
| First npm start | 1-2 minutes |
| Subsequent starts | 30 seconds |
| Build for prod | 2-3 minutes |

---

## 🎯 Success Indicators

You'll know it's working when you see:
1. ✅ "Compiled successfully!" message
2. ✅ Browser automatically opens to localhost:3000
3. ✅ Page shows your santafi restaurant name
4. ✅ Orange fire-themed design visible
5. ✅ No red error messages in terminal

---

## 💡 Pro Tips

1. **Keep npm updated**
   ```cmd
   npm install -g npm@latest
   ```

2. **Speed up npm install**
   ```cmd
   npm install --no-optional --prefer-offline
   ```

3. **Use npm ci for production**
   ```cmd
   npm ci
   ```

4. **Check outdated packages**
   ```cmd
   npm outdated
   ```

5. **Monitor npm logs**
   ```cmd
   npm ls (shows dependency tree)
   ```

---

## 🆘 Still Need Help?

### Quick Questions?
1. Check STARTUP_GUIDE.md
2. Check PROJECT_SUMMARY.md
3. Check README.md

### Specific Errors?
1. Copy error message
2. Search on Stack Overflow
3. Check GitHub issues for create-react-app

### Want to Learn More?
1. React Tutorial: https://react.dev/learn
2. Tailwind CSS: https://tailwindcss.com/docs
3. Framer Motion: https://www.framer.com/motion/introduction/

---

*Last Updated: March 19, 2026*  
*santafi Restaurant Installation Guide v1.0*

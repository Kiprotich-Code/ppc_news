# Deployment Instructions

## Quick Deploy Commands

### Local Testing
```bash
# Node.js
cd fallback && npm install && npm start

# Python
cd fallback && python -m http.server 3000

# PHP
cd fallback && php -S localhost:3000
```

### Production Deployment

#### 1. Vercel (Fastest)
```bash
cd fallback
npx vercel --prod
# When prompted:
# - Set project name: ppc-news-maintenance
# - Framework: Other (or leave empty)
# - Root Directory: ./
# - Build Command: [leave empty]
# - Output Directory: public (or leave as ./)
```

#### 2. Netlify Drop
- Go to https://app.netlify.com/drop
- Drag the entire `fallback` folder
- Get instant URL

#### 3. GitHub Pages
```bash
# Create new repo for maintenance page
git init
git add .
git commit -m "Add maintenance page"
git branch -M gh-pages
git remote add origin https://github.com/yourusername/maintenance.git
git push -u origin gh-pages
```

#### 4. Railway
```bash
cd fallback
railway login
railway init
railway up
```

#### 5. Heroku
```bash
cd fallback
heroku create ppc-news-maintenance
git init
git add .
git commit -m "Maintenance page"
heroku git:remote -a ppc-news-maintenance
git push heroku main
```

## DNS Switching

When your main site goes down, point your domain to the maintenance page:

### Cloudflare
1. Go to DNS settings
2. Change A record to point to maintenance server IP
3. Or use Page Rules to redirect

### Traditional DNS
1. Update A record to maintenance server IP
2. Wait for propagation (5-60 minutes)

## Emergency Checklist

1. ✅ Deploy maintenance page to backup hosting
2. ✅ Test the maintenance page URL
3. ✅ Update DNS records if needed
4. ✅ Verify page displays correctly
5. ✅ Confirm "Browse Writers" link works (if keeping that functionality)
6. ✅ Set calendar reminder for 16:00 EAT to restore service

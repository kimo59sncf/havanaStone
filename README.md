# Havana Stones — Premium Natural Stone, Malta

Static multi-page website for **Havana Stones** (Havana Premium Global), Malta's premium natural stone supplier and fabricator.

## Run locally
Open `index.html` in any browser, or serve with:
```bash
cd havana-stones && python3 -m http.server 8080
```
Then visit http://localhost:8080

## Run with Docker (recommended for production parity)
```bash
cd havana-stones
docker compose up -d --build
```
Then visit http://localhost:8080

To stop:
```bash
docker compose down
```

## Deploy to VPS (Docker)
The project ships with a `Dockerfile` (Nginx Alpine), `nginx.conf`, `docker-compose.yml` and a `deploy.sh` script targeting `ubuntu@83.228.219.249`.

**Prerequisites on the VPS:** Docker + Docker Compose installed, and SSH access.

Deploy with:
```bash
cd havana-stones
./deploy.sh
# or with a custom target:
./deploy.sh ubuntu@YOUR_SERVER_IP
```

The site will be served on port **8080** by default (`http://83.228.219.249:8080`). To serve directly on port 80, edit `docker-compose.yml` and change the port mapping to `"80:80"`.

## Structure
```
havana-stones/
├── index.html       Home (hero, materials, recent work, FAQ, CTA)
├── products.html    Catalogue with filters
├── portfolio.html   Project gallery with filters
├── blog.html        Articles (care, buying guides, trends)
├── quote.html       Bespoke quote form (with attachment)
├── contact.html     Showroom, hours, map, contact form
├── css/style.css    VIP dark-luxury theme
├── js/main.js       Interactivity
├── assets/images/   Local images (place your own here)
├── llms.txt         AI/LLM guidance (GEO)
├── robots.txt
└── sitemap.xml
```

## Business info
- **Havana Premium Global** — 1 Triq Wills, Paola, Malta
- Phone / WhatsApp: +356 7719 8193
- Email: info@havanastones.mt

## Images
Images currently load from Unsplash (royalty-free). To use your own photos, add them to `assets/images/` and replace the `https://images.unsplash.com/...` URLs in the HTML files. If you place images on your Desktop in a folder named `havana`, they can be copied into `assets/images/`.

## SEO / GEO
- JSON-LD: `LocalBusiness`, `Product`, `FAQPage`, `BlogPosting`, `ItemList`
- `llms.txt` for AI citation
- Semantic clusters: Natural Stone Malta → Marble / Granite / Travertin Malta
- `robots.txt` and `sitemap.xml` configured

## Production notes
For deployment, replace the placeholder `https://havanastones.mt/` domain with your real domain. Forms are wired with a demo submit; connect them to a backend (Strapi, Formspree, or a CRM webhook) for production lead capture.
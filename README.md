Ethical Portal - Full ZIP (Netlify frontend + Render backend)

Contents:
- package.json
- server.js
- public/
  - index.html
  - style.css
  - script.js
  - admin.html
  - admin.js

How to deploy (quick):
1) Frontend -> Netlify (recommended)
   - Zip or extract the 'public' folder contents and upload via Netlify Drop (https://app.netlify.com/drop).
   - Your site will be live. If you host frontend on Netlify, change client fetch URLs to point to your backend URL if needed.

2) Backend -> Render (or Railway)
   - Create an account on https://render.com (or https://railway.app)
   - Create a new Web Service, connect a GitHub repo with this project, or use manual deploy.
   - Build command: `npm install`
   - Start command: `npm start`
   - Render will provide a public URL like `https://your-service.onrender.com`
   - In Netlify frontend, update client fetch URLs to point to the backend (or use relative paths if hosting backend + frontend together).

Local testing:
- Install Node.js
- Run:
  npm install
  node server.js
- Visit http://localhost:3000 (client) and http://localhost:3000/admin (admin)

Security:
- This demo has no authentication. For production add admin auth (username/password) and HTTPS.

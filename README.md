# JewUnity - Social Network for Jewish Communities

## 📌 About the Project
JewUnity is a social network platform designed to connect users around Jewish topics. Users can register, log in, join groups, create posts (including images/videos), comment, like, and more.

##  Technologies Used
- Node.js + Express.js
- MongoDB + Mongoose
- HTML5, CSS3, JavaScript (Vanilla)
- Bootstrap
- D3.js (for charts)
- Leaflet.js (for maps)
- OpenWeatherMap API (weather service)

##  Team
- Daniel Fitoussi  


## 🚀 How to Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DanielFitoussi/JewUnity.git
   cd jewunity
   
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file with Mongo URI:**
   ```
   MONGO_URI=mongodb://localhost:27017/jewunity
   ```

4. **Seed the database before starting:**
   ```bash
   node scripts/seed.js
   ```

5. **Start the server:**
   ```bash
   node app.js
   ```

6. **Access the login page in your browser:**
   ```
   http://localhost:3005/login.html
   ```

7. **Default User Credentials for First Login:**
- **Username:** `david123`
- **Password:** `123456`
  
## 📁 Folder Structure
```
JewUnity/
│
├── public/             # HTML, CSS, frontend JS
├── models/             # Mongoose models
├── routes/             # API routes
├── controllers/        # Backend logic
├── uploads/            # Media files (images/videos)
├── scripts/seed.js     # Database seeding script
├── app.js              # Main server file
├── .env                # Environment variables
├── package.json        # Project metadata
├── README.md           # Project documentation
```

```
# sirkel-wibu

sirkel-wibu is a web-based manga archive that fetches data from the Jikan API, the unofficial MyAnimeList API. It provides a clean, dark-themed interface for browsing, searching, and filtering manga titles with pagination support.

## Features

- Search manga by title
- Filter by genre (14 genres available)
- Sort by popularity, rating, favorites, members, or title
- Pagination with page navigation
- Dark mode with brown and cream color scheme
- Responsive design for mobile and desktop
- Loading skeleton for better user experience
- Data sourced from Jikan API

## Tech Stack

- React 18
- Vite
- Jikan API (MyAnimeList unofficial API)
- CSS3 with custom properties

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
```

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/username/sirkel-wibu.git
   cd sirkel-wibu
```

2. Install dependencies
   ```bash
   npm install
   ```
3. Start the development server
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to http://localhost:5173

Build for Production

```bash
npm run build
```

The build output will be in the dist directory.

Project Structure

```
sirkel-wibu/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── package.json
├── vite.config.js
├── vercel.json
└── .gitignore
```

API Reference

This project uses the Jikan API version 4, which provides access to MyAnimeList's manga database.

Key endpoints used:

· GET /manga?q={title} - Search manga by title
· GET /manga?page={page} - Paginated results
· GET /manga?genres={genre} - Filter by genre
· GET /manga?order_by={sort} - Sort results

Rate limits: 30 requests per minute, 2 requests per second.

Deployment

Deploy to Vercel

1. Push your code to a GitHub repository
2. Visit vercel.com
3. Click "Add New Project"
4. Select your repository
5. Click "Deploy"

Vercel automatically detects the Vite project and handles the build process.

Environment Variables

No environment variables are required for this project.

License

This project is open source and available under the MIT License.

Acknowledgments

· Data provided by Jikan API
· Built with React and Vite

Contact

For questions or feedback, please open an issue on the GitHub repository.

---

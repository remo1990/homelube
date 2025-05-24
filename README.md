# HomeLube Assist

A user-friendly web application that helps users record and track their at-home oil changes through an interactive chatbot interface.

## Features

- Interactive chatbot interface for recording oil changes
- Vehicle information management (Make, Model, Year, Engine, Mileage)
- Service history tracking
- User feedback system
- Clean and intuitive user interface

## Tech Stack

- Frontend: React.js with Material-UI
- Backend: Node.js with Express
- Database: MongoDB
- Chatbot: Custom implementation using React

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```
3. Set up environment variables:
   - Create `.env` file in the backend directory
   - Add MongoDB connection string and other configuration

4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm start
   ```

## Project Structure

```
homelube-assist/
├── frontend/           # React frontend application
├── backend/           # Node.js/Express backend server
└── README.md         # Project documentation
``` 
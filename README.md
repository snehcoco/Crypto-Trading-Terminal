# Cryptocurrency Trading Terminal

A web-based cryptocurrency trading terminal designed for real-time market monitoring and risk-free simulated trading.

The system allows users to monitor cryptocurrency prices, view interactive charts, manage watchlists, track their virtual portfolio, and perform simulated buy/sell transactions using virtual funds.


## Features

* Real-time cryptocurrency market data
* Interactive price charts
* Cryptocurrency/asset search
* Watchlist management
* Virtual wallet and balance
* Portfolio and holdings tracking
* Simulated cryptocurrency buying and selling
* Transaction history
* Profit and Loss (P&L) tracking
* User authentication
* Real-time updates
* Responsive web interface

---

## Project Objective

The objective of the Cryptocurrency Trading Terminal is to provide a realistic but risk-free environment where users can practice and evaluate cryptocurrency trading decisions.

Users can monitor market conditions, manage virtual assets, execute paper trades, and analyze their portfolio performance without using real money.

---

## System Overview

The application consists of multiple components working together:

```text
                    +---------------------+
                    |        User         |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    |    Web Frontend     |
                    |                     |
                    | Dashboard           |
                    | Charts              |
                    | Watchlist            |
                    | Portfolio            |
                    | Trading Interface   |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    |     Backend API     |
                    |                     |
                    | Authentication      |
                    | Trading Logic       |
                    | Portfolio Manager   |
                    | Market Data         |
                    +-------+-----+-------+
                            |     |
                 +----------+     +----------+
                 |                           |
                 v                           v
        +-----------------+        +-----------------+
        |    Database     |        | Market Data API |
        |                 |        |                 |
        | Users           |        | Crypto Prices  |
        | Holdings        |        | Market Data     |
        | Transactions    |        +-----------------+
        | Watchlists      |
        +-----------------+
```

---

## Core Workflow

1. User logs into the application.
2. The system retrieves current cryptocurrency market data.
3. The user searches for an asset or selects one from the watchlist.
4. The application displays price information and interactive charts.
5. The user can perform a simulated Buy or Sell transaction.
6. The transaction is recorded in the database.
7. The user's virtual balance and holdings are updated.
8. Portfolio value and profit/loss are recalculated.
9. Transaction history is maintained for future analysis.

---

## Main Modules

### 1. Authentication

Handles user registration, login and authentication.

### 2. Market Monitoring

Displays current cryptocurrency prices and relevant market information.

### 3. Charts

Provides interactive visualizations of cryptocurrency price movements.

### 4. Watchlist

Allows users to save and monitor selected cryptocurrencies.

### 5. Paper Trading

Allows users to simulate cryptocurrency purchases and sales using virtual funds.

### 6. Portfolio Management

Tracks:

* Virtual balance
* Cryptocurrency holdings
* Transactions
* Portfolio value
* Profit/Loss

### 7. Transaction History

Maintains a record of simulated buying and selling activities.

---

## Technology Stack

### Frontend

* React
* JavaScript
* CSS

### Backend

* Node.js
* Express

### Database

* MongoDB Atlas

### APIs

* CoinGecko market-data API
* Socket.IO for real-time market updates

### Development Tools

* Git
* GitHub
* Visual Studio Code

---

## Running the Web Application

### Frontend

Install [Node.js](https://nodejs.org/) and npm, then open a terminal in the project root and run:

```bash
npm ci
npm start
```

The React development server opens at `http://localhost:3000`.

### Backend

The backend uses MongoDB Atlas and serves API requests at `http://localhost:5000/api`. Create an Atlas database user and allow your current IP address in Atlas Network Access. Keep the database password private; do not commit it.

In a second terminal, from the project root, install the backend dependencies and create its local environment file:

```powershell
cd server
npm ci
Copy-Item .env.example .env
```

Edit `server/.env` and replace `MONGODB_URI` with the connection string from Atlas. If your database password contains reserved URI characters, percent-encode them before adding the URI. Generate a JWT secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste the generated value into `JWT_SECRET` in `server/.env`. Then start the API:

```powershell
npm run dev
```

The backend waits for a successful Atlas connection before listening on port `5000`. Check its health at `http://localhost:5000/api/health`; the response should report `"database":"connected"`. The frontend market-data endpoint also requires internet access to CoinGecko. Once the API is running, start the frontend from the project root with `npm start`. The **Try Demo Account** button creates or signs into a paper-trading demo account; you can also register a separate account.

---

## Project Structure

```text
Cryptocurrency-Trading-Terminal/
│
├── public/
├── server/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   └── pages/
├── package.json
├── README.md
└── ...
```

---

## Security and Risk Considerations

The project considers several potential risks:

* Market-data API failures or rate limits
* Network and connectivity problems
* Delayed or inaccurate market data
* Real-time synchronization issues
* Database errors
* Authentication and security vulnerabilities
* Limited development time

The system is designed as a paper-trading platform and does not execute real financial transactions.

---

## Disclaimer

This application is an educational cryptocurrency trading simulator.

It uses virtual funds and does not execute real cryptocurrency trades or provide financial advice.

---

## License

This project was developed as an academic software engineering project.

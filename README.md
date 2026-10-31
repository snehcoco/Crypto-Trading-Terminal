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

### Prerequisites

Install [Node.js](https://nodejs.org/) 20 or newer. npm is included with Node.js.

If PowerShell reports that `npm.ps1` cannot be loaded because script execution is disabled, run this once (Administrator access is not required), restart the terminal, and verify npm:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
npm --version
```

### 1. Configure and start the backend

The backend uses MongoDB Atlas and serves API requests at `http://localhost:5000/api`. In Atlas, create a database user and add your current IP address under **Security > Network Access**. Keep the database password private and never commit `server/.env`.

Open a terminal in the project root and run:

```powershell
cd server
npm ci
New-Item -Path .env -ItemType File -Force
```

Add these values to `server/.env`:

```dotenv
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/crypto_trading_terminal?retryWrites=true&w=majority
JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET
```

If the database password contains reserved URI characters, percent-encode them in `MONGODB_URI`. Generate a JWT secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste the generated value after `JWT_SECRET=`, then start the API:

```powershell
npm run dev
```

Confirm that `http://localhost:5000/api/health` reports `"database":"connected"` before starting the frontend.

### 2. Start the frontend

Open a second terminal in the project root and run:

```powershell
npm ci
npm start
```

The application opens at `http://localhost:3000`. Its market-data features require internet access to CoinGecko. The **Try Demo Account** button creates or signs into a paper-trading demo account; you can also register a separate account.

---

## Project Structure

```text
Cryptocurrency-Trading-Terminal/
│
├── public/
├── server/
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

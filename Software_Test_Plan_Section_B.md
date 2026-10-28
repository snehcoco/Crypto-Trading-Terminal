# PART B — SOFTWARE TEST PLAN

## Cryptocurrency Trading Terminal — Simulated Trading Workflow

### B.1 Test Plan Identifier

`TP-CTT-TRADE-01`

### B.2 Objective

This test plan verifies the simulated trading workflow from selecting a
cryptocurrency through submitting a BUY or SELL order and viewing the resulting
account state. It verifies client-side input validation, authentication,
communication with the `POST http://localhost:5000/api/trade` endpoint, user
feedback, virtual-balance updates, portfolio changes, and transaction-history
visibility.

The plan is based on the current frontend implementation. The backend API,
database, market-data service, and WebSocket service are treated as integrated
test dependencies because their source code is not included in this checkout.
Backend assertions must therefore be confirmed through API responses and
observable application behavior.

### B.3 Features to be Tested

- Selecting a cryptocurrency from the live market table or search results.
- Entering a positive trade quantity and viewing the estimated USD cost.
- Submitting BUY and SELL simulated orders through `/api/trade`.
- Client-side rejection of blank, non-numeric, zero, and negative quantities.
- Client-side rejection when no cryptocurrency is selected.
- Authenticated API communication using the stored JWT.
- Successful-trade feedback, quantity reset, and virtual-balance update.
- Portfolio holdings/value/P&L refresh after a trade.
- Transaction-history recording and display after a successful trade.
- Server-side rejection handling, including insufficient funds or holdings and
  expired/invalid authentication.

### B.4 Features Not to be Tested (Out of Scope for this Plan)

- Live cryptocurrency price correctness, exchange-rate accuracy, and external
  market-data-provider availability; these belong to a separate market-data
  test plan.
- The internal implementation of the backend trade controller, database
  transactions, and authentication middleware; this plan verifies their
  externally observable contract only.
- WebSocket transport/reconnection and market-update frequency; these belong to
  a real-time communication test plan.
- Visual rendering and numerical correctness of historical price charts; these
  belong to a charting/market-monitoring test plan.
- Real cryptocurrency orders, deposits, withdrawals, or financial settlement;
  the application is a virtual paper-trading system.

### B.5 Business Rule(s) / Feature Under Test

An authenticated user may submit a simulated BUY or SELL order for the selected
cryptocurrency. The client must submit a quantity that parses to a number
greater than zero and must have a selected coin. The estimated cost is
`quantity × current coin price`.

The server must authorize the request and apply the trade according to the
account state: a BUY must be accepted only when the user has sufficient virtual
balance, and a SELL must be accepted only when the user has sufficient holdings.
On an accepted order, the server records the transaction, updates the user's
virtual balance and holdings, and returns the new balance. The client then
updates the displayed balance, clears the quantity field, and shows a success
notification. On rejection or network failure, the client shows an error and
must not display a successful-trade result.

**Verified project values used by this plan:** New registrations advertise an
initial virtual balance of `$10,000`; the trade quantity input is
`type="number"`, `min="0"`, and `step="any"`; and the frontend sends
`cryptoId`, `symbol`, `name`, `type`, and numeric `quantity`. The repository
does not define a fixed minimum positive quantity, maximum quantity, fee, or
fixed cryptocurrency price. Therefore those values must not be invented in
the test results.

### B.6 Black-Box Test Design — Equivalence Partitioning & Boundary Value Analysis

**Input under test:** Trade quantity. The client accepts numeric values that
parse to a value greater than `0`; no positive upper limit is defined in the
frontend. The server additionally applies account and business constraints.

#### Equivalence classes

| Class type | Description | Representative value |
|---|---|---:|
| Valid | Numeric quantity greater than zero | `1` |
| Invalid boundary | Zero or negative quantity | `0`, `-1` |
| Invalid | Blank or non-numeric quantity | blank, `"abc"` |

#### Test cases

| TC ID | Description | Input quantity | Trade type | Expected output | Actual output | Pass/Fail |
|---|---|---:|---|---|---|---|
| TC-BVA-01 | Valid quantity | `1` | BUY | `POST http://localhost:5000/api/trade` is called with numeric quantity `1`; success message appears, quantity clears, and `response.data.newBalance` is applied. | Not executed: backend is absent from this checkout | Not executed |
| TC-BVA-02 | Invalid boundary quantity | `0`, `-1` | BUY | `Enter a valid quantity` appears; no API request is sent. | Static code result: `!qty || qty <= 0` returns before `executeTrade` | Pass (code inspection) |
| TC-BVA-03 | Blank/non-numeric quantity | blank, `abc` | BUY | `Enter a valid quantity` appears; no API request is sent. | Static code result: `parseFloat` produces `NaN` for invalid input | Pass (code inspection) |

### B.7 Black-Box Test Design — Decision Table Testing

**Conditions**

- **C1:** Quantity parses to a number greater than zero.
- **C2:** A cryptocurrency is selected.
- **C3:** The authenticated trade request is accepted by the server (including
  sufficient balance for BUY or sufficient holdings for SELL).
- **C4:** The selected order type is BUY or SELL.

**Action:** Submit the order and update the account only when all required
conditions are satisfied.

| Rule | C1: valid quantity | C2: coin selected | C3: server accepts | C4: valid type | Action |
|---|---|---|---|---|---|
| R1 | Y | Y | Y | Y | Execute trade; update balance; clear quantity; show success |
| R2 | N | Y | - | Y | Reject locally; show validation error; do not call API |
| R3 | Y | N | - | Y | Reject locally; show `Please select a coin first`; do not call API |

#### Decision-table test cases

| TC ID | Rule | Input set 1 | Input set 2 | Input set 3 | Expected result |
|---|---|---|---|---|---|
| TC-DT-01 | R1 | Quantity `1` | Coin BTC selected | Server accepts authenticated BUY | Trade succeeds; returned balance is applied and quantity is cleared |
| TC-DT-02 | R2 | Quantity `0` | Coin BTC selected | Not applicable | `Enter a valid quantity`; `/api/trade` is not called |
| TC-DT-03 | R3 | Quantity `1` | No coin selected | Not applicable | `Please select a coin first`; `/api/trade` is not called |

### B.8 White-Box Test Design — Basis Path Testing

**Module under test:** `handleTrade(type)` in
`src/components/TradePanel.js`. The function validates the form, calls the
trade API, updates the balance on success, and reports errors.

The following is the relevant control flow with statements and decisions
numbered as nodes:

```text
handleTrade(type) {
  1  const qty = parseFloat(quantity);
  2  if (!qty || qty <= 0) { show validation error; return; }
  3  if (!coin) { show coin-selection error; return; }
  4  setLoading(true);
  5  try {
  6    const response = await executeTrade({ coin, type, quantity: qty });
  7    updateBalance(response.data.newBalance);
  8    show success; clear quantity; notify parent;
  9  } catch (error) {
 10    show trade error;
 11  } finally {
 12    setLoading(false);
 13  }
}
```

**Control-flow graph:** Nodes =
`{1,2,3,4,5,6,7,8,9,10,11,12}`. Edges:
`1→2, 2→3, 2→11, 3→4, 3→11, 4→5, 5→6, 6→7, 6→9, 7→8, 8→11,
9→10, 10→11, 11→12`.

There are three decision points (quantity validation, coin selection, and
success/failure of the API call), so the cyclomatic complexity is:
`V(G) = decision nodes + 1 = 3 + 1 = 4`. Four independent paths must be
covered.

| Path # | Path description | Input values / setup | Expected result |
|---|---|---|---|
| P1 | Invalid quantity exits before coin check: `1-2-11-12` | Quantity `0`, no coin | Validation error; API not called; loading is not enabled |
| P2 | Valid quantity but no coin: `1-2-3-11-12` | Quantity `1`, no coin | Coin-selection error; API not called |
| P3 | Successful API path: `1-2-3-4-5-6-7-8-11-12` | Quantity `1`, coin selected, API resolves with `newBalance` | Balance updates; success notification, quantity clear, callback, and loading reset occur |
| P4 | Failed API path: `1-2-3-4-5-6-9-10-11-12` | Quantity `1`, coin selected, API rejects | Error notification; no balance update; loading reset occurs |

These paths cover every executable statement and both outcomes of each
decision in the frontend module.

### B.9 Integration Test Cases

**Integration strategy:** Incremental bottom-up for the trade feature. First
verify the API helper and `TradePanel` with a mocked `executeTrade`; then
replace the mock with the authenticated backend endpoint; finally verify the
trade result across portfolio and transaction-history APIs.

**Stubs/drivers used:** Mock `executeTrade` response/rejection for component
tests; a test user registered with a unique email and the documented initial
balance of `$10,000`; a market-data fixture such as
`{ id: "bitcoin", symbol: "BTC", name: "Bitcoin", price: 60000 }`; and a
controllable backend environment. The fixture price is a test value, not a
claim about the live market price. No production account or real funds may be
used.

| TC ID | Integration step | Description | Expected result |
|---|---|---|---|
| TC-INT-01 | Step 1: component + API helper | Submit a valid BUY with a selected coin and mock a successful response containing `newBalance`. | Payload contains `cryptoId`, `symbol`, `name`, `type`, and numeric `quantity`; balance and success UI update once. |
| TC-INT-02 | Step 2: frontend + authenticated backend | Execute a BUY for `1 BTC` using a test user whose starting balance is `$10,000`. | JWT is accepted; `newBalance` is displayed; quantity clears. Exact balance depends on backend execution price. |
| TC-INT-03 | Step 3: trade + portfolio/history APIs | After a successful BUY, open Portfolio and History. | Balance, holding, and one BUY transaction reflect the accepted trade. |

### B.10 System Test Cases (End-to-End, Black-Box)

| TC ID | Scenario | Steps | Expected result |
|---|---|---|---|
| TC-SYS-01 | New user completes a simulated BUY | Register with a unique email and password of at least 6 characters; confirm `$10,000.00`; select BTC; enter `1`; click Buy; open Portfolio and History. | BUY succeeds when backend is available; balance is `$10,000.00 - (1 × execution price)`; holding and BUY transaction appear. |
| TC-SYS-02 | Invalid quantity is rejected | Select BTC; submit `0`, blank, and non-numeric quantity. | `Enter a valid quantity` appears; no trade request is sent; account state is unchanged. |
| TC-SYS-03 | Failed trade is handled | Select BTC; enter `1`; force `POST http://localhost:5000/api/trade` to fail. | `Trade failed` or the server message appears; loading ends; no success toast or balance update occurs. |

### B.11 Test Deliverables

- Completed test plan document.
- Component/API integration test cases and test data.
- Test execution and pass/fail results log.
- Defect reports containing reproduction steps, expected result, actual result,
  severity, and evidence.
- End-to-end test evidence for balance, portfolio, and history state.
- Test summary report with open-risk and regression status.

### B.12 Suspension and Resumption Criteria

Testing is suspended when a blocker prevents execution of the core workflow,
including an unavailable authentication service, an unavailable `/api/trade`
endpoint, inability to create a test account, application startup failure, or
data corruption that makes results unreliable. Testing is also suspended if a
critical defect can create a false successful trade or mutate an account more
than once for a single submission.

Testing resumes after the environment is restored, test data is reset to the
documented `$10,000` test-user baseline, and the Test Lead confirms that the
blocker is fixed. The failed
test and the affected regression set must be re-executed before continuing with
new scenarios.

### B.13 Approval

| Name | Role | Signature | Date |
|---|---|---|---|
| ____________________ | Test Lead | ____________________ | ____________________ |
| ____________________ | Project Manager | ____________________ | ____________________ |
| ____________________ | Client / End-user Representative | ____________________ | ____________________ |

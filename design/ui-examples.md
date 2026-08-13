# API Documentation AI — UI Example Design (Wireframes)

## 1. Login Page

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ⚡ API Doc AI                           │
│      AI-powered API Documentation Platform          │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │              Sign In                          │  │
│  │                                               │  │
│  │  Email                                        │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ user@example.com                        │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  Password                                     │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ ••••••••••••                            │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │              Sign In                    │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  Don't have an account? Register              │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2. Projects Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚡ API Doc AI          Projects          [John Doe ▼]  [Logout]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  My Projects                              [ + New Project ]         │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │ 💳 payment-service   │  │ 👤 user-service       │                │
│  │                      │  │                      │                │
│  │ 24 endpoints         │  │ 18 endpoints         │                │
│  │ Java Spring Boot     │  │ Java Spring Boot     │                │
│  │ Status: ✅ Ready     │  │ Status: ⟳ Analyzing  │                │
│  │                      │  │                      │                │
│  │ Last analyzed: 2h ago│  │ Started: just now    │                │
│  │                      │  │                      │                │
│  │ [ Open ] [ Delete ]  │  │ [ Open ] [ Delete ]  │                │
│  └──────────────────────┘  └──────────────────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. New Project Modal

```
┌─────────────────────────────────────────────────────┐
│  Create New Project                            [✕]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Project Name                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ payment-service                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Description (optional)                             │
│  ┌─────────────────────────────────────────────┐   │
│  │ Payment processing microservice             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Source                                             │
│  ┌──────────────────┐  ┌──────────────────────┐    │
│  │  🔗 GitHub URL   │  │  📁 Upload Files     │    │
│  └──────────────────┘  └──────────────────────┘    │
│                                                     │
│  GitHub Repository URL                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ https://github.com/org/payment-service      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  GitHub Token (optional, for private repos)         │
│  ┌─────────────────────────────────────────────┐   │
│  │ ghp_xxxxxxxxxxxx                            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│              [ Cancel ]  [ Analyze ]                │
└─────────────────────────────────────────────────────┘
```

---

## 4. Project Detail — API Explorer

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚡ API Doc AI    payment-service    [Explorer] [AI] [Tests] [Export]  │
├──────────────────┬──────────────────────────────────────────────────────┤
│                  │                                                      │
│  ENDPOINTS  (24) │  POST /payments                                      │
│                  │  ─────────────────────────────────────────────────  │
│  GET  /users     │  Creates a new payment transaction                   │
│  GET  /users/{id}│                                                      │
│  POST /users     │  Authentication:  🔐 JWT Bearer Token                │
│                  │                                                      │
│  ─────────────── │  Path Parameters:  none                              │
│                  │                                                      │
│  GET  /payments  │  Request Body  (application/json)                    │
│  GET  /payments/ │  ┌──────────────────────────────────────────────┐   │
│       {id}       │  │  PaymentRequest                              │   │
│  POST /payments  │  │  ● amount    Integer   required              │   │
│  DELETE          │  │  ● currency  String    required  (INR, USD)  │   │
│  /payments/{id}  │  │  ○ note      String    optional              │   │
│                  │  └──────────────────────────────────────────────┘   │
│  ─────────────── │                                                      │
│                  │  Response  201 Created                               │
│  Stats           │  ┌──────────────────────────────────────────────┐   │
│  GET    12       │  │  PaymentResponse                             │   │
│  POST    7       │  │  ● paymentId  String                         │   │
│  PUT     3       │  │  ● status     String  (SUCCESS, FAILED)      │   │
│  DELETE  2       │  └──────────────────────────────────────────────┘   │
│                  │                                                      │
│                  │  [ 🚀 Try It ]  [ 🧪 Generate Tests ]               │
│                  │                                                      │
└──────────────────┴──────────────────────────────────────────────────────┘
```

---

## 5. API Playground

```
┌─────────────────────────────────────────────────────────────────────────┐
│  POST /payments — Playground                                            │
├──────────────────────────────────────┬──────────────────────────────────┤
│  REQUEST                             │  RESPONSE                        │
│                                      │                                  │
│  Authentication                      │  Status                          │
│  ┌────────────────────────────────┐  │  ┌──────────────────────────┐   │
│  │ Bearer  [__________________]   │  │  │  201 Created  ✅         │   │
│  └────────────────────────────────┘  │  └──────────────────────────┘   │
│                                      │                                  │
│  Headers                             │  Response Body                   │
│  Content-Type: application/json      │  ┌──────────────────────────┐   │
│                                      │  │ {                        │   │
│  Request Body                        │  │   "paymentId": "P123",   │   │
│  ┌────────────────────────────────┐  │  │   "status": "SUCCESS",   │   │
│  │ {                              │  │  │   "createdAt": "2024..." │   │
│  │   "amount": 1000,              │  │  │ }                        │   │
│  │   "currency": "INR",           │  │  └──────────────────────────┘   │
│  │   "note": "Test payment"       │  │                                  │
│  │ }                              │  │  Response Time:  142ms           │
│  └────────────────────────────────┘  │                                  │
│                                      │  [ Copy Response ]               │
│  [ ▶ Execute ]                       │                                  │
└──────────────────────────────────────┴──────────────────────────────────┘
```

---

## 6. AI Assistant

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚡ AI Assistant — payment-service  (API Doc AI)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Suggested Questions:                                                   │
│  [ How do I create a payment? ]  [ What auth does this API use? ]       │
│  [ Generate curl for POST /payments ]  [ What fields are required? ]    │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🤖  Hello! I'm your API assistant for payment-service.                 │
│      I can answer questions, generate code examples, and help           │
│      you understand this API. What would you like to know?              │
│                                                                         │
│  👤  How do I create a payment?                                         │
│                                                                         │
│  🤖  To create a payment, send a POST request to /payments.             │
│                                                                         │
│      Required fields:                                                   │
│      • amount (integer) — payment amount in smallest currency unit      │
│      • currency (string) — e.g. "INR", "USD"                           │
│                                                                         │
│      Example curl:                                                      │
│      ┌──────────────────────────────────────────────────────────────┐  │
│      │ curl -X POST http://api.example.com/payments \               │  │
│      │   -H "Authorization: Bearer YOUR_TOKEN" \                    │  │
│      │   -H "Content-Type: application/json" \                      │  │
│      │   -d '{"amount": 1000, "currency": "INR"}'                   │  │
│      └──────────────────────────────────────────────────────────────┘  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐  [ Send ▶ ]   │
│  │ Ask anything about this API...                      │               │
│  └─────────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Test Generation

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🧪 Test Generation — POST /payments                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Framework:  [ JUnit 5 ▼ ]          [ Generate Tests ]                 │
│                                                                         │
├──────────────────────────┬──────────────────────────────────────────────┤
│  TEST CASES              │  GENERATED CODE                              │
│                          │                                              │
│  ✅ Valid payment         │  @Test                                       │
│  ✅ Missing amount        │  @DisplayName("Valid payment creation")      │
│  ✅ Negative amount       │  void testValidPayment() {                   │
│  ✅ Unsupported currency  │    PaymentRequest req = new PaymentRequest() │
│  ✅ Missing auth token    │    req.setAmount(1000);                      │
│  ✅ Invalid auth token    │    req.setCurrency("INR");                   │
│  ✅ Duplicate payment     │                                              │
│  ✅ Database failure      │    ResponseEntity<PaymentResponse> res =     │
│                          │      restTemplate.postForEntity(             │
│  8 test cases generated  │        "/payments", req,                     │
│                          │        PaymentResponse.class);               │
│                          │                                              │
│                          │    assertEquals(201,                         │
│                          │      res.getStatusCodeValue());              │
│                          │    assertNotNull(res.getBody()               │
│                          │      .getPaymentId());                       │
│                          │  }                                           │
│                          │                                              │
│                          │  [ 📋 Copy ]  [ ⬇ Download .java ]          │
└──────────────────────────┴──────────────────────────────────────────────┘
```

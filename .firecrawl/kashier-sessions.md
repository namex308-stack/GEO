![Kashier Logo](https://developers.kashier.io/kashier.png)

# Payment Sessions

Kashier's Payment Sessions make transactions more secure and efficient. With a simple API call, you can create payments without exposing sensitive data in query strings. Plus, session history tracking lets you monitor every action in real time.

# Create payment session

| Endpoint | Value |
| --- | --- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/sessions](https://developers.kashier.io/payment/payment-sessions) |
| LIVE-URL | [https://api.kashier.io/v3/payment/sessions](https://developers.kashier.io/payment/payment-sessions) |
| Method | POST |

Copy

curl

```curl
1curl --location 'https://api.kashier.io/v3/payment/sessions'
2--header 'Authorization: {{secret_key}}'
3--header 'api-key: {{api_key}}'
4--header 'Content-Type: application/json'
5--data '{
6  "expireAt": "2025-01-28T17:27:32.359Z",
7  "maxFailureAttempts": 3,
8  "paymentType": "credit",
9  "amount": "1.00",
10  "currency": "EGP",
11  "order": "8f64saf6sa4",
12  "merchantRedirect": "https://example.com/redirect",
13  "display": "en",
14  "type": "one-time",
15  "allowedMethods": "card,wallet",
16  "redirectMethod": null,
17  "iframeBackgroundColor": "#FFFFFF",
18  "metaData": {
19      "customKey": "customValue",
20      "displayNotes": {"key": "value"}
21  },
22  "merchantId": "MID-XXXX-XXX",
23  "failureRedirect": false,
24  "brandColor": "#FF5733",
25  "defaultMethod": "card",
26  "description": "Payment for order ORD123456",
27  "manualCapture": false,
28  "customer": {
29      "email": "john@gmail.com",
30      "reference": "894321"
31  },
32  "saveCard": "optional",
33  "retrieveSavedCard": true,
34  "interactionSource": "ECOMMERCE",
35  "enable3DS": true,
36  "serverWebhook": "https://your_webhook_url",
37  "notes": "Special handling required"
38}'
```

Click here to expand

# Headers

| Key | Description |
| --- | --- |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](https://developers.kashier.io/dashboard-api/authentication). |
| api-key | You can obtain your `api-key` from the merchant dashboard under the **Integrations** section. Please note that the API key is different for the _live_ and _test_ environments, so make sure to use the correct one for each. |

# Body Description

| Parameter | Description | Required |
| --- | --- | --- |
| expireAt (string) | When the payment session expires. | TRUE |
| maxFailureAttempts (integer) | Maximum number of payment attempts. | TRUE |
| amount (string) | Order amount, e.g., \`100\`. | TRUE |
| currency (string) | Order currency, e.g., \`EGP\`. | TRUE |
| orderId (string) | Unique order identifier. | TRUE |
| merchantId (string) | Merchant account number or merchant ID, e.g., \`MID-123-123\`. | TRUE |
| mode (string) | Mode of operation [test or live](https://developers.kashier.io/getting-started/api-keys#testandlivemodes), e.g., \`mode="test"\`. | TRUE |
| metaData (string) | Order metadata must be an encoded \`JSON\` string. Pass it through \`JSON.stringify()\` and \`encodeURIComponent()\`. | FALSE |
| description (string) | Order description; must be less than 120 characters. | FALSE |
| allowedMethods (string) | Defines allowed [payment methods](https://developers.kashier.io/payment/payment-sessions#). Default: \`card, bank\_installments, wallet, bnpl\`. If you want to display only a specific provider (for example, Valu or QNB), you can do so by specifying it within array brackets alongside its payment method. For example: bnpl\[valu\], bank\_installments\[qnb\], and so on. | FALSE |
| metaData.displayNote | It is an object that key:value  pair "metaData": {"customKey": "customValue","displayNotes": {"key": "value"}}, The note will be displayed on the PaymentUI screen. | FALSE |
| defaultMethod (string) | To determine which method you want PaymentUI to open on it, By default PaymentUI opens on card method. defaultMethod accept the following pattern "method,provider/abbreviation". Example, you want PaymentUI to open on installment method, so defaultMethod value should be bank\_installments. But if you want to open PaymentUI on certian instalment plans of NBE bank the value of defaultMethod should be bank\_installments,NBE. | FALSE |
| merchantRedirect (string) | merchantRedirect should be "URI encoded. urlencode(https://www.your\_website.com/redirect) | TRUE |
| serverWebhook (string) | Pass an endpoint to receive server-to-server notification on your application is as easy as creating a new page that accepts unauthenticated POST requests. The event object is sent as JSON in the request body. [Webhook](https://developers.kashier.io/payment/webhook) | FALSE |
| redirectMethod (string) | The Redirection method after payment, Default method is get, ex:- redirectMethod="post" | FALSE |
| failureRedirect (string) | To choose to redirect after first payment failure or not. Its value is TRUE OR FALSE, Default value is TRUE | FALSE |
| connectedAccount (string) | Using in case of make a payments on behalf of your [Connected Account](https://developers.kashier.io/features/connected-accounts) by passing Sub Merchant/Connected Account Merchant Id to connectedAccount attribute. connectedAccount="MID-452-644" | FALSE |
| type (string) | Defines the type of Kashier origin. Default: \`external\`. | TRUE |
| brandColor (string) | Specifies branding color using a hex or rgba value. Default: \`rgba(45, 164, 78, 0.9)\`. | FALSE |
| display (string) | Specifies the display language of the I-frame. Options: \`ar\` or \`en\`. | TRUE |
| manualCapture (bool) | \`TRUE\`: Authorize first, then capture/release. \`FALSE\`: Direct capture without authorization. | FALSE |
| customer (string) | it is an object that contains the customer information.Please note that it should include customer.reference which will be used to link merchant's customer with the payment's customer. and it only should be included when saveCard is optional or forced "customer": {"email": "john@gmail.com ","reference": "65489463"} | FALSE |
| saveCard (string) | Defines if card information is saved. Options: \`optional\` or \`forced\`. | FALSE |
| interactionSource (string) | Must be \`MOTO\` or \`ECOMMERCE\` when using a token or saving a card for repeat payments. | FALSE |
| enable3DS (bool) | \`TRUE\`: Enables 3DS for saved card payments. \`FALSE\`: Disables 3DS. | FALSE |
| notes (string) | Add any additional information about this payment. This could include special instructions, or context for the recipient. | FALSE |

# Response Structure

Copy

json

```json
1{
2 "status":"CREATED",
3 "failureAttempts":0,
4 "capturedAmount":0,
5 "refundedAmount":0,
6 "_id":"67adc07584f10c00121f6739",
7 "merchantId":"MID-XXXX-XXXX",
8 "expireAt":"2025-01-28T17:27:32.359Z",
9 "maxFailureAttempts":3,
10 "paymentParams":{
11    "display":"en",
12    "paymentType":"credit",
13    "amount":"1.00",
14    "currency":"EGP",
15    "order":"as8f64a5",
16    "merchantRedirect":"https://example.com/redirect",
17    "type":"one-time",
18    "allowedMethods":"card,wallet",
19    "redirectMethod":null,
20    "iframeBackgroundColor":"#FFFFFF",
21    "metaData":{
22       "customKey":"customValue",
23       "displayNotes":{
24          "key":"value",
25       }
26    },
27    "failureRedirect":false,
28    "brandColor":"#FF5733",
29    "defaultMethod":"card",
30    "description":"Payment for order ORD123456",
31    "manualCapture":false,
32    "customer":{
33       "email":"john@gmail.com",
34       "reference":"894321"
35    },
36    "saveCard":"optional",
37    "retrieveSavedCard":true,
38    "interactionSource":"ECOMMERCE",
39    "enable3DS":true,
40    "serverWebhook":"https://your_webhook_url",
41    "notes":"Special handling required",
42    "hash":"3a657fb8e653c024a4abdd31b084082c8bbd4d9438f98451ca42a4abeb49766d",
43    "storeName":"Demo",
44    "store":"Demo"
45 },
46 "apiKey":"{{merchant_api_key}}",
47 "history":[\
48    {\
49       "status":"CREATED",\
50       "date":"2025-02-13T09:50:45.360Z"\
51    }\
52 ],
53 "webhookNotifications":[],
54 "createdAt":"2025-02-13T09:50:45.363Z",
55 "updatedAt":"2025-02-13T09:50:45.363Z",
56 "__v":0,
57 "sessionUrl":"https://payments.kashier.io/session/67adc07584f10c00121f6739?mode=test"
58}
```

Click here to expand

Note: sessionUrl is the URL that will be used to redirect the customer to the payment page. you can use it as src attribute in a link or iframe.

Copy

html

```html
1<iframe src="https://payments.kashier.io/session/67adc07584f10c00121f6739?mode=test"></iframe>
```

# Get payment session

| Endpoint | Value |
| --- | --- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/sessions/:sessionId/payment](https://developers.kashier.io/payment/payment-sessions) |
| LIVE-URL | [https://api.kashier.io/v3/payment/sessions/:sessionId/payment](https://developers.kashier.io/payment/payment-sessions) |
| Method | GET |

Copy

curl

```curl
1curl --location 'https://test-api.kashier.io/v3/payment/sessions/:sessionId/payment'
2  --header 'Authorization: {{secret_key}}'
```

# Headers

| Key | Description |
| --- | --- |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](https://developers.kashier.io/dashboard-api/authentication). |

# Response Structure

Copy

json

```json
1{
2 "message":"success",
3 "data":{
4    "sessionId":"67ada35e9d5266001295b153",
5    "status":"PENDING",
6    "createdAt":"2025-02-13T07:46:38.018Z",
7    "updatedAt":"2025-02-13T09:57:23.780Z",
8    "merchantId":"MID-XXXX-XXXX",
9    "merchantOrderId":"testOrder123",
10    "amount":"1.00",
11    "currency":"EGP",
12    "method":"card",
13    "orderId":"NA",
14    "paymentChannel":"ONLINE",
15    "rfsDate":"NA",
16    "lastTransactionType":"NA",
17    "issuerAuthorizationCode":"NA",
18    "metaData":{
19       "customKey":"customValue",
20       "displayNotes":{
21          "key":"value",
22       }
23    },
24    "customer":{
25       "email":"john@gmail.com",
26       "reference":"894321"
27    },
28    "history":[\
29      {\
30          "status":"OPENED",\
31          "date":"2025-02-13T09:57:23.783Z"\
32      },\
33    ]
34 }
35}
```

Click here to expand

# Response Description

| Parameter | Description | Required |
| --- | --- | --- |
| sessionId (string) | A unique identifier for the payment session. | TRUE |
| status (integer) | The current status of the payment session (e.g., 'PENDING'). | TRUE |
| createdAt (string) | (string, ISO 8601 timestamp) – The date and time when the session was created. | TRUE |
| updatedAt (string) | (string, ISO 8601 timestamp) – The date and time when the session was updated. | TRUE |
| merchantId (string) | The unique identifier of the merchant initiating the session. | TRUE |
| merchantOrderId (string) | The merchant's custom order reference. | TRUE |
| amount (string) | The payment amount in the specified currency. | TRUE |
| currency (string) | The currency of the payment (e.g., "EGP"). | TRUE |
| method (string) | The payment method used (e.g., 'card'). | FALSE |
| orderId (string) | The unique order identifier (may be "NA" if not applicable). | FALSE |
| paymentChannel (string) | The payment channel used (e.g., "ONLINE"). | FALSE |
| rfsDate | Reserved for future settlement date (may be "NA" if not applicable). | FALSE |
| lastTransactionType (string) | The type of the last transaction (may be "NA" if not applicable). | FALSE |
| issuerAuthorizationCode (string) | The authorization code from the card issuer (may be "NA" if not applicable). | TRUE |
| metaData (string) | Contains custom metadata related to the session. | FALSE |
| metaData.displayNotes (string) | A nested object for additional display notes. it is a sample key-value pair for display notes. | FALSE |
| customer (string) | it is an object that contains the customer information.Please note that it should include customer.reference which will be used to link merchant's customer with the payment's customer. and it only should be included when saveCard is optional or forced "customer": {"email": "john@gmail.com ","reference": "65489463"} | FALSE |
| history (string) | A list of status changes and actions taken on the session. | FALSE |
| history.status (string) | The action performed on the session (e.g., "OPENED") | FALSE |
| history.date | The timestamp of the action. | FALSE |

[**Payment - Previous**  **Payment UI Builder**](https://developers.kashier.io/payment/payment-ui-builder)

[**Next - Payment**  **Apple pay native button**](https://developers.kashier.io/payment/apple-pay)

CONTENTS
Create Payment Session
Get Payment Session
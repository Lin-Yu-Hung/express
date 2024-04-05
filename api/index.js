const express = require('express');
const Base64 = require('crypto-js/enc-base64');
const { HmacSHA256 } = require('crypto-js');
const axios = require('axios');
const cors = require('cors')
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors())


const createHeader = (uri, params) => {
    const ChannelSecret = "080c23a52d12238f48e2d38044a2a09d";
    const nonce = parseInt(new Date().getTime() / 1000);
    const string = `${ChannelSecret}${uri}${JSON.stringify(params)}${nonce}`;
    const hmacDigest = Base64.stringify(HmacSHA256(string, ChannelSecret));

    return {
        "Content-Type": "application/json",
        'X-LINE-ChannelId': '2004505560',
        'X-LINE-Authorization': hmacDigest,
        "X-LINE-Authorization-Nonce": nonce
    }
}

// 處理 POST 請求
app.post('/linepay/request', async (req, res) => {

    const requestBody = req.body;
    console.log("🚀  requestBody:", requestBody)
    const requestUri = "/v3/payments/request";
    const headers = createHeader(requestUri, requestBody);
    try {
        const response = await axios.post(`https://sandbox-api-pay.line.me${requestUri}`, requestBody, { headers });
        res.json(response.data);
    } catch (error) {
        res.status(error.response.status).json(error.response.data);
    }
});
app.post('/payments/confirm', async (req, res) => {
    const requestBody = req.body;
    console.log("🚀  requestBody:", requestBody)
    const { transactionId, amount, currency } = requestBody;
    const requestUri = `/v3/payments/${transactionId}/confirm`;
    const params = { amount, currency };
    const headers = createHeader(requestUri, params);
    try {
        const response = await axios.post(`https://sandbox-api-pay.line.me${requestUri}`, params, { headers });
        res.json(response.data);
    } catch (error) {
        res.status(error.response.status).json(error.response.data);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

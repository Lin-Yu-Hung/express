const express = require('express');
const Base64 = require('crypto-js/enc-base64');
const { HmacSHA256 } = require('crypto-js');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3000;

const { Server } = require('socket.io');
const { createServer } = require('node:http');
// 建立 HTTP 伺服器
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // 或者指定你的前端 URL
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

io.on('connection', (socket) => {
    socket.on('joinRoom', (info) => {
        const { name, roomId } = info;
        socket.join(roomId);
        io.to(roomId).emit('joinFinish', `${name}加入了聊天室!`);

    });
    socket.on('sendMessage', (messageInfo) => {
        const { roomId, message } = messageInfo
        io.to(roomId).emit('returnMessage', message);
    });

});


app.use(express.json());
app.use(cors());


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
    };
};

app.post('/linepay/request', async (req, res) => {
    const requestBody = req.body;
    console.log("🚀  requestBody:", requestBody);
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
    console.log("🚀  requestBody:", requestBody);
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


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

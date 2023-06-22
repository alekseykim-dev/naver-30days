const https = require('https');
const dotenv = require('dotenv');
dotenv.config();
const crypto = require('crypto');

class RestApi {
  constructor(baseUrl, apiKey, secretKey, customerId) {
    this.baseUrl = "https://api.searchad.naver.com";
    this.apiKey = "01000000007f8f703908cf21b8ad54304563db90dc4edfbb690687ced69983fcdbc8b59d2c";
    this.secretKey = "AQAAAAB/j3A5CM8huK1UMEVj25DcQrI10fIypoKVXNY4SWyjeA==";
    this.customerId = "2913476";
  }

  generateSignature(timestamp, method, path) {
    const sign = `${timestamp}.${method}.${path}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(sign)
      .digest('base64');
    return signature;
  }

  getTimestamp() {
    return Math.round(new Date().getTime());
  }

  getHeader(method, uri) {
    const timestamp = this.getTimestamp();
    const header = {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Timestamp': timestamp,
      'X-API-KEY': this.apiKey,
      'X-Customer': this.customerId,
      'X-Signature': this.generateSignature(timestamp, method, uri)
    };
    return header;
  }

  buildHttpQuery(query) {
    if (Object.keys(query).length > 0) {
      const queryArray = [];
      for (const [key, value] of Object.entries(query)) {
        queryArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
      return queryArray.join('&');
    } else {
      return '';
    }
  }

  getTransactionId(header) {
    const headerRows = header.split('\n');
    for (let i = 0; i < headerRows.length; i++) {
      const fields = headerRows[i].split(':');
      if (fields.length < 2) {
        continue;
      }
      const name = fields[0].trim();
      const value = fields[1].trim();
      if (name === 'X-Transaction-ID') {
        return value;
      }
    }
    return 'unknown';
  }

  parseResponse(response) {
    if (response.length > 0) {
      const result = response.split('\r\n\r\n', 2);
      if (result.length < 2) {
        console.log('Invalid response body! It has no HEADER and BODY!');
        return {};
      }
      const header = result[0];
      const body = result[1];
      const transactionId = this.getTransactionId(header);
      const jsonBody = JSON.parse(body);
      return { transactionId: transactionId, json: jsonBody };
    }
    return {};
  }

  request(method, uri, data = null, query = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: this.getHeader(method, uri)
      };

      const url = this.baseUrl + uri + (Object.keys(query).length === 0 ? '' : `?${this.buildHttpQuery(query)}`);

      const req = https.request(url, options, (res) => {
        let response = '';
        res.on('data', (chunk) => {
          response += chunk;
        });
        res.on('end', () => {
          const code = res.statusCode;
          const parsedResponse = this.parseResponse(response);

          if (code) {
            console.log('HTTP Status:', code);
          } else {
            reject('No HTTP code was returned');
          }

          if (parsedResponse.transactionId) {
            console.log('Transaction-ID:', parsedResponse.transactionId);
          }

          resolve(parsedResponse.json);
        });
      });

      req.on('error', (error) => {
        console.log('Error:', error.message);
        reject('Failed to request');
      });

      if (data !== null) {
        const dataString = JSON.stringify(data);
        console.log('Request:', dataString);
        req.write(dataString);
      }

      req.end();
    });
  }

  GET(uri) {
    return this.request('GET', uri, null);
  }
}

module.exports = RestApi;
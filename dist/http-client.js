"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.candleFields = void 0;

var _crypto = _interopRequireDefault(require("crypto"));

var _lodash = _interopRequireDefault(require("lodash.zipobject"));

require("isomorphic-fetch");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _construct(Parent, args, Class) { if (isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var BASE = 'https://api.binance.com';
var FUTURES = 'https://fapi.binance.com';

var defaultGetTime = function defaultGetTime() {
  return Date.now();
};
/**
 * Build query string for uri encoded url based on json object
 */


var makeQueryString = function makeQueryString(q) {
  return q ? "?".concat(Object.keys(q).map(function (k) {
    return "".concat(encodeURIComponent(k), "=").concat(encodeURIComponent(q[k]));
  }).join('&')) : '';
};

var RetryError =
/*#__PURE__*/
function (_Error) {
  _inherits(RetryError, _Error);

  function RetryError(message, waitTimeInS) {
    var _this;

    _classCallCheck(this, RetryError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(RetryError).call(this, message));
    _this.waitTimeInS = waitTimeInS;
    return _this;
  }

  return RetryError;
}(_wrapNativeSuper(Error));
/**
 * Finalize API response
 */


var sendResult = function sendResult(call) {
  return call.then(function (res) {
    // If response is ok, we can safely assume it is valid JSON
    if (res.ok) {
      return res.json().then(function (json) {
        return {
          data: json,
          weight: res.headers.has('X-MBX-USED-WEIGHT') ? res.headers.get('X-MBX-USED-WEIGHT') : '0'
        };
      });
    } // Errors might come from the API itself or the proxy Binance is using.
    // For API errors the response will be valid JSON,but for proxy errors
    // it will be HTML


    return res.text().then(function (text) {
      var error;

      try {
        var json = JSON.parse(text); // The body was JSON parseable, assume it is an API response error

        error = new Error(json.msg || "".concat(res.status, " ").concat(res.statusText));
        error.code = json.code;
        error.url = res.url;
      } catch (e) {
        // The body was not JSON parseable, assume it is proxy error
        error = new Error("".concat(res.status, " ").concat(res.statusText, " ").concat(text));
        error.response = res;
        error.responseText = text;
      }

      if (res.status === 418 || res.status === 429) {
        var retryAfter = res.headers.get('Retry-After');
        throw new RetryError(error.message, Number(retryAfter));
      }

      throw error;
    });
  });
};
/**
 * Util to validate existence of required parameter(s)
 */


var checkParams = function checkParams(name, payload) {
  var requires = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  if (!payload) {
    throw new Error('You need to pass a payload object.');
  }

  requires.forEach(function (r) {
    if (!payload[r] && isNaN(payload[r])) {
      throw new Error("Method ".concat(name, " requires ").concat(r, " parameter."));
    }
  });
  return true;
};
/**
 * Make public calls against the api
 *
 * @param {string} path Endpoint path
 * @param {object} data The payload to be sent
 * @param {string} method HTTB VERB, GET by default
 * @param {object} headers
 * @returns {object} The api response
 */


var publicCall = function publicCall(_ref) {
  var endpoints = _ref.endpoints;
  return function (path, data) {
    var method = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'GET';
    var headers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    return sendResult(fetch("".concat(!path.includes('/fapi') ? endpoints.base : endpoints.futures).concat(path).concat(makeQueryString(data)), {
      method: method,
      json: true,
      headers: headers
    }));
  };
};
/**
 * Factory method for partial private calls against the api
 *
 * @param {string} path Endpoint path
 * @param {object} data The payload to be sent
 * @param {string} method HTTB VERB, GET by default
 * @returns {object} The api response
 */


var keyCall = function keyCall(_ref2) {
  var apiKey = _ref2.apiKey,
      pubCall = _ref2.pubCall;
  return function (path, data) {
    var method = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'GET';

    if (!apiKey) {
      throw new Error('You need to pass an API key to make this call.');
    }

    return pubCall(path, data, method, {
      'X-MBX-APIKEY': apiKey
    });
  };
};
/**
 * Factory method for private calls against the api
 *
 * @param {string} path Endpoint path
 * @param {object} data The payload to be sent
 * @param {string} method HTTB VERB, GET by default
 * @param {object} headers
 * @returns {object} The api response
 */


var privateCall = function privateCall(_ref3) {
  var apiKey = _ref3.apiKey,
      apiSecret = _ref3.apiSecret,
      endpoints = _ref3.endpoints,
      _ref3$getTime = _ref3.getTime,
      getTime = _ref3$getTime === void 0 ? defaultGetTime : _ref3$getTime,
      pubCall = _ref3.pubCall;
  return function (path) {
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var method = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'GET';
    var noData = arguments.length > 3 ? arguments[3] : undefined;
    var noExtra = arguments.length > 4 ? arguments[4] : undefined;

    if (!apiKey || !apiSecret) {
      throw new Error('You need to pass an API key and secret to make authenticated calls.');
    }

    return (data && data.useServerTime ? pubCall('/api/v3/time').then(function (r) {
      return r.serverTime;
    }) : Promise.resolve(getTime())).then(function (timestamp) {
      if (data) {
        delete data.useServerTime;
      }

      var signature = _crypto.default.createHmac('sha256', apiSecret).update(makeQueryString(_objectSpread({}, data, {
        timestamp: timestamp
      })).substr(1)).digest('hex');

      var newData = noExtra ? data : _objectSpread({}, data, {
        timestamp: timestamp,
        signature: signature
      });
      return sendResult(fetch("".concat(!path.includes('/fapi') ? endpoints.base : endpoints.futures).concat(path).concat(noData ? '' : makeQueryString(newData)), {
        method: method,
        headers: {
          'X-MBX-APIKEY': apiKey
        },
        json: true
      }));
    });
  };
};

var candleFields = ['openTime', 'open', 'high', 'low', 'close', 'volume', 'closeTime', 'quoteVolume', 'trades', 'baseAssetVolume', 'quoteAssetVolume'];
/**
 * Get candles for a specific pair and interval and convert response
 * to a user friendly collection.
 */

exports.candleFields = candleFields;

var _candles = function candles(pubCall, payload) {
  var endpoint = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '/api/v3/klines';
  return checkParams('candles', payload, ['symbol']) && pubCall(endpoint, _objectSpread({
    interval: '5m'
  }, payload)).then(function (candles) {
    return candles.map(function (candle) {
      return (0, _lodash.default)(candleFields, candle);
    });
  });
};
/**
 * Create a new order wrapper for market order simplicity
 */


var _order = function order(privCall) {
  var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var url = arguments.length > 2 ? arguments[2] : undefined;
  var newPayload = ['LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'].includes(payload.type) || !payload.type ? _objectSpread({
    timeInForce: 'GTC'
  }, payload) : payload;
  var requires = ['symbol', 'side'];

  if (!(newPayload.type === 'MARKET' && newPayload.quoteOrderQty)) {
    requires.push('quantity');
  }

  return checkParams('order', newPayload, requires) && privCall(url, _objectSpread({
    type: 'LIMIT'
  }, newPayload), 'POST');
};

var _orderOco = function orderOco(privCall) {
  var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var url = arguments.length > 2 ? arguments[2] : undefined;
  var newPayload = payload.stopLimitPrice && !payload.stopLimitTimeInForce ? _objectSpread({
    stopLimitTimeInForce: 'GTC'
  }, payload) : payload;
  return checkParams('order', newPayload, ['symbol', 'side', 'quantity', 'price', 'stopPrice']) && privCall(url, newPayload, 'POST');
};
/**
 * Zip asks and bids reponse from order book
 */


var _book = function book(pubCall, payload) {
  var endpoint = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '/api/v3/depth';
  return checkParams('book', payload, ['symbol']) && pubCall(endpoint, payload).then(function (_ref4) {
    var lastUpdateId = _ref4.lastUpdateId,
        asks = _ref4.asks,
        bids = _ref4.bids;
    return {
      lastUpdateId: lastUpdateId,
      asks: asks,
      bids: bids
    };
  });
};

var _aggTrades = function aggTrades(pubCall, payload) {
  var endpoint = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '/api/v3/aggTrades';
  return checkParams('aggTrades', payload, ['symbol']) && pubCall(endpoint, payload).then(function (trades) {
    return trades.map(function (trade) {
      return {
        aggId: trade.a,
        symbol: payload.symbol,
        price: trade.p,
        quantity: trade.q,
        firstId: trade.f,
        lastId: trade.l,
        timestamp: trade.T,
        isBuyerMaker: trade.m,
        wasBestPrice: trade.M
      };
    });
  });
};

var _default = function _default(opts) {
  var endpoints = {
    base: opts && opts.httpBase || BASE,
    futures: opts && opts.httpFutures || FUTURES
  };
  var pubCall = publicCall(_objectSpread({}, opts, {
    endpoints: endpoints
  }));
  var privCall = privateCall(_objectSpread({}, opts, {
    endpoints: endpoints,
    pubCall: pubCall
  }));
  var kCall = keyCall(_objectSpread({}, opts, {
    pubCall: pubCall
  }));
  return {
    ping: function ping() {
      return pubCall('/api/v3/ping').then(function () {
        return true;
      });
    },
    time: function time() {
      return pubCall('/api/v3/time').then(function (r) {
        return r.serverTime;
      });
    },
    exchangeInfo: function exchangeInfo() {
      return pubCall('/api/v3/exchangeInfo');
    },
    book: function book(payload) {
      return _book(pubCall, payload);
    },
    aggTrades: function aggTrades(payload) {
      return _aggTrades(pubCall, payload);
    },
    candles: function candles(payload) {
      return _candles(pubCall, payload);
    },
    trades: function trades(payload) {
      return checkParams('trades', payload, ['symbol']) && pubCall('/api/v3/trades', payload);
    },
    tradesHistory: function tradesHistory(payload) {
      return checkParams('tradesHitory', payload, ['symbol']) && kCall('/api/v3/historicalTrades', payload);
    },
    dailyStats: function dailyStats(payload) {
      return pubCall('/api/v3/ticker/24hr', payload);
    },
    prices: function prices(payload) {
      return pubCall('/api/v3/ticker/price', payload).then(function (r) {
        return (Array.isArray(r) ? r : [r]).reduce(function (out, cur) {
          return out[cur.symbol] = cur.price, out;
        }, {});
      });
    },
    avgPrice: function avgPrice(payload) {
      return pubCall('/api/v3/avgPrice', payload);
    },
    allBookTickers: function allBookTickers() {
      return pubCall('/api/v3/ticker/bookTicker').then(function (r) {
        return (Array.isArray(r) ? r : [r]).reduce(function (out, cur) {
          return out[cur.symbol] = cur, out;
        }, {});
      });
    },

    /**
     * Call unmanaged private call to Binance api; you need a key and secret
     */
    privateRequest: function privateRequest(method, url, payload) {
      return privCall(url, payload, method);
    },

    /**
     * Call unmanaged public call to Binance api
     */
    publicRequest: function publicRequest(method, url, payload) {
      return pubCall(url, payload, method);
    },
    order: function order(payload) {
      return _order(privCall, payload, '/api/v3/order');
    },
    orderOco: function orderOco(payload) {
      return _orderOco(privCall, payload, '/api/v3/order/oco');
    },
    orderTest: function orderTest(payload) {
      return _order(privCall, payload, '/api/v3/order/test');
    },
    getOrder: function getOrder(payload) {
      return privCall('/api/v3/order', payload);
    },
    cancelOrder: function cancelOrder(payload) {
      return privCall('/api/v3/order', payload, 'DELETE');
    },
    cancelOpenOrders: function cancelOpenOrders(payload) {
      return privCall('/api/v3/openOrders', payload, 'DELETE');
    },
    openOrders: function openOrders(payload) {
      return privCall('/api/v3/openOrders', payload);
    },
    allOrders: function allOrders(payload) {
      return privCall('/api/v3/allOrders', payload);
    },
    allOrdersOCO: function allOrdersOCO(payload) {
      return privCall('/api/v3/allOrderList', payload);
    },
    accountInfo: function accountInfo(payload) {
      return privCall('/api/v3/account', payload);
    },
    myTrades: function myTrades(payload) {
      return privCall('/api/v3/myTrades', payload);
    },
    withdraw: function withdraw(payload) {
      return privCall('/wapi/v3/withdraw.html', payload, 'POST');
    },
    withdrawHistory: function withdrawHistory(payload) {
      return privCall('/wapi/v3/withdrawHistory.html', payload);
    },
    depositHistory: function depositHistory(payload) {
      return privCall('/wapi/v3/depositHistory.html', payload);
    },
    depositAddress: function depositAddress(payload) {
      return privCall('/wapi/v3/depositAddress.html', payload);
    },
    tradeFee: function tradeFee(payload) {
      return privCall('/wapi/v3/tradeFee.html', payload);
    },
    assetDetail: function assetDetail(payload) {
      return privCall('/wapi/v3/assetDetail.html', payload);
    },
    capitalConfigs: function capitalConfigs() {
      return privCall('/sapi/v1/capital/config/getall');
    },
    capitalDepositAddress: function capitalDepositAddress(payload) {
      return privCall('/sapi/v1/capital/deposit/address', payload);
    },
    getDataStream: function getDataStream() {
      return privCall('/api/v3/userDataStream', null, 'POST', true);
    },
    keepDataStream: function keepDataStream(payload) {
      return privCall('/api/v3/userDataStream', payload, 'PUT', false, true);
    },
    closeDataStream: function closeDataStream(payload) {
      return privCall('/api/v3/userDataStream', payload, 'DELETE', false, true);
    },
    marginGetDataStream: function marginGetDataStream() {
      return privCall('/sapi/v1/userDataStream', null, 'POST', true);
    },
    marginKeepDataStream: function marginKeepDataStream(payload) {
      return privCall('/sapi/v1/userDataStream', payload, 'PUT', false, true);
    },
    marginCloseDataStream: function marginCloseDataStream(payload) {
      return privCall('/sapi/v1/userDataStream', payload, 'DELETE', false, true);
    },
    futuresGetDataStream: function futuresGetDataStream() {
      return privCall('/fapi/v1/listenKey', null, 'POST', true);
    },
    futuresKeepDataStream: function futuresKeepDataStream(payload) {
      return privCall('/fapi/v1/listenKey', payload, 'PUT', false, true);
    },
    futuresCloseDataStream: function futuresCloseDataStream(payload) {
      return privCall('/fapi/v1/listenKey', payload, 'DELETE', false, true);
    },
    marginAllOrders: function marginAllOrders(payload) {
      return privCall('/sapi/v1/margin/allOrders', payload);
    },
    marginOrder: function marginOrder(payload) {
      return _order(privCall, payload, '/sapi/v1/margin/order');
    },
    marginCancelOrder: function marginCancelOrder(payload) {
      return privCall('/sapi/v1/margin/order', payload, 'DELETE');
    },
    marginOpenOrders: function marginOpenOrders(payload) {
      return privCall('/sapi/v1/margin/openOrders', payload);
    },
    marginAccountInfo: function marginAccountInfo(payload) {
      return privCall('/sapi/v1/margin/account', payload);
    },
    marginMyTrades: function marginMyTrades(payload) {
      return privCall('/sapi/v1/margin/myTrades', payload);
    },
    futuresPing: function futuresPing() {
      return pubCall('/fapi/v1/ping').then(function () {
        return true;
      });
    },
    futuresTime: function futuresTime() {
      return pubCall('/fapi/v1/time').then(function (r) {
        return r.serverTime;
      });
    },
    futuresExchangeInfo: function futuresExchangeInfo() {
      return pubCall('/fapi/v1/exchangeInfo');
    },
    futuresBook: function futuresBook(payload) {
      return _book(pubCall, payload, '/fapi/v1/depth');
    },
    futuresAggTrades: function futuresAggTrades(payload) {
      return _aggTrades(pubCall, payload, '/fapi/v1/aggTrades');
    },
    futuresMarkPrice: function futuresMarkPrice(payload) {
      return pubCall('/fapi/v1/premiumIndex', payload);
    },
    futuresAllForceOrders: function futuresAllForceOrders(payload) {
      return pubCall('/fapi/v1/allForceOrders', payload);
    },
    futuresCandles: function futuresCandles(payload) {
      return _candles(pubCall, payload, '/fapi/v1/klines');
    },
    futuresTrades: function futuresTrades(payload) {
      return checkParams('trades', payload, ['symbol']) && pubCall('/fapi/v1/trades', payload);
    },
    futuresDailyStats: function futuresDailyStats(payload) {
      return pubCall('/fapi/v1/ticker/24hr', payload);
    },
    futuresPrices: function futuresPrices() {
      return pubCall('/fapi/v1/ticker/price').then(function (r) {
        return (Array.isArray(r) ? r : [r]).reduce(function (out, cur) {
          return out[cur.symbol] = cur.price, out;
        }, {});
      });
    },
    futuresAllBookTickers: function futuresAllBookTickers() {
      return pubCall('/fapi/v1/ticker/bookTicker').then(function (r) {
        return (Array.isArray(r) ? r : [r]).reduce(function (out, cur) {
          return out[cur.symbol] = cur, out;
        }, {});
      });
    },
    futuresFundingRate: function futuresFundingRate(payload) {
      return checkParams('fundingRate', payload, ['symbol']) && pubCall('/fapi/v1/fundingRate', payload);
    },
    futuresOrder: function futuresOrder(payload) {
      return _order(privCall, payload, '/fapi/v1/order');
    },
    futuresCancelOrder: function futuresCancelOrder(payload) {
      return privCall('/fapi/v1/order', payload, 'DELETE');
    },
    futuresOpenOrders: function futuresOpenOrders(payload) {
      return privCall('/fapi/v1/openOrders', payload);
    },
    futuresPositionRisk: function futuresPositionRisk(payload) {
      return privCall('/fapi/v1/positionRisk', payload);
    },
    futuresAccountBalance: function futuresAccountBalance(payload) {
      return privCall('/fapi/v2/balance', payload);
    },
    futuresPositionMode: function futuresPositionMode(payload) {
      return privCall('/fapi/v1/positionSide/dual', payload, 'GET');
    },
    futuresPositionModeChange: function futuresPositionModeChange(payload) {
      return privCall('/fapi/v1/positionSide/dual', payload, 'POST');
    }
  };
};

exports.default = _default;
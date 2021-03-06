"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.keepStreamAlive = exports.userEventHandler = void 0;

var _lodash = _interopRequireDefault(require("lodash.zipobject"));

var _httpClient = _interopRequireDefault(require("./http-client"));

var _openWebsocket = _interopRequireDefault(require("./open-websocket"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var BASE = 'wss://stream.binance.com:9443/ws';
var FUTURES = 'wss://fstream.binance.com/ws';

var depth = function depth(payload, cb) {
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var w = (0, _openWebsocket.default)("".concat(BASE, "/").concat(symbol.toLowerCase(), "@depth"));

    w.onmessage = function (msg) {
      var _JSON$parse = JSON.parse(msg.data),
          eventType = _JSON$parse.e,
          eventTime = _JSON$parse.E,
          symbol = _JSON$parse.s,
          firstUpdateId = _JSON$parse.U,
          finalUpdateId = _JSON$parse.u,
          bidDepth = _JSON$parse.b,
          askDepth = _JSON$parse.a;

      cb({
        eventType: eventType,
        eventTime: eventTime,
        symbol: symbol,
        firstUpdateId: firstUpdateId,
        finalUpdateId: finalUpdateId,
        bidDepth: bidDepth.map(function (b) {
          return (0, _lodash.default)(['price', 'quantity'], b);
        }),
        askDepth: askDepth.map(function (a) {
          return (0, _lodash.default)(['price', 'quantity'], a);
        })
      });
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var partialDepth = function partialDepth(payload, cb) {
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (_ref) {
    var symbol = _ref.symbol,
        level = _ref.level;
    var w = (0, _openWebsocket.default)("".concat(BASE, "/").concat(symbol.toLowerCase(), "@depth").concat(level));

    w.onmessage = function (msg) {
      var _JSON$parse2 = JSON.parse(msg.data),
          lastUpdateId = _JSON$parse2.lastUpdateId,
          bids = _JSON$parse2.bids,
          asks = _JSON$parse2.asks;

      cb({
        symbol: symbol,
        level: level,
        lastUpdateId: lastUpdateId,
        bids: bids.map(function (b) {
          return (0, _lodash.default)(['price', 'quantity'], b);
        }),
        asks: asks.map(function (a) {
          return (0, _lodash.default)(['price', 'quantity'], a);
        })
      });
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var candles = function candles(payload, interval, cb) {
  if (!interval || !cb) {
    throw new Error('Please pass a symbol, interval and callback.');
  }

  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var w = (0, _openWebsocket.default)("".concat(BASE, "/").concat(symbol.toLowerCase(), "@kline_").concat(interval));

    w.onmessage = function (msg) {
      var _JSON$parse3 = JSON.parse(msg.data),
          eventType = _JSON$parse3.e,
          eventTime = _JSON$parse3.E,
          symbol = _JSON$parse3.s,
          tick = _JSON$parse3.k;

      var startTime = tick.t,
          closeTime = tick.T,
          firstTradeId = tick.f,
          lastTradeId = tick.L,
          open = tick.o,
          high = tick.h,
          low = tick.l,
          close = tick.c,
          volume = tick.v,
          trades = tick.n,
          interval = tick.i,
          isFinal = tick.x,
          quoteVolume = tick.q,
          buyVolume = tick.V,
          quoteBuyVolume = tick.Q;
      cb({
        eventType: eventType,
        eventTime: eventTime,
        symbol: symbol,
        startTime: startTime,
        closeTime: closeTime,
        firstTradeId: firstTradeId,
        lastTradeId: lastTradeId,
        open: open,
        high: high,
        low: low,
        close: close,
        volume: volume,
        trades: trades,
        interval: interval,
        isFinal: isFinal,
        quoteVolume: quoteVolume,
        buyVolume: buyVolume,
        quoteBuyVolume: quoteBuyVolume
      });
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var tickerTransform = function tickerTransform(m) {
  return {
    eventType: m.e,
    eventTime: m.E,
    symbol: m.s,
    priceChange: m.p,
    priceChangePercent: m.P,
    weightedAvg: m.w,
    prevDayClose: m.x,
    curDayClose: m.c,
    closeTradeQuantity: m.Q,
    bestBid: m.b,
    bestBidQnt: m.B,
    bestAsk: m.a,
    bestAskQnt: m.A,
    open: m.o,
    high: m.h,
    low: m.l,
    volume: m.v,
    volumeQuote: m.q,
    openTime: m.O,
    closeTime: m.C,
    firstTradeId: m.F,
    lastTradeId: m.L,
    totalTrades: m.n
  };
};

var ticker = function ticker(payload, cb) {
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var w = (0, _openWebsocket.default)("".concat(BASE, "/").concat(symbol.toLowerCase(), "@ticker"));

    w.onmessage = function (msg) {
      cb(tickerTransform(JSON.parse(msg.data)));
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var allTickers = function allTickers(cb) {
  var w = new _openWebsocket.default("".concat(BASE, "/!ticker@arr@3000ms"));

  w.onmessage = function (msg) {
    var arr = JSON.parse(msg.data);
    cb(arr.map(function (m) {
      return tickerTransform(m);
    }));
  };

  return function (options) {
    return w.close(1000, 'Close handle was called', _objectSpread({
      keepClosed: true
    }, options));
  };
};

var aggTradesInternal = function aggTradesInternal(payload, cb) {
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var w = (0, _openWebsocket.default)("".concat(BASE, "/").concat(symbol.toLowerCase(), "@aggTrade"));

    w.onmessage = function (msg) {
      var _JSON$parse4 = JSON.parse(msg.data),
          eventType = _JSON$parse4.e,
          eventTime = _JSON$parse4.E,
          timestamp = _JSON$parse4.T,
          symbol = _JSON$parse4.s,
          price = _JSON$parse4.p,
          quantity = _JSON$parse4.q,
          isBuyerMaker = _JSON$parse4.m,
          wasBestPrice = _JSON$parse4.M,
          aggId = _JSON$parse4.a,
          firstId = _JSON$parse4.f,
          lastId = _JSON$parse4.l;

      cb({
        eventType: eventType,
        eventTime: eventTime,
        aggId: aggId,
        price: price,
        quantity: quantity,
        firstId: firstId,
        lastId: lastId,
        timestamp: timestamp,
        symbol: symbol,
        isBuyerMaker: isBuyerMaker,
        wasBestPrice: wasBestPrice
      });
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var tradesInternal = function tradesInternal(payload, cb) {
  var cache = (Array.isArray(payload) ? payload : [payload]).map(function (symbol) {
    var w = (0, _openWebsocket.default)("".concat(BASE, "/").concat(symbol.toLowerCase(), "@trade"));

    w.onmessage = function (msg) {
      var _JSON$parse5 = JSON.parse(msg.data),
          eventType = _JSON$parse5.e,
          eventTime = _JSON$parse5.E,
          tradeTime = _JSON$parse5.T,
          symbol = _JSON$parse5.s,
          price = _JSON$parse5.p,
          quantity = _JSON$parse5.q,
          isBuyerMaker = _JSON$parse5.m,
          maker = _JSON$parse5.M,
          tradeId = _JSON$parse5.t,
          sellerOrderId = _JSON$parse5.a,
          buyerOrderId = _JSON$parse5.b;

      cb({
        eventType: eventType,
        eventTime: eventTime,
        tradeTime: tradeTime,
        symbol: symbol,
        price: price,
        quantity: quantity,
        isBuyerMaker: isBuyerMaker,
        maker: maker,
        tradeId: tradeId,
        buyerOrderId: buyerOrderId,
        sellerOrderId: sellerOrderId
      });
    };

    return w;
  });
  return function (options) {
    return cache.forEach(function (w) {
      return w.close(1000, 'Close handle was called', _objectSpread({
        keepClosed: true
      }, options));
    });
  };
};

var aggTrades = function aggTrades(payload, cb) {
  return aggTradesInternal(payload, cb);
};

var trades = function trades(payload, cb) {
  return tradesInternal(payload, cb);
};

var userTransforms = {
  // https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md#balance-update
  balanceUpdate: function balanceUpdate(m) {
    return {
      asset: m.a,
      balanceDelta: m.d,
      clearTime: m.T,
      eventTime: m.E,
      eventType: 'balanceUpdate'
    };
  },
  // https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md#account-update
  outboundAccountInfo: function outboundAccountInfo(m) {
    return {
      eventType: 'account',
      eventTime: m.E,
      makerCommissionRate: m.m,
      takerCommissionRate: m.t,
      buyerCommissionRate: m.b,
      sellerCommissionRate: m.s,
      canTrade: m.T,
      canWithdraw: m.W,
      canDeposit: m.D,
      lastAccountUpdate: m.u,
      balances: m.B.reduce(function (out, cur) {
        out[cur.a] = {
          available: cur.f,
          locked: cur.l
        };
        return out;
      }, {})
    };
  },
  // https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md#account-update
  outboundAccountPosition: function outboundAccountPosition(m) {
    return {
      balances: m.B.map(function (_ref2) {
        var a = _ref2.a,
            f = _ref2.f,
            l = _ref2.l;
        return {
          asset: a,
          free: f,
          locked: l
        };
      }),
      eventTime: m.E,
      eventType: 'outboundAccountPosition',
      lastAccountUpdate: m.u
    };
  },
  // https://github.com/binance-exchange/binance-official-api-docs/blob/master/user-data-stream.md#order-update
  executionReport: function executionReport(m) {
    return {
      eventType: 'executionReport',
      eventTime: m.E,
      symbol: m.s,
      newClientOrderId: m.c,
      originalClientOrderId: m.C,
      side: m.S,
      orderType: m.o,
      timeInForce: m.f,
      quantity: m.q,
      price: m.p,
      executionType: m.x,
      stopPrice: m.P,
      icebergQuantity: m.F,
      orderStatus: m.X,
      orderRejectReason: m.r,
      orderId: m.i,
      orderTime: m.T,
      lastTradeQuantity: m.l,
      totalTradeQuantity: m.z,
      priceLastTrade: m.L,
      commission: m.n,
      commissionAsset: m.N,
      tradeId: m.t,
      isOrderWorking: m.w,
      isBuyerMaker: m.m,
      creationTime: m.O,
      totalQuoteTradeQuantity: m.Z,
      orderListId: m.g,
      quoteOrderQuantity: m.Q,
      lastQuoteTransacted: m.Y
    };
  }
};

var userEventHandler = function userEventHandler(cb) {
  return function (msg) {
    var _JSON$parse6 = JSON.parse(msg.data),
        type = _JSON$parse6.e,
        rest = _objectWithoutProperties(_JSON$parse6, ["e"]);

    cb(userTransforms[type] ? userTransforms[type](rest) : _objectSpread({
      type: type
    }, rest));
  };
};

exports.userEventHandler = userEventHandler;
var STREAM_METHODS = ['get', 'keep', 'close'];

var capitalize = function capitalize(str, check) {
  return check ? "".concat(str[0].toUpperCase()).concat(str.slice(1)) : str;
};

var getStreamMethods = function getStreamMethods(opts) {
  var variator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var methods = (0, _httpClient.default)(opts);
  return STREAM_METHODS.reduce(function (acc, key) {
    return [].concat(_toConsumableArray(acc), [methods["".concat(variator).concat(capitalize("".concat(key, "DataStream"), !!variator))]]);
  }, []);
};

var keepStreamAlive = function keepStreamAlive(method, listenKey) {
  return method({
    listenKey: listenKey
  });
};

exports.keepStreamAlive = keepStreamAlive;

var user = function user(opts, variator) {
  return function (cb) {
    var _getStreamMethods = getStreamMethods(opts, variator),
        _getStreamMethods2 = _slicedToArray(_getStreamMethods, 3),
        getDataStream = _getStreamMethods2[0],
        keepDataStream = _getStreamMethods2[1],
        closeDataStream = _getStreamMethods2[2];

    var currentListenKey = null;
    var int = null;
    var w = null;

    var keepAlive = function keepAlive(isReconnecting) {
      if (currentListenKey) {
        keepStreamAlive(keepDataStream, currentListenKey).catch(function () {
          closeStream({}, true);

          if (isReconnecting) {
            setTimeout(function () {
              return makeStream(true);
            }, 30e3);
          } else {
            makeStream(true);
          }
        });
      }
    };

    var closeStream = function closeStream(options, catchErrors) {
      if (currentListenKey) {
        clearInterval(int);
        var p = closeDataStream({
          listenKey: currentListenKey
        });

        if (catchErrors) {
          p.catch(function (f) {
            return f;
          });
        }

        w.close(1000, 'Close handle was called', _objectSpread({
          keepClosed: true
        }, options));
        currentListenKey = null;
      }
    };

    var makeStream = function makeStream(isReconnecting) {
      return getDataStream().then(function (_ref3) {
        var listenKey = _ref3.listenKey;
        w = (0, _openWebsocket.default)("".concat(variator === 'futures' ? FUTURES : BASE, "/").concat(listenKey));

        w.onmessage = function (msg) {
          return userEventHandler(cb)(msg);
        };

        currentListenKey = listenKey;
        int = setInterval(function () {
          return keepAlive(false);
        }, 50e3);
        keepAlive(true);
        return function (options) {
          return closeStream(options);
        };
      }).catch(function (err) {
        if (isReconnecting) {
          setTimeout(function () {
            return makeStream(true);
          }, 30e3);
        } else {
          throw err;
        }
      });
    };

    return makeStream(false);
  };
};

var _default = function _default(opts) {
  return {
    depth: depth,
    partialDepth: partialDepth,
    candles: candles,
    trades: trades,
    aggTrades: aggTrades,
    ticker: ticker,
    allTickers: allTickers,
    user: user(opts),
    marginUser: user(opts, 'margin'),
    futuresUser: user(opts, 'futures')
  };
};

exports.default = _default;
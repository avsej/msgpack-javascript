    (function() {
        var dispatcher = {
            pack: msgpackpack,
            unpack: msgpackunpack
        };
        var _bin2num = {}, _num2bin = {}, _buf = [], _idx = 0, _error = 0, _isArray = Array.isArray || function(mix) {
            return Object.prototype.toString.call(mix) === "[object Array]";
        }, _toString = String.fromCharCode, _MAX_DEPTH = 512;
        function msgpackpack(data, toString) {
            _error = 0;
            var byteArray = encode([], data, 0);
            return _error ? false : toString ? byteArrayToByteString(byteArray) : byteArray;
        }
        function msgpackunpack(data) {
            _buf = typeof data === "string" ? toByteArray(data) : data;
            _idx = -1;
            return decode();
        }
        function encode(rv, mix, depth) {
            var size, i, iz, c, pos, high, low, sign, exp, frac;
            if (mix == null) {
                rv.push(192);
            } else if (mix === false) {
                rv.push(194);
            } else if (mix === true) {
                rv.push(195);
            } else {
                switch (typeof mix) {
                  case "number":
                    if (mix !== mix) {
                        rv.push(203, 255, 255, 255, 255, 255, 255, 255, 255);
                    } else if (mix === Infinity) {
                        rv.push(203, 127, 240, 0, 0, 0, 0, 0, 0);
                    } else if (Math.floor(mix) === mix) {
                        if (mix < 0) {
                            if (mix >= -32) {
                                rv.push(224 + mix + 32);
                            } else if (mix > -128) {
                                rv.push(208, mix + 256);
                            } else if (mix > -32768) {
                                mix += 65536;
                                rv.push(209, mix >> 8, mix & 255);
                            } else if (mix > -2147483648) {
                                mix += 4294967296;
                                rv.push(210, mix >>> 24, mix >> 16 & 255, mix >> 8 & 255, mix & 255);
                            } else {
                                high = Math.floor(mix / 4294967296);
                                low = mix & 4294967295;
                                rv.push(211, high >> 24 & 255, high >> 16 & 255, high >> 8 & 255, high & 255, low >> 24 & 255, low >> 16 & 255, low >> 8 & 255, low & 255);
                            }
                        } else {
                            if (mix < 128) {
                                rv.push(mix);
                            } else if (mix < 256) {
                                rv.push(204, mix);
                            } else if (mix < 65536) {
                                rv.push(205, mix >> 8, mix & 255);
                            } else if (mix < 4294967296) {
                                rv.push(206, mix >>> 24, mix >> 16 & 255, mix >> 8 & 255, mix & 255);
                            } else {
                                high = Math.floor(mix / 4294967296);
                                low = mix & 4294967295;
                                rv.push(207, high >> 24 & 255, high >> 16 & 255, high >> 8 & 255, high & 255, low >> 24 & 255, low >> 16 & 255, low >> 8 & 255, low & 255);
                            }
                        }
                    } else {
                        sign = mix < 0;
                        sign && (mix *= -1);
                        exp = Math.log(mix) / .6931471805599453 + 1023 | 0;
                        frac = mix * Math.pow(2, 52 + 1023 - exp);
                        low = frac & 4294967295;
                        sign && (exp |= 2048);
                        high = frac / 4294967296 & 1048575 | exp << 20;
                        rv.push(203, high >> 24 & 255, high >> 16 & 255, high >> 8 & 255, high & 255, low >> 24 & 255, low >> 16 & 255, low >> 8 & 255, low & 255);
                    }
                    break;
                  case "string":
                    iz = mix.length;
                    pos = rv.length;
                    rv.push(0);
                    for (i = 0; i < iz; ++i) {
                        c = mix.charCodeAt(i);
                        if (c < 128) {
                            rv.push(c & 127);
                        } else if (c < 2048) {
                            rv.push(c >>> 6 & 31 | 192, c & 63 | 128);
                        } else if (c < 65536) {
                            rv.push(c >>> 12 & 15 | 224, c >>> 6 & 63 | 128, c & 63 | 128);
                        }
                    }
                    size = rv.length - pos - 1;
                    if (size < 32) {
                        rv[pos] = 160 + size;
                    } else if (size < 65536) {
                        rv.splice(pos, 1, 218, size >> 8, size & 255);
                    } else if (size < 4294967296) {
                        rv.splice(pos, 1, 219, size >>> 24, size >> 16 & 255, size >> 8 & 255, size & 255);
                    }
                    break;
                  default:
                    if (++depth >= _MAX_DEPTH) {
                        _error = 1;
                        return rv = [];
                    }
                    if (_isArray(mix)) {
                        size = mix.length;
                        if (size < 16) {
                            rv.push(144 + size);
                        } else if (size < 65536) {
                            rv.push(220, size >> 8, size & 255);
                        } else if (size < 4294967296) {
                            rv.push(221, size >>> 24, size >> 16 & 255, size >> 8 & 255, size & 255);
                        }
                        for (i = 0; i < size; ++i) {
                            encode(rv, mix[i], depth);
                        }
                    } else {
                        pos = rv.length;
                        rv.push(0);
                        size = 0;
                        for (i in mix) {
                            ++size;
                            encode(rv, i, depth);
                            encode(rv, mix[i], depth);
                        }
                        if (size < 16) {
                            rv[pos] = 128 + size;
                        } else if (size < 65536) {
                            rv.splice(pos, 1, 222, size >> 8, size & 255);
                        } else if (size < 4294967296) {
                            rv.splice(pos, 1, 223, size >>> 24, size >> 16 & 255, size >> 8 & 255, size & 255);
                        }
                    }
                }
            }
            return rv;
        }
        function decode() {
            var size, i, iz, c, num = 0, sign, exp, frac, ary, hash, buf = _buf, type = buf[++_idx];
            if (type >= 224) {
                return type - 256;
            }
            if (type < 192) {
                if (type < 128) {
                    return type;
                }
                if (type < 144) {
                    num = type - 128;
                    type = 128;
                } else if (type < 160) {
                    num = type - 144;
                    type = 144;
                } else {
                    num = type - 160;
                    type = 160;
                }
            }
            switch (type) {
              case 192:
                return null;
              case 194:
                return false;
              case 195:
                return true;
              case 202:
                num = buf[++_idx] * 16777216 + (buf[++_idx] << 16) + (buf[++_idx] << 8) + buf[++_idx];
                sign = num & 2147483648;
                exp = num >> 23 & 255;
                frac = num & 8388607;
                if (!num || num === 2147483648) {
                    return 0;
                }
                if (exp === 255) {
                    return frac ? NaN : Infinity;
                }
                return (sign ? -1 : 1) * (frac | 8388608) * Math.pow(2, exp - 127 - 23);
              case 203:
                num = buf[++_idx] * 16777216 + (buf[++_idx] << 16) + (buf[++_idx] << 8) + buf[++_idx];
                sign = num & 2147483648;
                exp = num >> 20 & 2047;
                frac = num & 1048575;
                if (!num || num === 2147483648) {
                    _idx += 4;
                    return 0;
                }
                if (exp === 2047) {
                    _idx += 4;
                    return frac ? NaN : Infinity;
                }
                num = buf[++_idx] * 16777216 + (buf[++_idx] << 16) + (buf[++_idx] << 8) + buf[++_idx];
                return (sign ? -1 : 1) * ((frac | 1048576) * Math.pow(2, exp - 1023 - 20) + num * Math.pow(2, exp - 1023 - 52));
              case 207:
                num = buf[++_idx] * 16777216 + (buf[++_idx] << 16) + (buf[++_idx] << 8) + buf[++_idx];
                return num * 4294967296 + buf[++_idx] * 16777216 + (buf[++_idx] << 16) + (buf[++_idx] << 8) + buf[++_idx];
              case 206:
                num += buf[++_idx] * 16777216 + (buf[++_idx] << 16);
              case 205:
                num += buf[++_idx] << 8;
              case 204:
                return num + buf[++_idx];
              case 211:
                num = buf[++_idx];
                if (num & 128) {
                    return ((num ^ 255) * 72057594037927940 + (buf[++_idx] ^ 255) * 281474976710656 + (buf[++_idx] ^ 255) * 1099511627776 + (buf[++_idx] ^ 255) * 4294967296 + (buf[++_idx] ^ 255) * 16777216 + (buf[++_idx] ^ 255) * 65536 + (buf[++_idx] ^ 255) * 256 + (buf[++_idx] ^ 255) + 1) * -1;
                }
                return num * 72057594037927940 + buf[++_idx] * 281474976710656 + buf[++_idx] * 1099511627776 + buf[++_idx] * 4294967296 + buf[++_idx] * 16777216 + buf[++_idx] * 65536 + buf[++_idx] * 256 + buf[++_idx];
              case 210:
                num = buf[++_idx] * 16777216 + (buf[++_idx] << 16) + (buf[++_idx] << 8) + buf[++_idx];
                return num < 2147483648 ? num : num - 4294967296;
              case 209:
                num = (buf[++_idx] << 8) + buf[++_idx];
                return num < 32768 ? num : num - 65536;
              case 208:
                num = buf[++_idx];
                return num < 128 ? num : num - 256;
              case 219:
                num += buf[++_idx] * 16777216 + (buf[++_idx] << 16);
              case 218:
                num += (buf[++_idx] << 8) + buf[++_idx];
              case 160:
                for (ary = [], i = _idx, iz = i + num; i < iz; ) {
                    c = buf[++i];
                    ary.push(c < 128 ? c : c < 224 ? (c & 31) << 6 | buf[++i] & 63 : (c & 15) << 12 | (buf[++i] & 63) << 6 | buf[++i] & 63);
                }
                _idx = i;
                return ary.length < 10240 ? _toString.apply(null, ary) : byteArrayToByteString(ary);
              case 223:
                num += buf[++_idx] * 16777216 + (buf[++_idx] << 16);
              case 222:
                num += (buf[++_idx] << 8) + buf[++_idx];
              case 128:
                hash = {};
                while (num--) {
                    size = buf[++_idx] - 160;
                    for (ary = [], i = _idx, iz = i + size; i < iz; ) {
                        c = buf[++i];
                        ary.push(c < 128 ? c : c < 224 ? (c & 31) << 6 | buf[++i] & 63 : (c & 15) << 12 | (buf[++i] & 63) << 6 | buf[++i] & 63);
                    }
                    _idx = i;
                    hash[_toString.apply(null, ary)] = decode();
                }
                return hash;
              case 221:
                num += buf[++_idx] * 16777216 + (buf[++_idx] << 16);
              case 220:
                num += (buf[++_idx] << 8) + buf[++_idx];
              case 144:
                ary = [];
                while (num--) {
                    ary.push(decode());
                }
                return ary;
            }
            return;
        }
        function byteArrayToByteString(byteArray) {
            try {
                return _toString.apply(this, byteArray);
            } catch (err) {
                err;
            }
            var rv = [], i = 0, iz = byteArray.length, num2bin = _num2bin;
            for (;i < iz; ++i) {
                rv[i] = num2bin[byteArray[i]];
            }
            return rv.join("");
        }
        function toByteArray(data) {
            var rv = [], bin2num = _bin2num, remain, ary = data.split(""), i = -1, iz;
            iz = ary.length;
            remain = iz % 8;
            while (remain--) {
                ++i;
                rv[i] = bin2num[ary[i]];
            }
            remain = iz >> 3;
            while (remain--) {
                rv.push(bin2num[ary[++i]], bin2num[ary[++i]], bin2num[ary[++i]], bin2num[ary[++i]], bin2num[ary[++i]], bin2num[ary[++i]], bin2num[ary[++i]], bin2num[ary[++i]]);
            }
            return rv;
        }
        (function() {
            var i = 0, v;
            for (;i < 256; ++i) {
                v = _toString(i);
                _bin2num[v] = i;
                _num2bin[i] = v;
            }
            for (i = 128; i < 256; ++i) {
                _bin2num[_toString(63232 + i)] = i;
            }
        })();
        return dispatcher;
    })();

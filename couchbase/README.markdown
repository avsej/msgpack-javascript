This directory contains modified `msgpack.codec.js` for Couchbase needs.

```diff
--- msgpack.codec.js	2013-06-17 13:33:57.019471185 +0300
+++ couchbase/msgpack.codec.js	2013-06-17 13:32:49.057124514 +0300
@@ -3,9 +3,9 @@
 // === msgpack ===
 // MessagePack -> http://msgpack.sourceforge.net/

-this.msgpack || (function(globalScope) {
+(function() {

-globalScope.msgpack = {
+dispatcher = {
     pack:       msgpackpack,    // msgpack.pack(data:Mix,
                                 //              toString:Boolean = false):ByteArray/ByteString/false
                                 //  [1][mix to String]    msgpack.pack({}, true) -> "..."
@@ -425,4 +425,5 @@
     }
 })();

-})(this);
+return dispatcher;
+})();
```

Prepare contents to insert into `/couchdb/src/mapreduce/mapreduce.cc`

    npm install uglifyjs
    uglifyjs --beautify -o msgpack.codec.cc msgpack.codec.js
    vim -u NONE -U NONE -E -s msgpack.codec.cc <<EOF
      :%s/^\n//g
      :%s/"/\\\\"/g
      :%s/^/    "/g
      :%s/\$/"/g
      :\$s/\$/;/
      :0insert
    static const char *MSGPACK_FUNCTION_STRING =
    .
      :write!
    EOF

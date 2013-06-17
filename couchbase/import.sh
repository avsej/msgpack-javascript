#!/bin/sh

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

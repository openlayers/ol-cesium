#!/bin/bash

cat << EOF
<html>
<body>
EOF

echo "<ul>"
for i in examples/*.html
do
  filename="`basename $i`"
  echo "<li><a href='./${filename}'>${filename}</a></li>"
done
echo "</ul>"

cat << EOF
</body>
</html>
EOF

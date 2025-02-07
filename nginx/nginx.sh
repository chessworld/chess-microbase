cd /usr/share/nginx/html
cp robots.$NGINX_ENV.txt robots.txt
nginx -g 'daemon off;'

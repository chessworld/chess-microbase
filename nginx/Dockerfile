FROM nginx

RUN apt-get update -qq && apt-get install -y curl 

RUN rm -rf /usr/share/nginx/html/* 

#RUN mkdir -p /etc/nginx/certificates && \
#    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#      -keyout /etc/nginx/certificates/nginx-server.key \
#      -out /etc/nginx/certificates/nginx-server.crt \
#      -subj "/C=AU/ST=Victoria/L=Victoria/O=ChessMicrobase/OU=IT Department/CN=localhost"
#
#VOLUME /etc/nginx/certificates
#VOLUME /usr/share/nginx/html/host

ADD nginx.conf /etc/nginx/nginx.conf
ADD nginx.sh /usr/share/nginx.sh
ADD public /usr/share/nginx/html


CMD /bin/bash /usr/share/nginx.sh

HEALTHCHECK CMD curl --fail http://localhost/robots.txt || exit 1

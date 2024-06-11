FROM caddy:2.8.4-alpine
RUN cat > /etc/caddy/Caddyfile <<EOF
:80 {
	respond "Hello World"
}
EOF
RUN caddy validate --config /etc/caddy/Caddyfile
EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
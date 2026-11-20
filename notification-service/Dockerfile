
FROM php:8.4-apache

WORKDIR /var/www/html

# Install MySQL support and OPcache
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && docker-php-ext-install pdo_mysql opcache \
    && rm -rf /var/lib/apt/lists/*

# Enable production PHP configuration
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Configure Apache for Laravel
RUN a2enmod rewrite \
    && sed -i 's|/var/www/html|/var/www/html/public|g' \
       /etc/apache2/sites-available/000-default.conf \
    && printf '%s\n' \
       '<Directory /var/www/html/public>' \
       '    AllowOverride All' \
       '    Require all granted' \
       '    Options -Indexes +FollowSymLinks' \
       '</Directory>' \
       > /etc/apache2/conf-available/laravel.conf \
    && a2enconf laravel

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# Copy Laravel application
COPY . .

# Install production dependencies
RUN composer install --no-dev \
    --optimize-autoloader \
    --prefer-dist \
    --no-interaction

# Configure directory permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 80

# Optimize Laravel after environment variables are injected
CMD ["sh", "-c", "php artisan config:cache && php artisan route:cache && php artisan event:cache && exec apache2-foreground"]

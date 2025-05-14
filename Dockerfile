FROM python:3.13

RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем скрипт wait-for-it.sh (если используете его)
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

COPY . .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD sh -c "/wait-for-it.sh db:5432 --timeout=30 --strict -- \
    && python manage.py migrate \
    && uvicorn FarmIoTCore.asgi:application --host 0.0.0.0 --port 8000"

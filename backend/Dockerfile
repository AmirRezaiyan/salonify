FROM python:3.11-slim
WORKDIR /app
COPY . /app
RUN pip install --upgrade pip && pip install -r requirements.txt
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["gunicorn", "salonify_backend.wsgi:application", "-b", "0.0.0.0:8000"]
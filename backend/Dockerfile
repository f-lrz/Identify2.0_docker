# Backend do IDENTIFY 2.0: API FastAPI + os dois modelos (detector e saude).
# Roda em CPU: o torch instalado e a versao de CPU, bem menor que a de GPU.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # o Ultralytics grava configuracoes na pasta do usuario; aponta para um
    # lugar gravavel, ja que o container roda sem root
    YOLO_CONFIG_DIR=/tmp/Ultralytics

# O ultralytics instala o opencv "completo", que precisa destas bibliotecas
# do sistema mesmo sem tela (sem elas o `import cv2` falha).
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencias primeiro, numa camada propria: mudar o codigo nao reinstala o
# torch (~1 GB de download) a cada build.
# O --extra-index-url e o que traz o torch de CPU; sem ele viriam ~4,5 GB de
# bibliotecas de GPU inuteis aqui.
COPY requirements.txt .
RUN pip install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

COPY app/ app/
COPY static/ static/
COPY models/ models/

# Sem root dentro do container.
RUN useradd --create-home --uid 1000 identify && chown -R identify /app
USER identify

EXPOSE 8000

# UM worker de proposito: a inferencia ja usa todos os nucleos da CPU, e cada
# worker carregaria sua propria copia dos modelos (~1,5 GB de RAM cada).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

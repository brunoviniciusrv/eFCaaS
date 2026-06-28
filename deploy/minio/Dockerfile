FROM minio/minio:latest

ENV MINIO_ROOT_USER=efcaas
ENV MINIO_ROOT_PASSWORD=efcaas123456

EXPOSE 9000

CMD ["server", "/data", "--console-address", ":9001"]

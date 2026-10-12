## Build Docker image

```bash
docker build -t car-price-recalculator .
```

## Run once

```bash
docker run --rm \
  --env-file .env \
  --name car-price-recalculator \
  car-price-recalculator
```

Because `--rm` removes the container after completion, run without `--rm` if you want to inspect it later with `docker logs`.

## Run and keep logs accessible

```bash
docker run \
  --env-file .env \
  --name car-price-recalculator \
  car-price-recalculator
```

Then:

```bash
docker logs -f car-price-recalculator
```

Before the next run:

```bash
docker rm car-price-recalculator
```
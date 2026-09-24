# 932402.breydenbakh.erik.lab7

Лабораторная работа №7 по курсу «Веб-технологии», ТГУ, группа 932402.
Вариант 2 - «Товары» (каталог с фильтрацией по цене).

## Возможности

REST API над таблицей `products` (SQLite, `better-sqlite3`): `id`, `name`, `price`, `stock`.

- `GET /api/products` - список товаров.
  - `?minPrice=100&maxPrice=500` - фильтрация по диапазону цены.
- `POST /api/products` - создать товар. Тело: `{ "name": string, "price": number, "stock": integer }`.
- `PATCH /api/products/:id` - изменить **только** `stock`. Тело: `{ "stock": integer }`.
- `DELETE /api/products/:id` - удалить товар.

Валидация: `name` не пустой, `price >= 0`, `stock >= 0` (целое) - иначе `400`. Обращение
к несуществующему `id` (`PATCH`/`DELETE`) → `404`. Все запросы к БД - через
параметризованные `?`-плейсхолдеры (без конкатенации значений в SQL).

## Как запустить

```bash
npm install
node server.js
```

Сервер стартует на порту `3000` (или `$PORT`), в консоли - `Server started on port 3000`.
БД (`app.db`) создаётся автоматически при первом запуске, в репозиторий не входит
(`.gitignore`) - данные живут локально и переживают перезапуски сервера.

### Примеры запросов

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Клавиатура","price":1500,"stock":10}'

curl "http://localhost:3000/api/products?minPrice=1000&maxPrice=2000"

curl -X PATCH http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"stock":5}'

curl -X DELETE http://localhost:3000/api/products/1
```

## Стек

Node.js, Express 5, better-sqlite3.

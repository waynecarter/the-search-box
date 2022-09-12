SELECT meta().id AS id, name, image, price
FROM   products
WHERE  type = 'product'
       AND CASE
             WHEN len($search) > 0 THEN SEARCH(products, $search, { "index": "products" })
             ELSE TRUE
           END
OFFSET CASE
         WHEN $offset > 0 THEN $offset
         ELSE 0
       END
LIMIT  CASE
         WHEN $limit > 0 THEN $limit
         ELSE 10
       END
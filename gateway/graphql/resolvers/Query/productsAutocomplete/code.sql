SELECT raw(name)
FROM   products
WHERE  type = 'product'
       AND CASE
             WHEN len($search) > 0 THEN SEARCH(products, $search, { "index": "autocomplete" })
             ELSE TRUE
           END
LIMIT  10
# lomnia

1. Install dependencies

```
npm i
```

2. Spin up local postgres db using docker

```
docker compose up
```

3. Access PGAdmin in http://localhost:8888

   - Email: lomnia@lomnia.com
   - Password: lomnia

4. Connect to the database:

   - Username: lomnia
   - Password: lomnia
   - Host: db

5. Rename the `.env.example` file to `.env`

6. Run migrations with `npm run migration:up`

# Notes

- knex is used to manage migrations
- `ts-node` is required for knex to properly work, but `tsx` is what is actually used for everything else
- `postgres` is used by drizzle, but `pg` is required by knex (feels like I need to consolidate this)

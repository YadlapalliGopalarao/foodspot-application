# Draft REST contracts — to finalize during Laravel development

The frontend defaults to demo mode. Four `VITE_*_API` variables identify service base URLs. Same-origin prefixes are defaults; a future gateway or local services must route them. With different origins, configure Laravel CORS narrowly. Do not put secrets in VITE variables.

| Service | Endpoint relative to base URL | Request / response |
| --- | --- | --- |
| User | POST /register | `{name,email,password}` -> `{user:{id,name,email,role},token}` |
| User | POST /login | `{email,password}` -> same session shape |
| User | POST /logout | Bearer token -> 204 |
| Food | GET /foods | Array or `{data:[...]}` of `{id,name,price,category,description,image_url,emoji}` |
| Food | POST /foods | Food fields -> food object; admin only |
| Food | PUT /foods/{id} | Food fields -> food object; admin only |
| Food | DELETE /foods/{id} | Admin only; 204 |
| Order | GET /orders | Current user's orders, array or `{data:[...]}` |
| Order | POST /orders | `{items:[{food_id,quantity}]}` -> created order |
| Order | PATCH /orders/{id}/cancel | Current user's eligible order -> updated order |
| Notification | GET /notifications | Current user's `{id,message,created_at}` entries |

An order contains `{id,user_id,items:[{id,name,price,quantity}],total,status,created_at}`. Store purchased prices as snapshots; compute totals on the server; never trust the frontend total, role or user ID. Use a real database, validate authorization for every protected endpoint, and validate the bearer token across services. The order service should generate real notification events; the browser does not create real notification records. The schema, error handling, token format and cross-service verification will be finalized with the backend. One Amazon RDS MySQL instance is planned with logical databases per service.
